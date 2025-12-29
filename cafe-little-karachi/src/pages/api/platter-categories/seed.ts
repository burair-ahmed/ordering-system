import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import Platter from '@/models/Platter';
import PlatterCategory from '@/models/PlatterCategory';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Fetch all unique 'platterCategory' strings from Platters
    const platters = await Platter.find({});
    const uniqueCategories = new Set<string>();

    platters.forEach(platter => {
      if (platter.platterCategory) {
        uniqueCategories.add(platter.platterCategory.trim());
      }
    });

    let count = 0;
    const errors = [];

    for (const catName of Array.from(uniqueCategories)) {
      try {
        const exists = await PlatterCategory.findOne({ 
            name: { $regex: new RegExp(`^${catName}$`, 'i') } 
        });
        
        if (!exists) {
          await PlatterCategory.create({ name: catName });
          count++;
        }
      } catch (err) {
        console.error(`Error seeding platter category ${catName}:`, err);
        errors.push(catName);
      }
    }

    res.status(200).json({ 
        success: true, 
        message: `Seeded ${count} new platter categories`, 
        totalProcessed: uniqueCategories.size,
        errors 
    });

  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ success: false, message: 'Seeding failed' });
  }
}
