import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getPayPalOrder, isPayPalConfigured, paypalOrderAmount } from '@/lib/paypal';
import { createAdminClient } from '@/lib/supabase-server';

/**
 * POST /api/webhooks/paypal
 *
 * Handles PayPal webhook events. This is a safety-net for when the return-page
 * capture fails (customer closes tab, network drop, etc.). The primary flow is
 * the capture route called from the return page.
 *
 * Events handled:
 * - PAYMENT.CAPTURE.COMPLETED — ensures the Supabase order exists.
 * - PAYMENT.CAPTURE.DENIED / REFUNDED — updates order status.
 *
 * Webhook signature verification uses the PayPal webhook ID stored in
 * PAYPAL_WEBHOOK_ID. Without it we reject all events (defence-in-depth).
 */
export async function POST(req: Request) {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 });
  }

  // ── Verify webhook signature ───────────────────────────────────────────
  // PayPal sends several headers for verification. For production we verify
  // against the PayPal API; in development we log and process anyway.
  const webhookId = env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.warn('[paypal-webhook] PAYPAL_WEBHOOK_ID not set — rejecting event');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 403 });
  }

  const transmissionId = req.headers.get('paypal-transmission-id');
  const transmissionTime = req.headers.get('paypal-transmission-time');
  const certUrl = req.headers.get('paypal-cert-url');
  const authAlgo = req.headers.get('paypal-auth-algo');
  const transmissionSig = req.headers.get('paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !transmissionSig) {
    return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 400 });
  }

  let event: {
    event_type?: string;
    resource?: {
      id?: string;
      status?: string;
      supplementary_data?: {
        related_ids?: { order_id?: string };
      };
      amount?: { value?: string; currency_code?: string };
    };
  };

  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // ── Verify with PayPal API ─────────────────────────────────────────────
  // In production, verify the webhook signature via PayPal's verification API.
  // This prevents spoofed webhooks.
  try {
    const verifyRes = await verifyWebhookSignature({
      authAlgo: authAlgo ?? '',
      certUrl: certUrl ?? '',
      transmissionId,
      transmissionSig,
      transmissionTime,
      webhookId,
      webhookEvent: event,
    });

    if (!verifyRes.verified) {
      console.error('[paypal-webhook] Signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch (verifyError) {
    console.error('[paypal-webhook] Verification API error:', verifyError);
    // In sandbox, PayPal verification can be flaky. Log and continue.
    if (env.PAYPAL_ENV === 'live') {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }
  }

  console.log(`🔔 PayPal Webhook: ${event.event_type}`);

  const admin = await createAdminClient();

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED': {
      const captureId = event.resource?.id;
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;

      if (!orderId) {
        console.warn('[paypal-webhook] CAPTURE.COMPLETED without order_id');
        break;
      }

      // Check if the order already exists (return-page capture beat us)
      const { data: existing } = await admin
        .from('orders')
        .select('id, status')
        .eq('paypal_order_id', orderId)
        .maybeSingle();

      if (existing) {
        // Update capture ID if missing and ensure status is processing
        if (existing.status === 'on-hold') {
          await admin
            .from('orders')
            .update({
              status: 'processing',
              paypal_capture_id: captureId ?? existing.id.toString(),
            })
            .eq('id', existing.id);
        }
        console.log(`⏭️ PayPal order ${orderId} already exists as #${existing.id}`);
        break;
      }

      // The return-page capture failed — create the order from webhook data.
      // Fetch the full order from PayPal for details.
      try {
        const ppOrder = await getPayPalOrder(orderId);
        const amount = paypalOrderAmount(ppOrder);
        const totalAmount = amount ? parseFloat(amount.value) : 0;
        const payerEmail = ppOrder.payer?.email_address;

        // Resolve profile
        let profileId: number | null = null;
        if (payerEmail) {
          const { data: byEmail } = await admin
            .from('profiles')
            .select('id')
            .eq('email', payerEmail)
            .maybeSingle();
          profileId = byEmail?.id ?? null;
        }

        const ppShipping = ppOrder.purchase_units?.[0]?.shipping;
        const ppAddress = ppShipping?.address;
        const address = ppAddress
          ? {
              first_name: ppOrder.payer?.name?.given_name ?? '',
              last_name: ppOrder.payer?.name?.surname ?? '',
              email: payerEmail ?? '',
              line1: ppAddress.address_line_1 ?? '',
              line2: ppAddress.address_line_2 ?? undefined,
              city: ppAddress.admin_area_2 ?? '',
              state: ppAddress.admin_area_1 ?? undefined,
              postal_code: ppAddress.postal_code ?? '',
              country: ppAddress.country_code ?? 'NZ',
            }
          : null;

        const { data: order, error: orderError } = await admin
          .from('orders')
          .insert({
            customer_id: profileId,
            status: 'processing',
            currency: amount?.currencyCode ?? 'NZD',
            total_amount: totalAmount,
            payment_method: 'paypal',
            paypal_order_id: orderId,
            paypal_capture_id: captureId,
            billing_address: address,
            shipping_address: address,
            admin_notes: 'PayPal payment captured via webhook (return-page missed).',
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (orderError) {
          // Unique constraint race — safe to ignore
          if ((orderError as { code?: string }).code === '23505') {
            console.log(`⏭️ PayPal order ${orderId} race — already created`);
            break;
          }
          console.error('[paypal-webhook] Order insert failed:', orderError);
          break;
        }

        await admin.from('order_items').insert({
          order_id: order.id,
          product_name: `PayPal order ${orderId}`,
          quantity: 1,
          total: totalAmount,
        });

        console.log(`✅ Created PayPal order #${order.id} from webhook`);
      } catch (fetchError) {
        console.error('[paypal-webhook] Could not fetch PayPal order:', fetchError);
      }
      break;
    }

    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.REFUNDED': {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
      if (!orderId) break;

      const newStatus = event.event_type === 'PAYMENT.CAPTURE.DENIED' ? 'failed' : 'refunded';

      const { data: existing } = await admin
        .from('orders')
        .select('id')
        .eq('paypal_order_id', orderId)
        .maybeSingle();

      if (existing) {
        await admin.from('orders').update({ status: newStatus }).eq('id', existing.id);
        console.log(`🔄 PayPal order #${existing.id} → ${newStatus}`);
      }
      break;
    }

    default:
      console.log(`⏭️ Unhandled PayPal event: ${event.event_type}`);
  }

  return NextResponse.json({ received: true });
}

// ── PayPal webhook signature verification ────────────────────────────────

interface VerifyInput {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  webhookEvent: unknown;
}

async function verifyWebhookSignature(input: VerifyInput): Promise<{ verified: boolean }> {
  const baseUrl =
    env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  // Get an access token
  const basic = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString(
    'base64'
  );

  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenRes.ok) {
    throw new Error(`PayPal token request failed: ${tokenRes.status}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error('PayPal did not return an access token for verification');
  }

  const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: input.authAlgo,
      cert_url: input.certUrl,
      transmission_id: input.transmissionId,
      transmission_sig: input.transmissionSig,
      transmission_time: input.transmissionTime,
      webhook_id: input.webhookId,
      webhook_event: input.webhookEvent,
    }),
  });

  if (!verifyRes.ok) {
    throw new Error(`PayPal verification failed: ${verifyRes.status}`);
  }

  const result = (await verifyRes.json()) as {
    verification_status?: string;
  };

  return { verified: result.verification_status === 'SUCCESS' };
}
