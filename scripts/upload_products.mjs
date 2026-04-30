import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the local environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadProducts() {
  const exportPath = path.resolve(__dirname, '../../catch-22/migration_data/products_export.json');
  if (!fs.existsSync(exportPath)) {
    console.error(`Cannot find the export file at ${exportPath}`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  console.log(`Starting upload of ${data.length} products to Supabase...`);

  for (const product of data) {
    const categoryIds = [];
    
    // Process Categories (upsert using the original WordPress ID)
    if (product.categories && product.categories.length > 0) {
      for (const cat of product.categories) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .upsert({ wp_id: cat.id, name: cat.name, slug: cat.slug }, { onConflict: 'wp_id' })
          .select('id')
          .single();

        if (catError) {
          console.error(`❌ Failed to upsert category ${cat.name}:`, catError.message);
        } else if (catData) {
          categoryIds.push(catData.id);
        }
      }
    }

    // Process Product
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .upsert({
        wp_id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        short_description: product.short_description,
        price: product.price || 0,
        regular_price: product.regular_price || null,
        sale_price: product.sale_price || null,
        sku: product.sku || null,
        stock_status: product.stock_status,
        weight: product.weight || null,
        image_url: product.image_url,
        gallery_urls: product.gallery_urls || [],
        date_created: product.date_created
      }, { onConflict: 'wp_id' })
      .select('id')
      .single();

    if (prodError) {
      console.error(`❌ Failed to insert product ${product.name}:`, prodError.message);
      continue;
    }

    // Process Product-Category Relationships
    if (categoryIds.length > 0 && prodData) {
      for (const catId of categoryIds) {
        const { error: relError } = await supabase
          .from('product_categories')
          .upsert(
            { product_id: prodData.id, category_id: catId }, 
            { onConflict: 'product_id,category_id' }
          );
          
        if (relError) {
           console.error(`❌ Failed to insert relation for product ${product.name}:`, relError.message);
        }
      }
    }
    console.log(`✅ Uploaded product: ${product.name}`);
  }
  console.log('🎉 Migration complete. All products and categories synced.');
}

uploadProducts().catch(console.error);