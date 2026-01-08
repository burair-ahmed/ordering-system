import type { NextApiRequest, NextApiResponse } from 'next';
import Platter from '../../models/Platter';
import testMongoConnection from '../../lib/testConnection';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const { ids, isVisible } = req.body;

    try {
      if (!ids || !Array.isArray(ids) || typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: 'Missing or invalid required fields (ids: string[], isVisible: boolean)' });
      }

      await testMongoConnection();

      const result = await Platter.updateMany(
        { _id: { $in: ids } },
        { $set: { isVisible } }
      );

      return res.status(200).json({ 
        message: 'Platters updated successfully', 
        modifiedCount: result.modifiedCount 
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error bulk updating platters:', error.message);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
      }
      console.error('Unexpected error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
