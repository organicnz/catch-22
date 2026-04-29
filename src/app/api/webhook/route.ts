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
       // Return 500 so Stripe retries the webhook
       return NextResponse.json({ error: 'Database fulfillment failed' }, { status: 500 });
    }
    console.log(`✅ Order fulfilled for session: ${session.id}`);
  }

  return NextResponse.json({ received: true });
}
