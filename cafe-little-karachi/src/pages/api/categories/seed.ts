import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import MenuItem from '@/models/MenuItem';
import Platter from '@/models/Platter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();

  try {
    // 1. Get all unique categories from MenuItems
    const menuItems = await MenuItem.find({}, 'category');
    const menuItemCategories = menuItems.map(item => item.category);

    // 2. Get all unique categories from Platters (internal configuration categories)
    const platters = await Platter.find({}, 'categories');
    const platterCategories = platters.flatMap(p => p.categories.map((c: any) => c.categoryName));

    // 3. Merge and unique
    const uniqueCategories = Array.from(new Set([...menuItemCategories, ...platterCategories])).filter(Boolean);

    // 2. Insert them into Category collection if they don't exist
    let addedCount = 0;
    for (const catName of uniqueCategories) {
      const exists = await Category.findOne({ name: catName });
      if (!exists) {
        await Category.create({ name: catName });
        addedCount++;
      }
    }

    res.status(200).json({ 
      message: 'Seeding complete', 
      totalFound: uniqueCategories.length,
      added: addedCount,
      categories: uniqueCategories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error seeding categories' });
  }
}
