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

async function cleanupSpam() {
  console.log('🚀 Starting Spam Cleanup in Content Table...');

  const spamKeywords = [
    'casino', 'slot', 'betting', 'gambling', 'poker', 'bingo', 'bonus', 'rtp',
    'vavada', '1xbet', 'mostbet', 'pin-up', 'vulcan', 'mahjong', 'sweet bonanza',
    'judi', 'genset', 'daftar', 'situs', 'ug1881', 'prediksi'
  ];

  let totalDeleted = 0;

  for (const keyword of spamKeywords) {
    const { count, error } = await supabase
      .from('content')
      .delete({ count: 'exact' })
      .ilike('title', `%${keyword}%`);

    if (error) {
      console.error(`❌ Error deleting spam with keyword "${keyword}":`, error.message);
    } else {
      console.log(`✅ Deleted ${count} items with keyword "${keyword}"`);
      totalDeleted += (count || 0);
    }
  }

  // Also delete items with non-Latin titles that don't look like Catch-22 content
  // We'll use a raw SQL approach via a temporary function if possible, 
  // or just target known patterns.
  
  const { count: cyrillicCount, error: cyrillicError } = await supabase
    .from('content')
    .delete({ count: 'exact' })
    .or('title.ilike.%а%,title.ilike.%е%,title.ilike.%и%,title.ilike.%о%'); // Common Cyrillic letters

  if (!cyrillicError) {
    console.log(`✅ Deleted ${cyrillicCount} likely Cyrillic spam items`);
    totalDeleted += (cyrillicCount || 0);
  }

  console.log(`🎉 Cleanup Complete! Total spam items removed: ${totalDeleted}`);
}

cleanupSpam().catch(console.error);
