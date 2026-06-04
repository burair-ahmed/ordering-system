import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import PageConfig from "@/models/PageConfig";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === "GET") {
    try {
      let config = await PageConfig.findOne({ type: "order-page" });
      
      if (!config) {
        // Initialize default empty CMS config if not found
        config = new PageConfig({
          type: "order-page",
          sections: [],
          useCmsLayout: true
        });
        await config.save();
      }
      
      return res.status(200).json(config);
    } catch (error) {
      console.error("Error fetching PageConfig:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  } else if (req.method === "POST") {
    try {
      const { sections, useCmsLayout } = req.body;
      console.log("Saving PageConfig for Cafe Little Karachi:", JSON.stringify({ sections, useCmsLayout }, null, 2));

      const config = await PageConfig.findOneAndUpdate(
        { type: "order-page" },
        { sections, useCmsLayout },
        { new: true, upsert: true }
      );
      
      return res.status(200).json(config);
    } catch (error) {
       console.error("Error updating PageConfig:", error);
      return res.status(500).json({ error: "Failed to update configuration" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
