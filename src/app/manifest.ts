import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CUSTECH Marketplace - Campus Commerce',
    short_name: 'CUSTECH Mkt',
    description: 'The trusted campus marketplace for Confluence University of Science and Technology. Buy, sell, find accommodation, and hire verified student services.',
    start_url: '/?source=pwa',
    scope: '/',
    id: '/?source=pwa',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#059669',
    categories: ['shopping', 'business', 'education'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    shortcuts: [
      {
        name: 'Marketplace',
        short_name: 'Market',
        description: 'Browse campus items for sale',
        url: '/marketplace',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Campus Lodges',
        short_name: 'Housing',
        description: 'Find verified hostels & lodges in Osara',
        url: '/housing',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Post a Listing',
        short_name: 'Sell',
        description: 'Sell textbooks, gadgets or services',
        url: '/dashboard/listings/new',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'My Wallet',
        short_name: 'Wallet',
        description: 'Check campus balance and escrow funds',
        url: '/dashboard/wallet',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
