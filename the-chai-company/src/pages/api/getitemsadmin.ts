import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import MenuItem from "../../models/MenuItem"; // Your Mongoose model for MenuItem

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Connect to the database
  await connectDB();

  if (req.method === "GET") {
    try {
      // Fetch all menu items from the database
      const menuItems = await MenuItem.find(); // Adjust according to your database setup
      res.status(200).json(menuItems); // Send the data as JSON response
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ error: "Failed to fetch menu items", details: error });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" }); // For other HTTP methods
  }
};

export default handler;