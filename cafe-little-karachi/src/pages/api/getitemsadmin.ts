import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "../../lib/testConnection"; // Replace with your actual database connection function
import MenuItem from "../../models/MenuItem"; // Your Mongoose model for MenuItem

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Connect to the database
  await connectToDatabase();

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