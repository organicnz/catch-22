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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const uploadsDir = path.resolve(__dirname, '../../catch-22/wp-content/uploads');

// Recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function migrateAllMedia() {
  console.log('🚀 Scanning for all media files in wp-content/uploads...');
  const allFiles = getAllFiles(uploadsDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    // Exclude PHP, HTML, and hidden files/folders
    return !['.php', '.html', '.css', '.json'].includes(ext) && !file.includes('/.');
  });

  console.log(`Found ${allFiles.length} media files to migrate.`);

  const CONCURRENCY_LIMIT = 20;
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < allFiles.length; i += CONCURRENCY_LIMIT) {
    const chunk = allFiles.slice(i, i + CONCURRENCY_LIMIT);
    
    await Promise.all(chunk.map(async (localFilePath) => {
      const relativePath = path.relative(uploadsDir, localFilePath);
      // Construct the path exactly as it appeared in WP
      const storagePath = `wp-content/uploads/${relativePath.split(path.sep).join('/')}`;
      
      const contentType = mime.lookup(localFilePath) || 'application/octet-stream';
      const fileBuffer = fs.readFileSync(localFilePath);

      const { data, error } = await supabase.storage
        .from('media')
        .upload(storagePath, fileBuffer, { upsert: false, contentType });

      if (error) {
        if (error.message.includes('already exists') || error.statusCode === '409') {
           skipCount++;
        } else {
           console.error(`❌ Failed to upload ${relativePath}:`, error.message);
           errorCount++;
        }
      } else {
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`✅ Uploaded ${successCount} files so far...`);
        }
      }
    }));
  }

  console.log('\n====================================');
  console.log(`🎉 Full Media Migration Complete!`);
  console.log(`Successfully Uploaded: ${successCount}`);
  console.log(`Skipped (Already Exists): ${skipCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log('====================================\n');
  
  console.log('🔄 Now running database search-and-replace to update image URLs in content...');
  
  const oldUrlBase = 'https://catch-22.co.nz/wp-content/uploads/';
  const newUrlBase = `${supabaseUrl}/storage/v1/object/public/media/wp-content/uploads/`;
  
  // Call SQL function to replace URLs in content
  const { error: sqlError } = await supabase.rpc('replace_media_urls', {
    old_base: oldUrlBase,
    new_base: newUrlBase
  });

  if (sqlError) {
    console.error('⚠️ Could not run SQL replace automatically. Please run the SQL manually to update post contents.');
    console.error(sqlError.message);
  } else {
    console.log('✅ Updated all image URLs in the Supabase database!');
  }
}

migrateAllMedia().catch(console.error);