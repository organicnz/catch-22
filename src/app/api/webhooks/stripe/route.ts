import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase-server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(stripeKey, {
    apiVersion: '2025-01-27-acacia' as any,
  });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing stripe-signature or STRIPE_WEBHOOK_SECRET');
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      await handleCheckoutSessionCompleted(session, stripe);
    } catch (error: any) {
      console.error('Error handling checkout.session.completed:', error);
      return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  const supabase = await createServerClient();
  
  // 1. Get line items with product details
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  });

  // 2. Find or create the customer profile
  const userId = session.client_reference_id || session.metadata?.userId;
  const email = session.customer_details?.email || session.customer_email;
  
  let profileId: number | null = null;

  if (userId || email) {
    const query = supabase.from('profiles').select('id');
    if (userId) {
      query.eq('user_id', userId);
    } else {
      query.eq('email', email);
    }
    
    const { data: profile } = await query.single();
    if (profile) {
      profileId = profile.id;
    }
  }

  // 3. Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: profileId,
      status: 'processing',
      currency: session.currency || 'nzd',
      total_amount: (session.amount_total || 0) / 100,
      stripe_session_id: session.id,
      billing_address: session.customer_details?.address,
      shipping_address: (session as any).shipping_details?.address,
      payment_method: 'stripe',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 4. Create order items
  const orderItems = lineItems.data.map((item: Stripe.LineItem) => {
    const product = item.price?.product as Stripe.Product;
    return {
      order_id: order.id,
      product_id: product?.metadata?.id ? parseInt(product.metadata.id) : null,
      product_name: product?.name || item.description,
      quantity: item.quantity || 1,
      total: (item.amount_total || 0) / 100,
    };
  });

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  // 5. Update profile with stripe_customer_id if available
  if (profileId && session.customer) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', profileId);
  }
}
