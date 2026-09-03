import { NextApiRequest, NextApiResponse } from 'next';
import testMongoConnection from '../../lib/testConnection'; // Import the testMongoConnection function
import Platter from '../../models/Platter'; // Assuming you have a Platter model in the models folder
import { ensureCloudinaryUrl } from '@/lib/cloudinary';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await testMongoConnection();

    if (req.method === 'GET') {
      const platters = await Platter.find();
      res.status(200).json(platters);
    } else if (req.method === 'POST') {
      const body = req.body;
      if (body.image) {
        body.image = await ensureCloudinaryUrl(body.image, "cafe-little-karachi/platters");
      }
      const newPlatter = new Platter(body);
      await newPlatter.save();
      res.status(201).json(newPlatter);
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export default handler;
