import { NextApiRequest, NextApiResponse } from "next";
import testMongoConnection from "../../lib/testConnection"; // Assuming you have a MongoDB connection utility
import Platter from "../../models/Platter"; // Platter model

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      await testMongoConnection();
      
      const { title, description, basePrice, image, categories } = req.body;

      const newPlatter = new Platter({
        title,
        description,
        basePrice,
        image,
        categories,
      });

      const savedPlatter = await newPlatter.save();

      res.status(200).json(savedPlatter);
    } catch (error) {
      res.status(500).json({ message: "Error saving platter", error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
