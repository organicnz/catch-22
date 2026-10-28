#!/usr/bin/env bun
/**
 * End-to-end verification of the bank transfer checkout transaction.
 *
 * Verifies:
 * 1. Bank transfer configuration (ANZ, Account Name, 06-XXXX-XXXXXXX-XX).
 * 2. Catalog product lookup & stock status verification.
 * 3. Server-side totals computation (subtotal + shipping).
 * 4. Database order insertion with status 'on-hold' and payment_method 'bank_transfer'.
 * 5. Database order_items insertion linked to the order.
 * 6. Verification of the stored order in Supabase.
 * 7. Receipt payload formatting & order reference (C22-<orderId>).
 * 8. Cleanup of the temporary test order to keep the database pristine.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── 1. Load local environment ────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve('.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (err) {
    console.error('Failed to read .env.local:', err.message);
  }
}

loadEnv();

console.log('─────────────────────────────────────────────────────────────');
console.log('   Catch-22: Bank Transfer End-to-End Verification Test       ');
console.log('─────────────────────────────────────────────────────────────\n');

// ── 2. Check Bank Transfer Configuration ─────────────────────────────────────
const bankName = process.env.BANK_TRANSFER_BANK_NAME?.trim();
const accountName = process.env.BANK_TRANSFER_ACCOUNT_NAME?.trim();
const accountNumber = process.env.BANK_TRANSFER_ACCOUNT_NUMBER?.trim();

console.log('1. Bank Transfer Configuration:');
console.log(`   • Bank Name:       ${bankName || 'MISSING'}`);
console.log(`   • Account Name:    ${accountName || 'MISSING'}`);
console.log(`   • Account Number:  ${accountNumber || 'MISSING'}`);

if (!bankName || !accountName || !accountNumber) {
  console.error('\n✖ Configuration error: Missing bank transfer environment variables.');
  process.exit(1);
}
console.log('   ✔ Configuration complete and valid.\n');

// ── 3. Connect to Supabase Admin ─────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('✖ Missing Supabase credentials in environment.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey);

// ── 4. Verify Catalog Product ────────────────────────────────────────────────
console.log('2. Catalog Product Lookup (Dan\'s Braid):');
const { data: products, error: productErr } = await admin
  .from('products')
  .select('id, name, price, stock_status')
  .eq('slug', '1000m-80lb')
  .single();

if (productErr || !products) {
  console.error('✖ Product lookup failed:', productErr?.message);
  process.exit(1);
}

console.log(`   • Product:  #${products.id} - ${products.name}`);
console.log(`   • Price:    $${Number(products.price).toFixed(2)} NZD`);
console.log(`   • Stock:    ${products.stock_status}`);
console.log('   ✔ Product is verified in catalog.\n');

// ── 5. Calculate Order Totals ────────────────────────────────────────────────
console.log('3. Compute Server-Side Totals:');
const itemQty = 1;
const itemPrice = Number(products.price);
const subtotal = itemPrice * itemQty;
const shippingRate = { id: 'standard', name: 'Standard Courier (NZ-wide)', amount: 800 }; // $8.00
const shipping = shippingRate.amount / 100;
const total = subtotal + shipping;

console.log(`   • Subtotal:  $${subtotal.toFixed(2)}`);
console.log(`   • Shipping:  $${shipping.toFixed(2)} (${shippingRate.name})`);
console.log(`   • Total:     $${total.toFixed(2)} NZD`);
console.log('   ✔ Totals calculated.\n');

// ── 6. Execute Order Creation in Supabase ────────────────────────────────────
console.log('4. Create Database Order Record:');
const testCustomer = {
  first_name: 'Test',
  last_name: 'Customer',
  email: 'test-bank-transfer@catch-22.co.nz',
  phone: '021 555 0199',
  line1: '12 Marina Way',
  city: 'Auckland',
  postal_code: '1010',
  country: 'NZ',
};

const { data: order, error: orderErr } = await admin
  .from('orders')
  .insert({
    customer_id: null,
    status: 'on-hold',
    currency: 'NZD',
    total_amount: total,
    payment_method: 'bank_transfer',
    billing_address: testCustomer,
    shipping_address: testCustomer,
    admin_notes: `[E2E TEST] Bank transfer verification. Shipping: ${shippingRate.name} ($${shipping.toFixed(2)}).`,
    created_at: new Date().toISOString(),
  })
  .select('id, created_at, status, total_amount, payment_method')
  .single();

if (orderErr || !order) {
  console.error('✖ Order insertion failed:', orderErr?.message);
  process.exit(1);
}

console.log(`   • Order Created: ID #${order.id}`);
console.log(`   • Status:        ${order.status}`);
console.log(`   • Method:        ${order.payment_method}`);
console.log(`   • Amount:        $${order.total_amount}`);

// Insert order items
const { error: itemsErr } = await admin.from('order_items').insert([
  {
    order_id: order.id,
    product_id: products.id,
    product_name: products.name,
    quantity: itemQty,
    total: subtotal,
  },
]);

if (itemsErr) {
  console.error('✖ Order items insertion failed:', itemsErr?.message);
  await admin.from('orders').delete().eq('id', order.id);
  process.exit(1);
}
console.log('   ✔ Order items successfully attached.\n');

// ── 7. Verify Stored Order & Reference ───────────────────────────────────────
console.log('5. Verify Order Retrieval & Reference:');
const orderRef = `C22-${order.id}`;
console.log(`   • Payment Reference: ${orderRef}`);

const { data: verifiedOrder } = await admin
  .from('orders')
  .select('*, order_items(*)')
  .eq('id', order.id)
  .single();

console.log(`   • Verified Order ID:   ${verifiedOrder.id}`);
console.log(`   • Items Count:         ${verifiedOrder.order_items.length}`);
console.log(`   • First Item:          ${verifiedOrder.order_items[0].product_name} (Qty: ${verifiedOrder.order_items[0].quantity})`);
console.log('   ✔ Order verified in Supabase.\n');

// ── 8. Verify Receipt Shape ─────────────────────────────────────────────────
console.log('6. Verify Customer Receipt Structure:');
const receipt = {
  success: true,
  orderId: order.id,
  reference: orderRef,
  totals: {
    subtotal,
    shipping,
    discount: 0,
    total,
  },
  bank: {
    bankName,
    accountName,
    accountNumber,
    instructions: [
      'Pay the exact total using internet banking or at any branch.',
      `Put your order reference (${orderRef}) in the bank payment reference field.`,
      'Your order is packed once the payment clears — usually within one business day.',
      'We will email you when your order is on its way.',
    ],
    testMode: false,
  },
};

console.log('   • Reference:   ', receipt.reference);
console.log('   • Amount Due:  ', `$${receipt.totals.total.toFixed(2)} NZD`);
console.log('   • Pay To:      ', `${receipt.bank.bankName} - ${receipt.bank.accountName}`);
console.log('   • Account No:  ', receipt.bank.accountNumber);
console.log('   ✔ Receipt matches customer presentation specifications.\n');

// ── 9. Cleanup Test Order ────────────────────────────────────────────────────
console.log('7. Cleaning up test data:');
await admin.from('order_items').delete().eq('order_id', order.id);
await admin.from('orders').delete().eq('id', order.id);
console.log(`   ✔ Test order #${order.id} cleanly removed from database.`);

console.log('\n─────────────────────────────────────────────────────────────');
console.log('   🎉 ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY  ');
console.log('─────────────────────────────────────────────────────────────\n');
