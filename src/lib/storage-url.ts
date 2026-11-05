/**
 * Public Supabase Storage asset URL.
 *
 * Intentionally dependency-free. Pages and components that only need image
 * URLs must import this, not `@/lib/supabase` — importing from there would
 * pull the entire Supabase client (auth crypto, webauthn, storage) into
 * their client bundle.
 */
export function getStorageUrl(path: string | null, bucket = 'media'): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
