import { NextApiRequest, NextApiResponse } from "next";
import testMongoConnection from "../../lib/testConnection"; // Assuming you have a MongoDB connection utility
import Platter from "../../models/Platter"; // Platter model

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      await testMongoConnection();

      // Destructure platter details from the request body
      const { title, description, basePrice, image, categories, platterCategory } = req.body;

      // Create a new platter with the platterCategory
      const newPlatter = new Platter({
        title,
        description,
        basePrice,
        image,
        categories,
        platterCategory, // Include platterCategory in the data to save
      });

      // Save the platter to the database
      const savedPlatter = await newPlatter.save();

      // Return the saved platter as a response
      res.status(200).json(savedPlatter);
    } catch (error) {
      // Return error response if something goes wrong
      res.status(500).json({ message: "Error saving platter", error });
    }
  } else {
    // Handle unsupported HTTP methods (e.g., GET, PUT)
    res.status(405).json({ message: "Method not allowed" });
  }
}
