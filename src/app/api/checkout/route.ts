import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Use Service Role key here because we just need to securely fetch price IDs 
    // and don't have an active user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const productIds = items.map((i: any) => i.id);

    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('id, stripe_price_id, price')
      .in('id', productIds);

    if (error || !dbProducts) {
      throw new Error('Failed to validate cart items against the database');
    }

    const line_items = items.map((item: any) => {
      const dbProduct = dbProducts.find((p) => p.id === item.id);
      
      // Fallback: If Stripe isn't fully synced yet, create a price inline dynamically (for testing only)
      if (!dbProduct?.stripe_price_id) {
        return {
          price_data: {
            currency: 'nzd',
            product_data: { name: item.name },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        };
      }

      return {
        price: dbProduct.stripe_price_id,
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['NZ', 'AU'],
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
