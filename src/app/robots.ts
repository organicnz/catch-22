import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://catch-22.co.nz';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/api/', '/checkout/', '/success', '/cancel'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
