/**
 * src/app/manifest.ts
 *
 * Next.js 15 App Router native Web App Manifest.
 * Served at /manifest.webmanifest (referenced in metadata.manifest).
 *
 * Enables:
 *   - "Add to Home Screen" / PWA install prompt on mobile
 *   - Chrome "install app" banner on desktop
 *   - Branded splash screen and app name on launch
 *   - Theme-color matching CLK brand plum (#741052)
 */

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Little Karachi Express',
    short_name: 'LK Express',
    description:
      'Order authentic Karachi Biryani, gourmet platters, and fast food online. Express delivery & dine-in across Karachi.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#25041a',
    theme_color: '#741052',
    categories: ['food', 'lifestyle', 'shopping'],
    lang: 'en-PK',
    dir: 'ltr',
    icons: [
      {
        src: '/hd-logo.ico',
        sizes: 'any',
        type: 'image/x-icon',
        purpose: 'any',
      },
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
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Order Now',
        short_name: 'Order',
        description: 'Browse the full CLK menu and place your order',
        url: '/',
        icons: [{ src: '/hd-logo.ico', sizes: 'any' }],
      },
    ],
  };
}
