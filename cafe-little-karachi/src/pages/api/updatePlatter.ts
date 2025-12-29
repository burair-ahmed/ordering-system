import type { NextApiRequest, NextApiResponse } from 'next';
import Platter from '../../models/Platter';
import testMongoConnection from '../../lib/testConnection';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const {
      id,
      title,
      description,
      basePrice,
      platterCategory,
      image,
      categories,
      additionalChoices,
      status,
    } = req.body;

    try {
      if (!id || !title || !basePrice || !platterCategory) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      await testMongoConnection();

      const platter = await Platter.findOneAndUpdate(
        { _id: id }, // Use _id if your schema uses MongoDB's default ObjectId
        { title, description, basePrice, platterCategory, image, categories, additionalChoices, status },
        { new: true }
      );

      if (!platter) {
        return res.status(404).json({ message: 'Platter not found' });
      }

      return res.status(200).json({ message: 'Platter updated successfully', platter });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error updating platter:', error.message);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
      }
      console.error('Unexpected error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
