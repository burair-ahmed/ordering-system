import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import Platter from '@/models/Platter';
import PageConfig from '@/models/PageConfig';

export interface MediaUsageResult {
  total: number;
  usages: MediaUsageEntry[];
}

export interface MediaUsageEntry {
  type: 'menu_item' | 'platter' | 'banner_desktop' | 'banner_mobile' | 'slider_desktop' | 'slider_mobile' | 'story';
  label: string;
  id?: string;
  category?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    await connectDB();

    const usages: MediaUsageEntry[] = [];

    // 1. Check MenuItems
    const menuItems = await MenuItem.find({ image: { $regex: url.split('/').pop()?.split('.')[0] || url, $options: 'i' } }).select('name category image').lean();
    for (const item of menuItems) {
      if ((item.image as string)?.includes(url.split('/').pop()?.split('.')[0] || '')) {
        usages.push({
          type: 'menu_item',
          label: item.name as string,
          id: (item._id as object).toString(),
          category: item.category as string,
        });
      }
    }

    // 2. Check Platters
    const platters = await Platter.find({ image: { $regex: url.split('/').pop()?.split('.')[0] || url, $options: 'i' } }).select('name image').lean();
    for (const platter of platters) {
      if ((platter.image as string)?.includes(url.split('/').pop()?.split('.')[0] || '')) {
        usages.push({
          type: 'platter',
          label: platter.name as string,
          id: (platter._id as object).toString(),
        });
      }
    }

    // 3. Check PageConfig (banners, sliders, stories)
    const configs = await PageConfig.find({}).select('heroBannerDesktop heroBannerMobile classicBannerDesktop classicBannerMobile sections').lean();
    
    const publicId = url.split('/').pop()?.split('.')[0] || url;

    for (const cfg of configs) {
      // Hero banners
      if ((cfg.heroBannerDesktop as string)?.includes(publicId)) {
        usages.push({ type: 'banner_desktop', label: 'Hero Banner (Desktop)' });
      }
      if ((cfg.heroBannerMobile as string)?.includes(publicId)) {
        usages.push({ type: 'banner_mobile', label: 'Hero Banner (Mobile)' });
      }
      if ((cfg.classicBannerDesktop as string)?.includes(publicId)) {
        usages.push({ type: 'banner_desktop', label: 'Classic Banner (Desktop)' });
      }
      if ((cfg.classicBannerMobile as string)?.includes(publicId)) {
        usages.push({ type: 'banner_mobile', label: 'Classic Banner (Mobile)' });
      }

      // CMS Sections (sliders, stories, etc.)
      if (Array.isArray(cfg.sections)) {
        for (const section of cfg.sections as any[]) {
          // Image Banner Slider
          if (section.type === 'image-slider' && Array.isArray(section.slides)) {
            for (const slide of section.slides) {
              if (slide.imageDesktop?.includes(publicId)) {
                usages.push({ type: 'slider_desktop', label: `Slider Slide (Desktop): "${slide.title || 'Untitled'}"` });
              }
              if (slide.imageMobile?.includes(publicId)) {
                usages.push({ type: 'slider_mobile', label: `Slider Slide (Mobile): "${slide.title || 'Untitled'}"` });
              }
            }
          }
          // Rich Content Story
          if (section.type === 'rich-content' && section.storyImage?.includes(publicId)) {
            usages.push({ type: 'story', label: `Story Section: "${section.title || 'Untitled'}"` });
          }
          // Hero section
          if (section.type === 'hero') {
            if (section.backgroundImage?.includes(publicId)) {
              usages.push({ type: 'banner_desktop', label: `CMS Hero (Desktop): "${section.title || 'Hero'}"` });
            }
            if (section.backgroundImageMobile?.includes(publicId)) {
              usages.push({ type: 'banner_mobile', label: `CMS Hero (Mobile): "${section.title || 'Hero'}"` });
            }
          }
        }
      }
    }

    return res.status(200).json({ total: usages.length, usages });
  } catch (error: any) {
    console.error('Media usage lookup error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
