import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function upload() {
  const fileBuffer = readFileSync('public/seacleaners-dark-auth.png');
  const { error } = await supabase.storage
    .from('media')
    .upload('site/partner-seacleaners-dark.png', fileBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) console.error(error);
  else console.log('Successfully uploaded partner-seacleaners-dark.png to Supabase');
}

upload();
