import { NextApiRequest, NextApiResponse } from "next";
import testMongoConnection from "../../lib/testConnection"; // MongoDB connection utility
import Platter from "../../models/Platter"; // Platter model

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      await testMongoConnection();

      const { 
        title, 
        description, 
        basePrice, 
        image, 
        categories, 
        platterCategory,
        additionalChoices, // Destructure additionalChoices from body
        discountType,
        discountValue,
        isVisible
      } = req.body;

      // Validate image format (base64 check)
      const validBase64Regex = /^data:image\/(png|jpg|jpeg|gif);base64,/;
      if (!validBase64Regex.test(image)) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      // Validate additional choices (optional, but ensure proper structure)
      if (additionalChoices && !Array.isArray(additionalChoices)) {
        return res.status(400).json({ message: "Invalid additionalChoices format" });
      }

      // Create the new platter document
      const newPlatter = new Platter({
        title,
        description,
        basePrice,
        image,
        categories,
        platterCategory,
        additionalChoices, // Include additionalChoices
        discountType,
        discountValue,
        isVisible
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