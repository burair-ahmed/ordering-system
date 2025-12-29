import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import Category from '@/models/Category';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const categories = await Category.find({}).sort({ name: 1 });
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: 'Name is required' });

      const category = await Category.create({ name });
      res.status(201).json(category);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Category already exists' });
      }
      res.status(500).json({ message: 'Error creating category' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
