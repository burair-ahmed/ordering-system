import type { MetadataRoute } from 'next';
import connectDB from '@/lib/db';
import MenuItems from '@/models/MenuItem';
import Platters from '@/models/Platter';
import { slugify } from './lib/slugify';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://cafelittlekarachi.com'
  ).replace(/\/+$/, '');

  const now = new Date();

  // Core static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/order`,
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
      MenuItems.find({ isVisible: { $ne: false } }, 'title createdAt').lean(),
      Platters.find({ isVisible: { $ne: false } }, 'title createdAt').lean(),
    ]);

    if (Array.isArray(menuItems)) {
      itemRoutes = menuItems
        .filter((item: any) => item?.title)
        .map((item: any) => ({
          url: `${baseUrl}/item/${slugify(item.title)}`,
          lastModified: item.createdAt ? new Date(item.createdAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }

    if (Array.isArray(platters)) {
      platterRoutes = platters
        .filter((platter: any) => platter?.title)
        .map((platter: any) => ({
          url: `${baseUrl}/platter/${slugify(platter.title)}`,
          lastModified: platter.createdAt ? new Date(platter.createdAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch (error) {
    console.error('[Sitemap] Error fetching dynamic catalog routes from database:', error);
  }

  return [...staticRoutes, ...itemRoutes, ...platterRoutes];
}
