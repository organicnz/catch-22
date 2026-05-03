import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-04-22.dahlia',
    });

    const { items, promoCode } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
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

    // Build line items for Stripe
    const lineItems = items.map(item => {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        throw new Error(`Product not found: ${item.name}`);
      }

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
        allowed_countries: ['NZ', 'AU'],
      },
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
