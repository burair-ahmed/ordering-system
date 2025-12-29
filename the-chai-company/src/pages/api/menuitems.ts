import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";  // Import UUID
import testMongoConnection from "../../lib/testConnection";
import MenuItem from "../../models/MenuItem";

// Define an interface for the variation
interface Variation {
  name: string;
  price: number;
  id?: string;  // Optional since you'll be adding the UUID
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await testMongoConnection();

  if (req.method === "POST") {
    const { title, price, description, image, variations, category } = req.body;

    // Validate input
    if (!title || !price || !description || !category) {
      return res.status(400).json({ error: "Title, price, description, and category are required" });
    }

    try {
      // Generate UUIDs for variations
      const variationsWithUUID = variations.map((variation: Variation) => ({
        ...variation,  // Keep existing properties
        id: uuidv4(),  // Add UUID for each variation
      }));

      const newMenuItem = new MenuItem({
        title,
        price,
        description,
        image,
        variations: variationsWithUUID, // Use the updated variations
        category,
      });

      const result = await newMenuItem.save();
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error saving to database:", error);
        res.status(500).json({ error: "Failed to save menu item", details: error.message });
      } else {
        res.status(500).json({ error: "Failed to save menu item", details: "Unknown error" });
      }
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default handler;
