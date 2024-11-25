import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { title, price, image, description, variations } = req.body;

    // Validate input
    if (!title || !price || !description) {
      return res.status(400).json({ error: 'Title, price, and description are required' });
    }

    try {
      await client.connect();
      const database = client.db('restaurant');
      const collection = database.collection('menuItems');

      // Insert into the database
      const result = await collection.insertOne({
        title,
        price,
        description,
        image,
        variations,
        createdAt: new Date(),
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Error saving to database:', error);
      res.status(500).json({ error: 'Failed to save menu item' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default handler;
