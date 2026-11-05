import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Note: getStorageUrl() lives in `@/lib/storage-url` on purpose — it is a
// pure URL helper, and importing it from here would ship the whole Supabase
// client to every page that only needs an image URL.
export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createBrowserClient<Database>(url, key);
};
