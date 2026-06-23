import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase-server';
import { getStripeShippingOptions } from '@/config/shipping';

const STRIPE_API_VERSION = '2026-04-22.dahlia' as const;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: STRIPE_API_VERSION,
    });

    const body = await req.json();
    const { items, promoCode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Validate item structure
    for (const item of items) {
      if (!item.id || typeof item.id !== 'number') {
        return NextResponse.json({ error: 'Invalid item: id must be a number' }, { status: 400 });
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 999 || !Number.isInteger(item.quantity)) {
        return NextResponse.json({ error: 'Invalid item: quantity must be an integer between 1 and 999' }, { status: 400 });
      }
    }

    if (promoCode !== undefined && (typeof promoCode !== 'string' || promoCode.length > 50)) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch product details from Supabase to ensure price integrity
    const productIds = items.map(item => item.id);
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, name, price, slug')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to verify products' }, { status: 500 });
    }

    // Map database products for easy lookup
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Validate all requested products exist before building line items
    for (const item of items) {
      if (!productMap.has(item.id)) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 });
      }
    }

    // Build line items for Stripe
    const lineItems = items.map(item => {
      const dbProduct = productMap.get(item.id)!;

      return {
        price_data: {
          currency: 'nzd',
          product_data: {
            name: dbProduct.name,
            metadata: {
              slug: dbProduct.slug,
            },
          },
          unit_amount: Math.round(dbProduct.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      currency: 'nzd',
      locale: 'en',
      adaptive_pricing: {
        enabled: false,
      },
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cart`,
      shipping_address_collection: {
        allowed_countries: ['NZ'],
      },
      shipping_options: getStripeShippingOptions(),
      // Allow promo codes if needed
      allow_promotion_codes: true,
      client_reference_id: user?.id,
      customer_email: user?.email || undefined,
      metadata: {
        promoCode: promoCode || '',
        userId: user?.id || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Checkout error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
