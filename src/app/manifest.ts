import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CUSTECH Marketplace',
    short_name: 'CUSTECH Mkt',
    description: 'The trusted campus marketplace for Confluence University of Science and Technology',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
