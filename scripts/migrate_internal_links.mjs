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

async function migrateLinks() {
  console.log('🚀 Starting Internal Link Migration...');

  // 1. Update Products
  const { data: products, error: pError } = await supabase.from('products').select('id, description, short_description');
  if (pError) console.error(pError);

  console.log(`Processing ${products?.length} products...`);
  for (const product of products || []) {
    let updated = false;
    let desc = product.description || '';
    let shortDesc = product.short_description || '';

    const newDesc = desc
      .replace(/https:\/\/catch-22\.co\.nz\/product\//g, '/products/')
      .replace(/https:\/\/catch-22\.co\.nz\//g, '/');
    
    const newShortDesc = shortDesc
      .replace(/https:\/\/catch-22\.co\.nz\/product\//g, '/products/')
      .replace(/https:\/\/catch-22\.co\.nz\//g, '/');

    if (newDesc !== desc || newShortDesc !== shortDesc) {
      const { error } = await supabase.from('products').update({
        description: newDesc,
        short_description: newShortDesc
      }).eq('id', product.id);
      if (!error) updated = true;
    }
    if (updated) console.log(`✅ Updated links for product ID: ${product.id}`);
  }

  // 2. Update Content (Pages & Posts)
  const { data: contents, error: cError } = await supabase.from('content').select('id, body, title');
  if (cError) console.error(cError);

  console.log(`Processing ${contents?.length} content items...`);
  for (const item of contents || []) {
    let body = item.body || '';
    const newBody = body
      .replace(/https:\/\/catch-22\.co\.nz\/product\//g, '/products/')
      .replace(/https:\/\/catch-22\.co\.nz\//g, '/');

    if (newBody !== body) {
      const { error } = await supabase.from('content').update({
        body: newBody
      }).eq('id', item.id);
      if (!error) console.log(`✅ Updated links for content: ${item.title}`);
    }
  }

  console.log('🎉 Internal Link Migration Complete!');
}

migrateLinks().catch(console.error);
