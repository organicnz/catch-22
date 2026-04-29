import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mime from 'mime-types'; // We'll install this to get correct content-types

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const uploadsDir = path.resolve(__dirname, '../../catch-22/wp-content/uploads');

async function migrateMedia() {
  console.log('🚀 Starting Media Asset Migration to Supabase Storage...');

  // 1. Ensure the 'media' bucket exists and is public
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('Error fetching buckets:', bucketError.message);
    process.exit(1);
  }

  if (!buckets.find(b => b.name === 'media')) {
    const { error: createError } = await supabase.storage.createBucket('media', { public: true });
    if (createError) {
      console.error('Failed to create "media" bucket:', createError.message);
      process.exit(1);
    }
    console.log('✅ Created public "media" bucket in Supabase.');
  } else {
    console.log('✅ "media" bucket already exists.');
  }

  // 2. Fetch all products to process their images
  const { data: products, error: prodError } = await supabase.from('products').select('id, name, image_url, gallery_urls');
  
  if (prodError) {
    console.error('Error fetching products:', prodError.message);
    process.exit(1);
  }

  let migratedCount = 0;

  for (const product of products) {
    let updatedImageUrl = product.image_url;
    let updatedGalleryUrls = [...(product.gallery_urls || [])];
    let needsUpdate = false;

    // Process Main Image
    if (product.image_url && typeof product.image_url === 'string' && product.image_url.includes('wp-content/uploads/')) {
      const relativePath = product.image_url.split('wp-content/uploads/')[1];
      const localFilePath = path.join(uploadsDir, relativePath);

      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const fileName = path.basename(localFilePath);
        const storagePath = `products/${product.id}/${fileName}`;
        const contentType = mime.lookup(localFilePath) || 'application/octet-stream';

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, fileBuffer, { upsert: true, contentType });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(storagePath);
          updatedImageUrl = publicUrlData.publicUrl;
          needsUpdate = true;
          console.log(`📸 Migrated main image for: ${product.name}`);
          migratedCount++;
        } else {
          console.error(`❌ Failed to upload image for ${product.name}:`, uploadError.message);
        }
      }
    }

    // Update the product record if URLs changed
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: updatedImageUrl, gallery_urls: updatedGalleryUrls })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Failed to update DB record for ${product.name}:`, updateError.message);
      }
    }
  }

  console.log(`🎉 Media Migration Complete! Migrated ${migratedCount} images to Supabase Storage.`);
}

migrateMedia().catch(console.error);