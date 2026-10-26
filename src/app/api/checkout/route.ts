import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeShippingOptions } from '@/config/shipping';
import { roundMoney } from '@/lib/bank-transfer-order';
import { validateCartItems, validatePromoCode } from '@/lib/checkout-validation';
import { env } from '@/lib/env';
import type { ResolvedPromo } from '@/lib/promo';
import { resolvePromoCode } from '@/lib/promo';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { getOrCreateStripeCoupon } from '@/lib/stripe-coupons';
import { createAdminClient, createServerClient } from '@/lib/supabase-server';

const STRIPE_API_VERSION = '2026-08-26.dahlia' as const;

/**
 * Success/cancel redirects must be absolute HTTPS URLs or the Stripe SDK
 * rejects the session ("An explicit scheme must be provided"). The Origin
 * header is unreliable (proxies, privacy modes, non-browser clients), so
 * validate it against known-good hosts and fall back to the canonical site.
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

export async function POST(req: Request) {
  // 10 checkout sessions / minute / IP — session creation is not free
  // (Stripe API quota + email/payment pressure). In-memory per isolate.
  const gate = rateLimit(clientKey(req.headers, 'checkout'), 10, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } }
    );
  }

  try {
    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: STRIPE_API_VERSION,
    });

    const body = await req.json();
    const { items: rawItems, promoCode } = body;

    const cartCheck = validateCartItems(rawItems);
    if (!cartCheck.ok) {
      return NextResponse.json({ error: cartCheck.failure.message }, { status: 400 });
    }
    const items = cartCheck.items;

    const promoCheck = validatePromoCode(promoCode);
    if (!promoCheck.ok) {
      return NextResponse.json({ error: promoCheck.failure.message }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch product details from Supabase to ensure price integrity.
    const productIds = items.map((item) => item.id);
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, name, price, slug, stock_status')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to verify products' }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map((product) => [product.id, product]));

    // Validate every requested product exists and is purchasable.
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

    // ── Promo code: resolved against the catalog, never trusted from the cart
    //    preview. The cart sends only the code the customer applied.
    let promo: ResolvedPromo | null = null;
    let stripeCouponId: string | null = null;

    if (promoCode && String(promoCode).trim().length > 0) {
      const admin = await createAdminClient();
      const resolved = await resolvePromoCode(admin, String(promoCode), subtotal);
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: 400 });
      }
      promo = resolved.promo;

      try {
        stripeCouponId = await getOrCreateStripeCoupon(stripe, admin, promo.coupon);
      } catch (couponError) {
        console.error('[checkout] Could not create Stripe coupon:', couponError);
        return NextResponse.json(
          { error: 'Could not apply that promo code. Remove it and try again.' },
          { status: 500 }
        );
      }
    }

    // Build line items for Stripe.
    const lineItems = items.map((item) => {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) throw new Error(`Product not found: ${item.id}`);

      return {
        price_data: {
          currency: 'nzd',
          product_data: {
            name: dbProduct.name,
            metadata: {
              slug: dbProduct.slug,
              // The webhook maps line items back to catalog rows via this id.
              id: String(dbProduct.id),
            },
          },
          unit_amount: Math.round(dbProduct.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    const origin = resolveReturnOrigin(req);
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    // Create a polished Stripe Checkout Session. The hosted page is the most
    // trusted, highest-converting surface: it renders Apple Pay / Google Pay /
    // Link automatically for card payments, handles 3-D Secure and SCA, and
    // keeps the storefront out of PCI scope.
    // afterpay_clearpay: NZ-supported BNPL — customers split into 4 interest-
    // free fortnightly payments. Domestic-only (NZ → NZ), which matches our
    // shipping_address_collection restriction. No extra Stripe config needed.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'afterpay_clearpay'],
      line_items: lineItems,
      mode: 'payment',
      currency: 'nzd',
      locale: 'auto',
      submit_type: 'pay',
      adaptive_pricing: {
        enabled: false,
      },
      // NZ-wide shipping; rural addresses choose their own rate.
      shipping_address_collection: {
        allowed_countries: ['NZ'],
      },
      // Billing address is required by Afterpay; prefilled from card where
      // available for card-only checkouts. No friction trade-off for NZ.
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      shipping_options: getStripeShippingOptions(),
      // Promo codes are applied in the cart against the `coupons` table. We do
      // not allow Stripe's own code field: it would bypass expiry/DB checks and
      // leave the order without a recorded coupon.
      allow_promotion_codes: false,
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      client_reference_id: user?.id,
      customer_email: user?.email || undefined,
      customer_creation: 'if_required',
      invoice_creation: { enabled: true },
      custom_text: {
        shipping_address: {
          message:
            'We ship NZ-wide from Auckland. Choose rural delivery if you are outside a courier town.',
        },
        submit: {
          message:
            'Secure checkout powered by Stripe. 2.5% of every order supports NZ Sea Cleaners.',
        },
      },
      payment_intent_data: {
        description: `Catch-22 order — ${itemCount} item${itemCount === 1 ? '' : 's'}`,
        receipt_email: user?.email || undefined,
        metadata: {
          promoCode: promo?.code ?? '',
        },
      },
      metadata: {
        promoCode: promo?.code ?? '',
        userId: user?.id || '',
        itemCount: String(itemCount),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    // Log the real cause; never show Stripe's internals to a shopper.
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Could not start secure checkout. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
