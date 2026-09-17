import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import CartUpsellConfig from '@/models/CartUpsellConfig';
import MenuItem from '@/models/MenuItem';
import Platter from '@/models/Platter';
import mongoose from 'mongoose';

export interface UpsellItemDTO {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: string;
  type: 'menu' | 'platter';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      let config: any = await CartUpsellConfig.findOne({}).lean();
      if (!config) {
        const newCfg = new CartUpsellConfig({
          isEnabled: true,
          heading: 'Popular with your order',
          mode: 'auto',
          itemIds: [],
        });
        await newCfg.save();
        config = newCfg.toObject();
      }

      const isManual = config?.mode === 'manual' && Array.isArray(config?.itemIds) && config.itemIds.length > 0;
      let items: UpsellItemDTO[] = [];

      if (isManual) {
        const itemIds: string[] = config!.itemIds;
        const validObjectIds = itemIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

        // Query MenuItems
        const menuMatches = await MenuItem.find({
          $or: [
            { id: { $in: itemIds } },
            { _id: { $in: validObjectIds } },
          ],
          status: 'in stock',
          isVisible: { $ne: false },
        }).lean();

        // Query Platters
        const platterMatches = await Platter.find({
          $or: [
            { id: { $in: itemIds } },
            { _id: { $in: validObjectIds } },
          ],
          status: 'in stock',
          isVisible: { $ne: false },
        }).lean();

        const formattedMenu: UpsellItemDTO[] = menuMatches.map((m: any) => {
          let price = m.price;
          let originalPrice: number | undefined = undefined;
          if (m.discountValue && m.discountValue > 0) {
            originalPrice = m.price;
            price = m.discountType === 'percentage'
              ? Math.round(m.price - (m.price * m.discountValue) / 100)
              : Math.max(0, m.price - m.discountValue);
          }
          return {
            id: m.id || m._id.toString(),
            title: m.title,
            price,
            originalPrice,
            image: m.image || '/placeholder.png',
            category: m.category,
            type: 'menu',
          };
        });

        const formattedPlatters: UpsellItemDTO[] = platterMatches.map((p: any) => {
          let price = p.basePrice;
          let originalPrice: number | undefined = undefined;
          if (p.discountValue && p.discountValue > 0) {
            originalPrice = p.basePrice;
            price = p.discountType === 'percentage'
              ? Math.round(p.basePrice - (p.basePrice * p.discountValue) / 100)
              : Math.max(0, p.basePrice - p.discountValue);
          }
          return {
            id: p.id || p._id.toString(),
            title: p.title,
            price,
            originalPrice,
            image: p.image || '/placeholder.png',
            category: p.platterCategory,
            type: 'platter',
          };
        });

        const allFound = [...formattedMenu, ...formattedPlatters];
        // Sort by the exact order configured in itemIds
        items = itemIds
          .map((id) => allFound.find((it) => it.id === id))
          .filter((it): it is UpsellItemDTO => Boolean(it));
      }

      // If in auto mode or manual list returned no items, fetch top in-stock dishes
      if (items.length === 0) {
        const autoMenuItems = await MenuItem.find({
          status: 'in stock',
          isVisible: { $ne: false },
          image: { $exists: true, $ne: '' },
        })
          .sort({ sortOrder: 1, createdAt: -1 })
          .limit(10)
          .lean();

        items = autoMenuItems.map((m: any) => {
          let price = m.price;
          let originalPrice: number | undefined = undefined;
          if (m.discountValue && m.discountValue > 0) {
            originalPrice = m.price;
            price = m.discountType === 'percentage'
              ? Math.round(m.price - (m.price * m.discountValue) / 100)
              : Math.max(0, m.price - m.discountValue);
          }
          return {
            id: m.id || m._id.toString(),
            title: m.title,
            price,
            originalPrice,
            image: m.image || '/placeholder.png',
            category: m.category,
            type: 'menu',
          };
        });
      }

      return res.status(200).json({
        config: {
          isEnabled: config?.isEnabled ?? true,
          heading: config?.heading || 'Popular with your order',
          mode: config?.mode || 'auto',
          itemIds: config?.itemIds || [],
        },
        items,
      });
    } catch (error: any) {
      console.error('Error fetching cart upsells:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { isEnabled, heading, mode, itemIds } = req.body;

      const updateData: any = {};
      if (typeof isEnabled === 'boolean') updateData.isEnabled = isEnabled;
      if (typeof heading === 'string') updateData.heading = heading.trim();
      if (mode === 'auto' || mode === 'manual') updateData.mode = mode;
      if (Array.isArray(itemIds)) updateData.itemIds = itemIds;

      const updated = await CartUpsellConfig.findOneAndUpdate(
        {},
        updateData,
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        config: updated,
      });
    } catch (error: any) {
      console.error('Error updating cart upsell config:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
