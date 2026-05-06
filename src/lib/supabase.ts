import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

/**
 * Returns a public URL for an asset stored in Supabase Storage.
 */
export function getStorageUrl(path: string | null, bucket: string = 'media'): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
