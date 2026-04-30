import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const WP_UPLOADS_DIR = path.resolve(__dirname, '../../catch-22/wp-content/uploads');

async function migrateGalleryMedia() {
  console.log('🚀 Starting Product Gallery Migration to Supabase Storage...');

  // 1. Fetch all products that have gallery_urls
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, gallery_urls')
    .not('gallery_urls', 'eq', '[]');

  if (error) {
    console.error('❌ Error fetching products:', error.message);
    return;
  }

  console.log(`Found ${products.length} products with gallery images.`);

  let totalMigrated = 0;

  for (const product of products) {
    const newGalleryUrls = [];
    let updated = false;

    for (const url of product.gallery_urls) {
      if (!url || typeof url !== 'string' || !url.includes('catch-22.co.nz')) {
        newGalleryUrls.push(url);
        continue;
      }

      // Extract relative path: 2021/08/image.png
      const relativePath = url.split('/uploads/')[1];
      if (!relativePath) {
        newGalleryUrls.push(url);
        continue;
      }

      const localPath = path.join(WP_UPLOADS_DIR, relativePath);
      
      if (!fs.existsSync(localPath)) {
        console.warn(`⚠️ Local file not found: ${localPath} for product ${product.name}`);
        newGalleryUrls.push(url);
        continue;
      }

      const fileBuffer = fs.readFileSync(localPath);
      const fileName = path.basename(localPath);
      const storagePath = `products/${product.id}/gallery/${fileName}`;
      const contentType = mime.lookup(localPath) || 'application/octet-stream';

      // Upload to Supabase Storage (media bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Failed to upload gallery image ${fileName} for ${product.name}:`, uploadError.message);
        newGalleryUrls.push(url);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(storagePath);

      newGalleryUrls.push(publicUrl);
      totalMigrated++;
      updated = true;
    }

    if (updated) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ gallery_urls: newGalleryUrls })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Failed to update gallery for ${product.name}:`, updateError.message);
      } else {
        console.log(`✅ Migrated gallery for: ${product.name}`);
      }
    }
  }

  console.log(`🎉 Gallery Migration Complete! Migrated ${totalMigrated} images to Supabase Storage.`);
}

migrateGalleryMedia().catch(console.error);
