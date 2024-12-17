import { NextApiRequest, NextApiResponse } from 'next';
import testMongoConnection from '../../lib/testConnection'; // Import your database connection helper
import MenuItem from '../../models/MenuItem'; // Replace with your menu item model

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await testMongoConnection(); // Ensure the database is connected

  if (req.method === 'PUT') {
    const { id, title, description, price, category, variations, image, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    try {
      const updatedItem = await MenuItem.findByIdAndUpdate(
        id,
        { title, description, price, category, variations, image, status },
        { new: true } // Return the updated document
      );

      if (!updatedItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      return res.status(200).json(updatedItem);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
