import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://custechmarketplace.vercel.app';
  const routes = [
    '',
    '/marketplace',
    '/services',
    '/housing',
    '/businesses',
    '/deals',
    '/needs',
    '/free-items',
    '/trust',
    '/scam-check',
    '/safety',
    '/community-guidelines',
    '/terms',
    '/privacy',
    '/refund-policy',
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/marketplace' ? 'hourly' : 'daily',
    priority: route === '' ? 1.0 : route === '/marketplace' ? 0.9 : 0.7,
  }));
}
