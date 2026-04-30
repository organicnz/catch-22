import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFinal() {
  const readJSON = (filename) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../catch-22/migration_data/${filename}`), 'utf8'));

  const variations = readJSON('variations_export.json');
  const coupons = readJSON('coupons_export.json');
  const contents = readJSON('content_export.json');
  const reviews = readJSON('reviews_export.json');

  const { data: products } = await supabase.from('products').select('id, wp_id');
  const wpToSupabaseProduct = {};
  if (products) products.forEach(p => { wpToSupabaseProduct[p.wp_id] = p.id; });

  let errorCount = 0;

  console.log(`Uploading ${variations.length} variations...`);
  for (const v of variations) {
    const parent_id = wpToSupabaseProduct[v.product_id];
    if (!parent_id) continue;

    const { error } = await supabase.from('product_variations').upsert({
      wp_id: v.id,
      product_id: parent_id,
      price: v.price || 0,
      regular_price: v.regular_price || null,
      sale_price: v.sale_price || null,
      sku: v.sku,
      attributes: v.attributes || {},
      stock_status: v.stock_status,
      weight: v.weight,
      image_url: v.image_url
    }, { onConflict: 'wp_id' });
    if (error) { console.error('Variation Error:', error.message); errorCount++; }
  }

  console.log(`Uploading ${coupons.length} coupons...`);
  for (const c of coupons) {
    const { error } = await supabase.from('coupons').upsert({
      wp_id: c.id,
      code: c.code,
      amount: c.amount,
      discount_type: c.discount_type,
      expiry_date: c.expiry_date
    }, { onConflict: 'wp_id' });
    if (error) { console.error('Coupon Error:', error.message); errorCount++; }
  }

  console.log(`Uploading ${contents.length} pages and posts...`);
  for (const c of contents) {
    const slug = c.slug || `post-${c.id}`;
    const { error } = await supabase.from('content').upsert({
      wp_id: c.id,
      title: c.title,
      slug: slug,
      body: c.body,
      type: c.type,
      status: c.status,
      created_at: c.created_at
    }, { onConflict: 'wp_id' });
    if (error) { console.error('Content Error:', error.message); errorCount++; }
  }

  console.log(`Uploading ${reviews.length} reviews...`);
  for (const r of reviews) {
    const parent_id = wpToSupabaseProduct[r.product_id];
    if (!parent_id) continue;
    const { error } = await supabase.from('reviews').upsert({
      wp_id: r.id,
      product_id: parent_id,
      author_name: r.author_name,
      author_email: r.author_email,
      content: r.content,
      rating: r.rating,
      created_at: r.created_at
    }, { onConflict: 'wp_id' });
    if (error) { console.error('Review Error:', error.message); errorCount++; }
  }

  if (errorCount === 0) {
    console.log('🎉 Final data migration complete with NO errors!');
  } else {
    console.log(`⚠️ Migration completed but encountered ${errorCount} errors.`);
  }
}

uploadFinal().catch(console.error);