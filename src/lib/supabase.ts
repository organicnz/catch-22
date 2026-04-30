import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

/**
 * Returns a public URL for an asset stored in Supabase Storage.
 * If the path is already a full URL, it returns it as is.
 */
export function getStorageUrl(path: string | null, bucket: string = 'photos'): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Clean up the path (remove leading slash if present)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
