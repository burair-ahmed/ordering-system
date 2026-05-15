import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../lib/db';
import MenuItems from '../../models/MenuItem';
import Platter from '../../models/Platter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectDB();

  try {
    const { category, type, discountType, discountValue } = req.body;

    if (!category || !type) {
      return res.status(400).json({ success: false, message: 'Category and type are required' });
    }

    // Prepare update data. If discountValue is 0 or not provided, we can either set to 0 or remove.
    // The model has `discountValue: { type: Number, default: 0 }` and `discountType: { type: String, enum: ['percentage', 'fixed'] }`
    const updateData: any = {};
    
    if (discountType && discountValue > 0) {
      updateData.discountType = discountType;
      updateData.discountValue = discountValue;
    } else {
      // Remove discount
      updateData.$unset = { discountType: "" };
      updateData.discountValue = 0;
    }

    let result;

    if (type === 'menu') {
      if (updateData.$unset) {
        result = await MenuItems.updateMany(
          { category: category },
          { $set: { discountValue: 0 }, $unset: { discountType: "" } }
        );
      } else {
        result = await MenuItems.updateMany(
          { category: category },
          { $set: { discountType, discountValue } }
        );
      }
    } else if (type === 'platter') {
      if (updateData.$unset) {
        result = await Platter.updateMany(
          { platterCategory: category },
          { $set: { discountValue: 0 }, $unset: { discountType: "" } }
        );
      } else {
        result = await Platter.updateMany(
          { platterCategory: category },
          { $set: { discountType, discountValue } }
        );
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    res.status(200).json({
      success: true,
      message: `Discount applied to ${result.modifiedCount} items.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Error applying bulk discount:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
