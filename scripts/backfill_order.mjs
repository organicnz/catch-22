import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const SESSION_ID = 'cs_live_b1J21NLUstB9A3sizpYEECENffGvgCXiMCqyqqAlNk1OuuPir1uDRL7u6E';

const session = await stripe.checkout.sessions.retrieve(SESSION_ID);
console.log('Session:', session.id, 'paid:', session.payment_status, '$' + (session.amount_total / 100));

// Idempotency check
const { data: existing } = await supabase.from('orders').select('id').eq('stripe_session_id', session.id).maybeSingle();
if (existing) {
  console.log('Order already exists:', existing.id);
  process.exit(0);
}

// Resolve customer (mirror fixed edge function logic)
let customerId = null;
const userId = session.metadata?.userId;
if (userId && userId !== 'guest') {
  const { data } = await supabase.from('profiles').select('id').eq('user_id', userId).maybeSingle();
  if (data) customerId = data.id;
}
if (customerId === null && session.customer_details?.email) {
  const { data } = await supabase.from('profiles').select('id').eq('email', session.customer_details.email).maybeSingle();
  if (data) customerId = data.id;
}
console.log('customer_id:', customerId, 'metadata:', session.metadata);

const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
const items = lineItems.data.map((item) => ({
  product_name: item.description ?? 'Unknown item',
  quantity: item.quantity ?? 1,
  total: (item.amount_total ?? 0) / 100,
}));
console.log('Items:', JSON.stringify(items));

const { data: order, error } = await supabase
  .from('orders')
  .insert({
    customer_id: customerId,
    stripe_session_id: session.id,
    status: 'processing',
    total_amount: (session.amount_total ?? 0) / 100,
    currency: session.currency?.toUpperCase() ?? 'NZD',
    payment_method: 'stripe',
    billing_address: session.customer_details?.address ?? {},
    shipping_address: session.shipping_details?.address ?? {},
  })
  .select('id')
  .single();

if (error) {
  console.error('Insert failed:', error.message);
  process.exit(1);
}
console.log('Order created:', order.id);

const { error: itemsError } = await supabase.from('order_items').insert(items.map((i) => ({ ...i, order_id: order.id })));
if (itemsError) {
  console.error('Items insert failed:', itemsError.message);
  process.exit(1);
}
console.log('Order items created for order', order.id);
