import type { NextApiRequest, NextApiResponse } from 'next';
import MenuItem from '../../models/MenuItem';
import testMongoConnection from '../../lib/testConnection';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const { ids, isVisible } = req.body;

    try {
      if (!ids || !Array.isArray(ids) || typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: 'Missing or invalid required fields (ids: string[], isVisible: boolean)' });
      }

      await testMongoConnection();

      const result = await MenuItem.updateMany(
        { _id: { $in: ids } },
        { $set: { isVisible } }
      );

      return res.status(200).json({ 
        message: 'Menu items updated successfully', 
        modifiedCount: result.modifiedCount 
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error bulk updating menu items:', error.message);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
      }
      console.error('Unexpected error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
