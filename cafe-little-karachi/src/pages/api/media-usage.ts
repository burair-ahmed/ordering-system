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

function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
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

    // Extract filename stem without extension and clean URL path
    const urlFilename = url.split('?')[0].split('/').pop() || '';
    const publicIdStem = urlFilename.includes('.') ? urlFilename.substring(0, urlFilename.lastIndexOf('.')) : urlFilename;
    const searchTarget = publicIdStem || url;

    // Helper to check if a field contains the image reference
    const matchesImage = (fieldVal?: string | null): boolean => {
      if (!fieldVal || typeof fieldVal !== 'string') return false;
      return fieldVal.includes(searchTarget) || fieldVal.includes(url) || fieldVal.includes(urlFilename);
    };

    // 1. Check MenuItems
    const menuItems = await MenuItem.find({
      $or: [
        { image: { $regex: escapeRegex(searchTarget), $options: 'i' } },
        { image: url }
      ]
    }).select('title category image _id id').lean();

    for (const item of menuItems) {
      if (matchesImage(item.image as string)) {
        usages.push({
          type: 'menu_item',
          label: (item.title as string) || 'Menu Item',
          id: (item._id as any)?.toString() || item.id,
          category: item.category as string,
        });
      }
    }

    // 2. Check Platters
    const platters = await Platter.find({
      $or: [
        { image: { $regex: escapeRegex(searchTarget), $options: 'i' } },
        { image: url }
      ]
    }).select('title platterCategory image _id id').lean();

    for (const platter of platters) {
      if (matchesImage(platter.image as string)) {
        usages.push({
          type: 'platter',
          label: (platter.title as string) || 'Platter Item',
          id: (platter._id as any)?.toString() || platter.id,
          category: platter.platterCategory as string,
        });
      }
    }

    // 3. Check PageConfig (CMS Sections: hero, sliders, stories)
    const configs = await PageConfig.find({}).select('sections').lean();

    for (const cfg of configs) {
      if (Array.isArray(cfg.sections)) {
        for (const section of cfg.sections as any[]) {
          const props = section.props || {};

          // Image Banner Slider
          if (section.type === 'image-slider' && Array.isArray(props.slides)) {
            for (const slide of props.slides) {
              if (matchesImage(slide.image)) {
                usages.push({
                  type: 'slider_desktop',
                  label: `Slider Slide (Desktop): "${slide.title || section.title || 'Untitled'}"`,
                });
              }
              if (matchesImage(slide.mobileImage)) {
                usages.push({
                  type: 'slider_mobile',
                  label: `Slider Slide (Mobile): "${slide.title || section.title || 'Untitled'}"`,
                });
              }
            }
          }

          // Rich Content Story
          if (section.type === 'rich-content' && matchesImage(props.image)) {
            usages.push({
              type: 'story',
              label: `Story Section: "${section.title || 'Untitled'}"`,
            });
          }

          // Hero section
          if (section.type === 'hero') {
            if (matchesImage(props.backgroundImage)) {
              usages.push({
                type: 'banner_desktop',
                label: `Hero Banner (Desktop): "${section.title || props.title || 'Hero'}"`,
              });
            }
            if (matchesImage(props.mobileBackgroundImage)) {
              usages.push({
                type: 'banner_mobile',
                label: `Hero Banner (Mobile): "${section.title || props.title || 'Hero'}"`,
              });
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
