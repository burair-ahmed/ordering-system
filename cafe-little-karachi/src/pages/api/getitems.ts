import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "../../lib/testConnection";
import MenuItem from "../../models/MenuItem";
import mongoose from "mongoose";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await connectToDatabase();

  // Handling pagination params (page and limit)
  const { page = 1, limit = 10, category = "", ids = "" } = req.query;

  if (req.method === "GET") {
    try {
      // Fetch menu items for the specified category or specific IDs with pagination
      let query: any = { isVisible: { $ne: false } };
      
      if (ids) {
        const idArray = (ids as string).split(',');
        
        const validObjectIds = idArray.filter(id => mongoose.Types.ObjectId.isValid(id));
        
        query.$or = [
          { id: { $in: idArray } },
          { _id: { $in: validObjectIds } }
        ];
      } else if (category) {
        query.category = category;
      }
      
      const menuItems = await MenuItem.find(query)
        .skip((Number(page) - 1) * Number(limit)) // Skip based on the page
        .limit(Number(limit)); // Limit the number of items fetched

      res.status(200).json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ error: "Failed to fetch menu items", details: error });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" }); // Other HTTP methods
  }
};

export default handler;
