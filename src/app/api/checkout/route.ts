import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { items, promoCode } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let stripeDiscounts: any[] = [];
    
    if (promoCode) {
      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .single();

      if (couponData) {
        // Create a temporary coupon in Stripe for this session
        const isPercent = couponData.discount_type === 'percent';
        const stripeCoupon = await stripe.coupons.create({
          ...(isPercent ? { percent_off: couponData.amount } : { amount_off: Math.round(couponData.amount * 100), currency: 'nzd' }),
          duration: 'once',
          name: couponData.code,
        });
        stripeDiscounts = [{ coupon: stripeCoupon.id }];
      } else {
        return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
      }
    }

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
      discounts: stripeDiscounts.length > 0 ? stripeDiscounts : undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['NZ', 'AU'],
      },
      // shipping_options: [
      //   { shipping_rate: 'shr_123456789' } // Add your Stripe Shipping Rate ID here
      // ]
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
