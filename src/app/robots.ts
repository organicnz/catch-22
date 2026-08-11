import { env } from '@/lib/env';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/api/', '/checkout/', '/success', '/cancel', '/auth/', '/search'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
