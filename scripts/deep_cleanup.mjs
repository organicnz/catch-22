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

async function deepCleanup() {
  console.log('🚀 Starting Deep Cleanup (Content + Spam Images)...');

  const spamKeywords = [
    'casino', 'slot', 'betting', 'gambling', 'poker', 'bingo', 'bonus', 'rtp',
    'vavada', '1xbet', 'mostbet', 'pin-up', 'vulcan', 'mahjong', 'sweet bonanza',
    'judi', 'genset', 'daftar', 'situs', 'ug1881', 'prediksi', 'gacor', 'togel', 'bo', 'aman'
  ];

  // 1. Find all spam content (including those already deleted from DB if possible, but here we check remaining)
  let query = supabase.from('content').select('id, title, body');
  
  const { data: allContent, error: fetchError } = await query;
  if (fetchError) {
    console.error('Error fetching content:', fetchError.message);
    return;
  }

  const spamItems = allContent.filter(item => {
    const titleLower = item.title.toLowerCase();
    const bodyLower = (item.body || '').toLowerCase();
    const isSpam = spamKeywords.some(kw => titleLower.includes(kw) || bodyLower.includes(kw));
    const hasNonLatin = /[^\u0000-\u007F]/.test(item.title) && !titleLower.includes('catch-22');
    return isSpam || hasNonLatin;
  });

  console.log(`Found ${spamItems.length} additional spam items.`);

  const imagesToDelete = new Set();

  // 2. Extract image paths from spam items
  spamItems.forEach(item => {
    const body = item.body || '';
    // Match Supabase storage URLs or relative paths that look like our migrated images
    const imgRegex = /https:\/\/[^"']+\/storage\/v1\/object\/public\/media\/([^"'\s>]+)/g;
    let match;
    while ((match = imgRegex.exec(body)) !== null) {
      imagesToDelete.add(match[1]);
    }
    
    // Also match relative paths just in case
    const relativeImgRegex = /src=["']\/([^"']+\.(?:webp|jpg|jpeg|png|gif|bmp))["']/g;
    while ((match = relativeImgRegex.exec(body)) !== null) {
        // If it's a known non-spam image like logo or hero, don't delete
        if (!['logo.svg', 'hero.jpg'].includes(match[1])) {
            imagesToDelete.add(match[1]);
        }
    }
  });

  console.log(`Identified ${imagesToDelete.size} unique images linked to spam.`);

  // 3. Delete the content from DB
  if (spamItems.length > 0) {
    const ids = spamItems.map(i => i.id);
    const { error: delError } = await supabase.from('content').delete().in('id', ids);
    if (delError) {
      console.error('Error deleting spam content:', delError.message);
    } else {
      console.log(`✅ Deleted ${spamItems.length} spam content records.`);
    }
  }

  // 4. Delete images from Supabase Storage
  if (imagesToDelete.size > 0) {
    const paths = Array.from(imagesToDelete);
    // Supabase can delete in batches of 100
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { data, error } = await supabase.storage.from('media').remove(chunk);
      if (error) {
        console.error(`❌ Error deleting images chunk:`, error.message);
      } else {
        console.log(`✅ Deleted ${chunk.length} images from storage.`);
      }
    }
  }

  // 5. Scan Storage for obvious spam filenames
  console.log('🔍 Scanning storage for obvious spam filenames...');
  const { data: files, error: listError } = await supabase.storage.from('media').list('', { limit: 1000 });
  // This only lists root. We need recursive or known folder scanning.
  // WordPress stores in folders by year. Let's check 2023, 2024, 2025.
  
  const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
  for (const year of years) {
      const { data: months } = await supabase.storage.from('media').list(year);
      if (months) {
          for (const month of months) {
              const folderPath = `${year}/${month.name}`;
              const { data: mediaFiles } = await supabase.storage.from('media').list(folderPath, { limit: 1000 });
              if (mediaFiles) {
                  const spamFiles = mediaFiles
                    .filter(f => spamKeywords.some(kw => f.name.toLowerCase().includes(kw)))
                    .map(f => `${folderPath}/${f.name}`);
                  
                  if (spamFiles.length > 0) {
                      await supabase.storage.from('media').remove(spamFiles);
                      console.log(`✅ Deleted ${spamFiles.length} spam files from ${folderPath}`);
                  }
              }
          }
      }
  }

  console.log('🎉 Deep Cleanup Complete!');
}

deepCleanup().catch(console.error);
