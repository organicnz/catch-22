import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  // Skip webhook verification during local testing/builds if secret is missing
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Fulfill the order: Insert directly into your Supabase database
    // (Requires STRIPE_SERVICE_ROLE_KEY or Anon key depending on RLS)
    const supabase = createClient();
    
    // Use the email provided during checkout to find or create the customer
    const email = session.customer_details?.email;
    let customerId = null;
    
    if (email) {
      const { data: customer } = await supabase.from('profiles').select('id').eq('email', email).single();
      customerId = customer?.id || null;
    }

    const { error: orderError } = await supabase.from('orders').insert({
       customer_id: customerId,
       status: 'processing',
       total_amount: (session.amount_total || 0) / 100, // Convert cents to dollars
       currency: session.currency?.toUpperCase() || 'NZD',
       payment_method: 'stripe_link',
       billing_address: session.customer_details?.address || {},
       shipping_address: (session as any).shipping_details?.address || {}
    });
    
    if (orderError) {
       console.error('❌ Error inserting fulfilled order:', orderError.message);
       return NextResponse.json({ error: 'Database fulfillment failed' }, { status: 500 });
    }
    
    console.log(`✅ Order fulfilled for session: ${session.id}`);

    // Decrement inventory for each item purchased
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    
    if (lineItems.data.length > 0) {
      for (const item of lineItems.data) {
        // Find the product by its Stripe Price ID
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('stripe_price_id', item.price?.id)
          .single();

        if (product) {
          // Call the RPC to reduce stock (or set out of stock if tracking quantities)
          await supabase.rpc('decrement_stock', { p_id: product.id, decrement_by: item.quantity || 1 });
          console.log(`✅ Decremented stock for product ${product.id}`);
        }
      }
    }

    // Optional: Send Order Confirmation Email via Resend
    // await resend.emails.send({
    //   from: 'orders@catch-22.co.nz',
    //   to: email,
    //   subject: 'Your Catch-22 Order Confirmation',
    //   html: '<p>Thank you for your order...</p>'
    // });
  }

  return NextResponse.json({ received: true });
}
