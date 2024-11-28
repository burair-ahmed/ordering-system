import { NextApiRequest, NextApiResponse } from 'next';
import testMongoConnection from '../../lib/testConnection'; // Update with the correct path to your db.ts
import MenuItem from '../../models/MenuItem'; // Your Mongoose model for MenuItem

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Call the connectDB function to establish a connection before any DB operations
  await testMongoConnection();

  if (req.method === 'POST') {
    const { title, price, description, image, variations } = req.body;

    // Validate input
    if (!title || !price || !description) {
      return res.status(400).json({ error: 'Title, price, and description are required' });
    }

    try {
      const newMenuItem = new MenuItem({
        title,
        price,
        description,
        image,
        variations,
      });
    
      const result = await newMenuItem.save();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {  // Explicitly type 'error' as 'any'
      console.error('Error saving to database:', error);
      res.status(500).json({ error: 'Failed to save menu item', details: error.message });
    }    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default handler;
