import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

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
} catch {
  // Rely on ambient env
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToVerify = [
  'products',
  'categories',
  'product_categories',
  'profiles',
  'orders',
  'order_items',
  'product_variations',
  'coupons',
  'content',
  'reviews'
];

async function verifyMigration() {
  console.log('🔍 Verifying Supabase Data Migration...\n');
  console.log('-'.repeat(40));
  console.log(String('TABLE').padEnd(25) + '| ' + 'ROW COUNT');
  console.log('-'.repeat(40));

  let allSuccess = true;

  for (const table of tablesToVerify) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ ${String(table).padEnd(23)} | Error: ${error.message}`);
      allSuccess = false;
    } else {
      console.log(`✅ ${String(table).padEnd(23)} | ${count}`);
    }
  }

  console.log('-'.repeat(40));
  
  if (allSuccess) {
    console.log('\n🎉 Verification Complete: All tables successfully queried.');
  } else {
    console.log('\n⚠️ Verification Complete: Some errors occurred during querying.');
  }
}

verifyMigration().catch(console.error);