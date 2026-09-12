import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://custechmarketplace.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/api/', '/messages/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
