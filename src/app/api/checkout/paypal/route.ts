import { NextResponse } from 'next/server';
import { SHIPPING_RATES } from '@/config/shipping';
import { roundMoney } from '@/lib/bank-transfer-order';
import { validateCartItems, validatePromoCode } from '@/lib/checkout-validation';
import { env } from '@/lib/env';
import { isPayPalConfigured, createPayPalOrder, paypalApproveUrl } from '@/lib/paypal';
import { resolvePromoCode } from '@/lib/promo';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { createAdminClient, createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/checkout/paypal
 *
 * Creates a PayPal order via the REST v2 API and returns the approval URL
 * the frontend should redirect the customer to. Mirrors the Stripe checkout
 * route's validation (server-side price integrity, promo codes, stock checks)
 * but targets the PayPal flow instead.
 *
 * Requires PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET environment variables.
 */
export async function POST(req: Request) {
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: 'PayPal is not available. Please choose another payment method.' },
      { status: 503 }
    );
  }

  // Same budget as the Stripe path: 10 / min / IP.
  const gate = rateLimit(clientKey(req.headers, 'paypal-checkout'), 10, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } }
    );
  }

  try {
    const body = await req.json();
    const { items: rawItems, promoCode, shippingMethodId } = body;

    // ── Validate cart items ──────────────────────────────────────────────
    const cartCheck = validateCartItems(rawItems);
    if (!cartCheck.ok) {
      return NextResponse.json({ error: cartCheck.failure.message }, { status: 400 });
    }
    const items = cartCheck.items;

    const promoCheck = validatePromoCode(promoCode);
    if (!promoCheck.ok) {
      return NextResponse.json({ error: promoCheck.failure.message }, { status: 400 });
    }

    // ── Resolve shipping ─────────────────────────────────────────────────
    const shippingRate = SHIPPING_RATES.find((r) => r.id === shippingMethodId) ?? SHIPPING_RATES[0];

    // ── Price integrity from the catalog ──────────────────────────────────
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const productIds = items.map((item) => item.id);
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, name, price, slug, stock_status')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      console.error('[paypal] Product lookup failed:', dbError);
      return NextResponse.json({ error: 'Failed to verify products' }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of items) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 });
      }
      if (dbProduct.stock_status !== 'instock') {
        return NextResponse.json(
          { error: `Out of stock: ${dbProduct.name}`, productId: item.id },
          { status: 409 }
        );
      }
    }

    const subtotal = roundMoney(
      items.reduce((sum, item) => {
        const dbProduct = productMap.get(item.id);
        return sum + Number(dbProduct?.price ?? 0) * item.quantity;
      }, 0)
    );

    // ── Promo code ───────────────────────────────────────────────────────
    let discount = 0;
    let resolvedPromoCode: string | undefined;

    if (promoCode && String(promoCode).trim().length > 0) {
      const admin = await createAdminClient();
      const resolved = await resolvePromoCode(admin, String(promoCode), subtotal);
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: 400 });
      }
      discount = resolved.promo.discount;
      resolvedPromoCode = resolved.promo.code;
    }

    const shippingAmount = roundMoney(shippingRate.amount / 100);
    const total = Math.max(0, roundMoney(subtotal + shippingAmount - discount));

    if (total <= 0) {
      return NextResponse.json(
        { error: 'Order total must be greater than zero for PayPal.' },
        { status: 400 }
      );
    }

    // ── Build PayPal invoice ID from cart signature ───────────────────────
    // Deterministic so double-clicks yield the same PayPal order rather than
    // duplicates. PayPal enforces invoice_id uniqueness per merchant.
    const cartSig = items
      .map((i) => `${i.id}x${i.quantity}`)
      .sort()
      .join(',');
    const invoiceId = `c22-${Date.now()}-${cartSig.slice(0, 30)}`;

    // ── Resolve return/cancel URLs ───────────────────────────────────────
    const origin = resolveReturnOrigin(req);
    const returnParams = new URLSearchParams();
    if (resolvedPromoCode) returnParams.set('promo', resolvedPromoCode);
    if (shippingMethodId) returnParams.set('shipping', shippingMethodId);
    if (user?.id) returnParams.set('userId', user.id);
    const returnParamStr = returnParams.toString();

    const returnUrl = `${origin}/checkout/paypal/return${returnParamStr ? `?${returnParamStr}` : ''}`;
    const cancelUrl = `${origin}/cart`;

    // ── Create PayPal order ──────────────────────────────────────────────
    const ppOrder = await createPayPalOrder({
      total,
      currency: 'NZD',
      invoiceId,
      referenceId: 'catch22',
      returnUrl,
      cancelUrl,
    });

    const approveUrl = paypalApproveUrl(ppOrder);
    if (!approveUrl) {
      console.error('[paypal] No approval URL in PayPal response:', ppOrder);
      return NextResponse.json(
        { error: 'PayPal did not return a checkout link. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: approveUrl, orderId: ppOrder.id });
  } catch (error) {
    console.error('[paypal] Checkout error:', error);
    const message = error instanceof Error ? error.message : 'PayPal checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Origin resolution — same logic as the Stripe checkout route.
 */
function resolveReturnOrigin(req: Request): string {
  const raw = req.headers.get('origin');
  if (
    raw &&
    (/^https:\/\/([\w-]+\.)*catch-22\.co\.nz$/.test(raw) ||
      /^https:\/\/[\w-]+\.vercel\.app$/.test(raw))
  ) {
    return raw;
  }
  return env.NEXT_PUBLIC_SITE_URL || 'https://catch-22.co.nz';
}
