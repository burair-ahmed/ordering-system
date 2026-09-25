/**
 * src/lib/seoHelpers.ts
 * Server-side helpers for dynamic generateMetadata() on item and platter routes.
 */

import type { Metadata } from 'next';
import connectDB from './db';
import MenuItem from '../models/MenuItem';
import Platter from '../models/Platter';
import { slugify } from '../app/lib/slugify';

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cafelittlekarachi.com'
).replace(/\/+$/, '');

const CLK_DEFAULT_OG_BANNER =
  'https://res.cloudinary.com/dubg6octv/image/upload/v1790323590/cafe-little-karachi/seo/clk_og_banner.jpg';

// ─── Item (MenuItem) Metadata ────────────────────────────────────────────────

export async function generateItemMetadata(slug: string): Promise<Metadata> {
  try {
    await connectDB();

    // Find item whose title slugifies to the given slug
    const allItems = await MenuItem.find(
      { isVisible: { $ne: false } },
      'title description price image category variations'
    ).lean();

    const item: any = allItems.find(
      (i: any) => slugify(i.title) === slug
    );

    if (!item) {
      return {
        title: 'Menu Item | Little Karachi Express',
        description:
          'Order authentic Karachi food online. Dine-in, takeaway, and express delivery.',
      };
    }

    const title = `${item.title} — Order Online`;
    const minPrice = item.variations?.length
      ? Math.min(...item.variations.map((v: any) => Number(v.price) || item.price))
      : item.price;

    const description = item.description
      ? `${item.description} — Available from Rs. ${minPrice} at Little Karachi Express. Order for dine-in, takeaway, or express delivery.`
      : `Order ${item.title} starting from Rs. ${minPrice} at Little Karachi Express. Fast delivery across Karachi.`;

    const canonicalUrl = `${BASE_URL}/item/${slug}`;
    const imageUrl = item.image || CLK_DEFAULT_OG_BANNER;

    return {
      title,
      description,
      keywords: [
        item.title,
        `${item.title} Karachi`,
        `Order ${item.title} online`,
        item.category,
        'Karachi Food Delivery',
        'Little Karachi Express',
        'Online Food Order Karachi',
      ].filter(Boolean),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: 'website',
        locale: 'en_PK',
        url: canonicalUrl,
        siteName: 'Little Karachi Express',
        title: `${title} | Little Karachi Express`,
        description,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: `${item.title} — Little Karachi Express`,
            type: 'image/jpeg',
          },
          {
            url: CLK_DEFAULT_OG_BANNER,
            width: 1200,
            height: 630,
            alt: 'Little Karachi Express — Authentic Karachi Food',
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@LKExpressKarachi',
        title: `${title} | Little Karachi Express`,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: 'Menu Item | Little Karachi Express',
      description: 'Order authentic Karachi food online.',
    };
  }
}

// ─── Platter Metadata ─────────────────────────────────────────────────────────

export async function generatePlatterMetadata(slug: string): Promise<Metadata> {
  try {
    await connectDB();

    const allPlatters = await Platter.find(
      { isVisible: { $ne: false } },
      'title description basePrice image platterCategory'
    ).lean();

    const platter: any = allPlatters.find(
      (p: any) => slugify(p.title) === slug
    );

    if (!platter) {
      return {
        title: 'Gourmet Platter | Little Karachi Express',
        description:
          'Order gourmet feast platters for family and groups. Dine-in, takeaway, and express delivery across Karachi.',
      };
    }

    const title = `${platter.title} (Feast Platter)`;
    const price = platter.basePrice;

    const description = platter.description
      ? `${platter.description} — Starting from Rs. ${price}. Perfect for groups and family dining at Little Karachi Express.`
      : `Order ${platter.title} feast platter starting from Rs. ${price} at Little Karachi Express. Express delivery and dine-in available across Karachi.`;

    const canonicalUrl = `${BASE_URL}/platter/${slug}`;
    const imageUrl = platter.image || CLK_DEFAULT_OG_BANNER;

    return {
      title,
      description,
      keywords: [
        platter.title,
        `${platter.title} Karachi`,
        `${platter.platterCategory} Karachi`,
        'Gourmet Platters Karachi',
        'Feast Platter Karachi',
        'Group Food Ordering Karachi',
        'Little Karachi Express',
        'Family Meal Platter',
      ].filter(Boolean),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: 'website',
        locale: 'en_PK',
        url: canonicalUrl,
        siteName: 'Little Karachi Express',
        title: `${title} | Little Karachi Express`,
        description,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: `${platter.title} — Little Karachi Express`,
            type: 'image/jpeg',
          },
          {
            url: CLK_DEFAULT_OG_BANNER,
            width: 1200,
            height: 630,
            alt: 'Little Karachi Express — Authentic Karachi Food',
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@LKExpressKarachi',
        title: `${title} | Little Karachi Express`,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: 'Gourmet Platter | Little Karachi Express',
      description: 'Order gourmet feast platters. Express delivery across Karachi.',
    };
  }
}
