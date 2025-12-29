import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import PlatterCategory from '@/models/PlatterCategory';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await connectDB();

  switch (method) {
    case 'GET':
      try {
        const categories = await PlatterCategory.find({}).sort({ name: 1 });
        res.status(200).json(categories);
      } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to fetch platter categories' });
      }
      break;

    case 'POST':
      try {
        const { name } = req.body;
        if (!name) {
          return res.status(400).json({ success: false, message: 'Name is required' });
        }
        
        // Case-insensitive check for existing category
        const existingCategory = await PlatterCategory.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const category = await PlatterCategory.create({ name });
        res.status(201).json(category);
      } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to create platter category' });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
