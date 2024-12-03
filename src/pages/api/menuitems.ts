// pages/api/menuitems.ts
import { NextApiRequest, NextApiResponse } from "next";
import testMongoConnection from "../../lib/testConnection";
import MenuItem from "../../models/MenuItem";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await testMongoConnection();

  if (req.method === "POST") {
    const { title, price, description, image, variations, category } = req.body;

    // Validate input
    if (!title || !price || !description || !category) {
      return res.status(400).json({ error: "Title, price, description, and category are required" });
    }

    try {
      const newMenuItem = new MenuItem({
        title,
        price,
        description,
        image,
        variations,
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
