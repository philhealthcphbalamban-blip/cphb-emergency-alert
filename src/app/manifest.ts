import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CPHB Rapid Emergency Code Alert',
    short_name: 'CPHB Alert',
    description: 'Hospital Emergency Code Broadcasting & Mobile Responder Network for Cebu Provincial Hospital - Balamban',
    start_url: '/responder',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
