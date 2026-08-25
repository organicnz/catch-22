import { cacheLife } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-server';

export async function getAllPublishedSlugs() {
  'use cache';
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data } = await supabase.from('content').select('slug').eq('status', 'publish');
  return (data ?? []).map((row) => ({ slug: row.slug }));
}

export async function getPublishedContent(slug: string) {
  'use cache';
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publish')
    .single();
  return data;
}
