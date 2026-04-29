import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the local environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadData() {
  const usersPath = path.resolve(__dirname, '../../catch-22/wp-content/users_export.json');
  const ordersPath = path.resolve(__dirname, '../../catch-22/wp-content/orders_export.json');
  
  if (!fs.existsSync(usersPath) || !fs.existsSync(ordersPath)) {
    console.error('Export JSON files not found.');
    process.exit(1);
  }

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
  
  console.log(`Uploading ${users.length} users to 'customers' table...`);
  
  const wpToSupabaseUser = {};
  
  for (const user of users) {
    const { data, error } = await supabase
      .from('customers')
      .upsert({
        wp_id: user.id,
        email: user.email || `missing_${user.id}@catch-22.co.nz`,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        registered_at: user.registered_at
      }, { onConflict: 'email' })
      .select('id, wp_id')
      .single();
      
    if (error) {
      console.error(`❌ Failed to insert user ${user.email}:`, error.message);
    } else if (data) {
      wpToSupabaseUser[user.id] = data.id;
    }
  }
  
  console.log('✅ Users successfully uploaded.');

  // Pre-fetch product mapping for order items
  const { data: products } = await supabase.from('products').select('id, wp_id');
  const wpToSupabaseProduct = {};
  if (products) {
    products.forEach(p => { wpToSupabaseProduct[p.wp_id] = p.id; });
  }

  console.log(`Uploading ${orders.length} orders...`);
  let orderCount = 0;
  
  for (const order of orders) {
    const customer_id = order.customer_id ? wpToSupabaseUser[order.customer_id] : null;
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .upsert({
        wp_id: order.id,
        customer_id: customer_id,
        status: order.status,
        currency: order.currency || 'NZD',
        total_amount: order.total_amount,
        billing_address: order.billing_address,
        shipping_address: order.shipping_address,
        payment_method: order.payment_method,
        created_at: order.date_created
      }, { onConflict: 'wp_id' })
      .select('id')
      .single();
      
    if (orderError) {
      console.error(`❌ Failed to insert order ${order.id}:`, orderError.message);
      continue;
    }
    
    // Upload Order Items
    if (order.items && order.items.length > 0 && orderData) {
      for (const item of order.items) {
        const product_id = item.product_id ? wpToSupabaseProduct[item.product_id] : null;
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: product_id,
            product_name: item.name,
            quantity: item.quantity,
            total: item.total
          });
          
        if (itemError) {
          console.error(`   ❌ Failed to insert item ${item.name} for order ${order.id}:`, itemError.message);
        }
      }
    }
    orderCount++;
  }
  
  console.log(`✅ ${orderCount} Orders and Order Items successfully migrated.`);
  console.log('🎉 Full database migration complete!');
}

uploadData().catch(console.error);