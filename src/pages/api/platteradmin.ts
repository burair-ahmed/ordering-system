import { NextApiRequest, NextApiResponse } from 'next';
import testMongoConnection from '../../lib/testConnection'; // Import the testMongoConnection function
import Platter from '../../models/Platter'; // Assuming you have a Platter model in the models folder

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Establish the MongoDB connection but don't store it if not needed
    await testMongoConnection(); // Only call the function if you need to test the connection

    // Perform different actions based on the HTTP method
    if (req.method === 'GET') {
      const platters = await Platter.find();
      res.status(200).json(platters);
    } else if (req.method === 'POST') {
      const newPlatter = new Platter(req.body);
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
