import { NextResponse } from 'next/server';
import { SHIPPING_RATES } from '@/config/shipping';
import { orderReference } from '@/lib/bank-transfer-order';
import { env } from '@/lib/env';
import {
  capturePayPalOrder,
  getPayPalOrder,
  isPayPalConfigured,
  paypalCaptureId,
  paypalCaptureStatus,
  paypalOrderAmount,
  type PayPalOrder,
} from '@/lib/paypal';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-server';

/**
 * POST /api/checkout/paypal/capture
 *
 * Called from the PayPal return page after the customer approves payment.
 * Captures the PayPal order, creates the Supabase order + items, and
 * returns the reference for the success UI.
 *
 * Idempotent: if the order already exists (double-click, webhook beat us),
 * returns the existing reference without creating a duplicate.
 */
export async function POST(req: Request) {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: 'PayPal is not configured.' }, { status: 503 });
  }

  const gate = rateLimit(clientKey(req.headers, 'paypal-capture'), 10, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } }
    );
  }

  try {
    const body = await req.json();
    const { paypalOrderId, promoCode, shippingMethodId, userId } = body;

    if (!paypalOrderId || typeof paypalOrderId !== 'string') {
      return NextResponse.json({ error: 'Missing PayPal order ID.' }, { status: 400 });
    }

    const admin = await createAdminClient();

    // ── Idempotency: check if we already have this PayPal order ──────────
    const { data: existing } = await admin
      .from('orders')
      .select('id')
      .eq('paypal_order_id', paypalOrderId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        orderId: existing.id,
        reference: orderReference(existing.id),
        alreadyProcessed: true,
      });
    }

    // ── Capture the PayPal order ─────────────────────────────────────────
    let ppOrder: PayPalOrder;
    try {
      ppOrder = await capturePayPalOrder(paypalOrderId);
    } catch (captureError) {
      console.error('[paypal-capture] Capture failed:', captureError);

      // If capture fails, check if it was already captured (race with webhook)
      try {
        ppOrder = await getPayPalOrder(paypalOrderId);
        const status = paypalCaptureStatus(ppOrder);
        if (status !== 'COMPLETED') {
          return NextResponse.json(
            { error: 'PayPal payment could not be captured. Please contact us.' },
            { status: 502 }
          );
        }
        // Fall through — already captured, we can still create the order.
      } catch {
        return NextResponse.json(
          { error: 'PayPal payment could not be verified. Please contact us.' },
          { status: 502 }
        );
      }
    }

    // ── Verify capture status ────────────────────────────────────────────
    const captureStatus = paypalCaptureStatus(ppOrder);
    if (ppOrder.status !== 'COMPLETED' && captureStatus !== 'COMPLETED') {
      console.error('[paypal-capture] Unexpected status:', ppOrder.status, captureStatus);
      return NextResponse.json(
        {
          error: `PayPal payment status: ${ppOrder.status ?? captureStatus ?? 'unknown'}. Please contact us if you were charged.`,
        },
        { status: 400 }
      );
    }

    const capturedId = paypalCaptureId(ppOrder);
    const amount = paypalOrderAmount(ppOrder);
    const totalAmount = amount ? parseFloat(amount.value) : 0;

    // ── Resolve shipping rate ────────────────────────────────────────────
    const shippingRate = SHIPPING_RATES.find((r) => r.id === shippingMethodId) ?? SHIPPING_RATES[0];

    // ── Resolve profile ──────────────────────────────────────────────────
    let profileId: number | null = null;
    const payerEmail = ppOrder.payer?.email_address;

    if (userId) {
      const { data: byUser } = await admin
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      profileId = byUser?.id ?? null;
    }

    if (!profileId && payerEmail) {
      const { data: byEmail } = await admin
        .from('profiles')
        .select('id')
        .eq('email', payerEmail)
        .maybeSingle();
      profileId = byEmail?.id ?? null;
    }

    // ── Build shipping address from PayPal ───────────────────────────────
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

    // ── Create Supabase order ────────────────────────────────────────────
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        customer_id: profileId,
        status: 'processing',
        currency: amount?.currencyCode ?? 'NZD',
        total_amount: totalAmount,
        payment_method: 'paypal',
        paypal_order_id: paypalOrderId,
        paypal_capture_id: capturedId,
        billing_address: address,
        shipping_address: address,
        coupon_code: promoCode?.toUpperCase() ?? null,
        admin_notes: `PayPal payment captured. Shipping: ${shippingRate.name}.`,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (orderError) {
      // Unique constraint race (webhook beat us)
      if (
        typeof orderError === 'object' &&
        orderError !== null &&
        'code' in orderError &&
        (orderError as { code?: string }).code === '23505'
      ) {
        const { data: raced } = await admin
          .from('orders')
          .select('id')
          .eq('paypal_order_id', paypalOrderId)
          .maybeSingle();
        if (raced) {
          return NextResponse.json({
            orderId: raced.id,
            reference: orderReference(raced.id),
            alreadyProcessed: true,
          });
        }
      }

      console.error('[paypal-capture] Order insert failed:', orderError);
      return NextResponse.json(
        {
          error:
            'Payment received but order creation failed. Please contact us — you will not be charged twice.',
        },
        { status: 500 }
      );
    }

    // ── Reconstruct line items from PayPal purchase units ─────────────────
    // PayPal doesn't carry per-item details in the basic flow, so we look up
    // the invoice_id to match — but since we don't pass line items to PayPal,
    // we create a single summary line item. For a richer flow, the checkout
    // route could store a cart snapshot in a temp table keyed by invoice_id.
    const { error: itemsError } = await admin.from('order_items').insert({
      order_id: order.id,
      product_name: `PayPal order ${paypalOrderId}`,
      quantity: 1,
      total: totalAmount,
    });

    if (itemsError) {
      console.error('[paypal-capture] Order items insert failed:', itemsError);
      // Don't fail the whole request — the order exists, items can be backfilled.
    }

    // ── Email notification (best-effort) ─────────────────────────────────
    try {
      if (env.RESEND_API_KEY && payerEmail) {
        const resendFrom = env.RESEND_FROM_EMAIL ?? 'orders@catch-22.co.nz';
        const reference = orderReference(order.id);

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [payerEmail],
            subject: `Catch-22 Order Confirmed — ${reference}`,
            text: [
              `Kia ora!`,
              ``,
              `Your PayPal payment has been received. Here are your order details:`,
              ``,
              `Order Reference: ${reference}`,
              `Total: $${totalAmount.toFixed(2)} NZD`,
              `Payment: PayPal`,
              ``,
              `We'll get your order packed and shipped shortly.`,
              ``,
              `Tight lines!`,
              `The Catch-22 Team`,
              `https://catch-22.co.nz`,
            ].join('\n'),
          }),
        });
      }
    } catch (emailError) {
      console.error('[paypal-capture] Email notification failed:', emailError);
    }

    return NextResponse.json({
      orderId: order.id,
      reference: orderReference(order.id),
    });
  } catch (error) {
    console.error('[paypal-capture] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong finalising your payment. Please contact us.' },
      { status: 500 }
    );
  }
}
