import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://catch-22.co.nz';
  
  // Use anon key for public data
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('stock_status', 'instock');

  const { data: pages } = await supabase
    .from('content')
    .select('slug, updated_at')
    .eq('status', 'publish');

  const productUrls = (products || []).map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updated_at || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const pageUrls = (pages || []).map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.updated_at || new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...productUrls,
    ...pageUrls,
  ];
}
