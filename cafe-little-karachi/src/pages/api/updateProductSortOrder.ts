import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../lib/db';
import MenuItems from '../../models/MenuItem';
import Platter from '../../models/Platter';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    res.setHeader('Allow', ['PUT', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectDB();

  try {
    const { type, items } = req.body;

    if (!type || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: type and non-empty items array are required'
      });
    }

    if (type !== 'menu' && type !== 'platter') {
      return res.status(400).json({ success: false, message: 'Type must be either "menu" or "platter"' });
    }

    const Model = type === 'menu' ? MenuItems : Platter;

    const bulkOps = items.map((item: { id: string; sortOrder: number }) => {
      const isObjectId = mongoose.Types.ObjectId.isValid(item.id);
      const filter = isObjectId
        ? { $or: [{ _id: item.id }, { id: item.id }] }
        : { id: item.id };

      return {
        updateOne: {
          filter,
          update: { $set: { sortOrder: Number(item.sortOrder) || 0 } }
        }
      };
    });

    const result = await Model.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: `Successfully updated sort order for ${result.modifiedCount || items.length} ${type} items.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Error updating product sort order:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
}
