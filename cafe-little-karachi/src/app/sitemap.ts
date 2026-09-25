/**
 * src/app/sitemap.ts
 *
 * Next.js 15 App Router dynamic XML sitemap.
 * Served at /sitemap.xml.
 *
 * Generates:
 *  - Static core routes (/, /order)
 *  - Dynamic MenuItem routes (/item/[slug]) with Cloudinary image
 *  - Dynamic Platter routes (/platter/[slug]) with Cloudinary image
 *
 * Google-compliant: includes <image:image> entries via next-sitemap
 * compatible URL metadata so Google can index dish/platter photos.
 */

import type { MetadataRoute } from 'next';
import connectDB from '@/lib/db';
import MenuItems from '@/models/MenuItem';
import Platters from '@/models/Platter';
import { slugify } from './lib/slugify';

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cafelittlekarachi.com'
).replace(/\/+$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Core static routes ───────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/order`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  let itemRoutes: MetadataRoute.Sitemap = [];
  let platterRoutes: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    const [menuItems, platters] = await Promise.all([
      MenuItems.find(
        { isVisible: { $ne: false } },
        'title image category updatedAt createdAt'
      ).lean(),
      Platters.find(
        { isVisible: { $ne: false } },
        'title image platterCategory updatedAt createdAt'
      ).lean(),
    ]);

    // ── Menu item routes ─────────────────────────────────────────────────────
    if (Array.isArray(menuItems)) {
      itemRoutes = menuItems
        .filter((item: any) => item?.title)
        .map((item: any) => {
          const slug = slugify(item.title);
          const lastMod = item.updatedAt
            ? new Date(item.updatedAt)
            : item.createdAt
              ? new Date(item.createdAt)
              : now;

          const entry: any = {
            url: `${BASE_URL}/item/${slug}`,
            lastModified: lastMod,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          };

          // Attach Cloudinary image for Google Image Sitemap indexing
          if (item.image) {
            entry.images = [
              {
                loc: item.image,
                title: `${item.title} — Little Karachi Express`,
                caption: item.category
                  ? `${item.title} from the ${item.category} menu at Little Karachi Express, Karachi.`
                  : `${item.title} available at Little Karachi Express, Karachi.`,
              },
            ];
          }

          return entry;
        });
    }

    // ── Platter routes ───────────────────────────────────────────────────────
    if (Array.isArray(platters)) {
      platterRoutes = platters
        .filter((platter: any) => platter?.title)
        .map((platter: any) => {
          const slug = slugify(platter.title);
          const lastMod = platter.updatedAt
            ? new Date(platter.updatedAt)
            : platter.createdAt
              ? new Date(platter.createdAt)
              : now;

          const entry: any = {
            url: `${BASE_URL}/platter/${slug}`,
            lastModified: lastMod,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          };

          // Attach Cloudinary image for Google Image Sitemap indexing
          if (platter.image) {
            entry.images = [
              {
                loc: platter.image,
                title: `${platter.title} (Feast Platter) — Little Karachi Express`,
                caption: platter.platterCategory
                  ? `${platter.title} from the ${platter.platterCategory} category at Little Karachi Express, Karachi.`
                  : `${platter.title} feast platter at Little Karachi Express, Karachi.`,
              },
            ];
          }

          return entry;
        });
    }
  } catch (error) {
    console.error('[Sitemap] Error fetching dynamic catalog routes from database:', error);
  }

  return [...staticRoutes, ...itemRoutes, ...platterRoutes];
}
