
import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Platter from "@/models/Platter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === "POST") {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "Invalid IDs provided" });
      }

      // Search in both collections
      const [menuItems, platters] = await Promise.all([
        MenuItem.find({ _id: { $in: ids } }),
        Platter.find({ _id: { $in: ids } })
      ]);

      // Combine and return
      // We might want to preserve the order of IDs if possible, but for now just returning the list is fine.
      const allItems = [...menuItems, ...platters];
      
      return res.status(200).json(allItems);
    } catch (error) {
      console.error("Error fetching items by IDs:", error);
      return res.status(500).json({ error: "Failed to fetch items" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
