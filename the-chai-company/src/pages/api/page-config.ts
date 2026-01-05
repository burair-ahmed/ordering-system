
import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import PageConfig from "@/models/PageConfig";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === "GET") {
    try {
      let config = await PageConfig.findOne({ type: "order-page" });
      
      if (!config) {
        // Initialize default empty CMS config
        config = new PageConfig({
          type: "order-page",
          sections: []
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
      const { sections } = req.body;
      console.log("Saving PageConfig Sections:", JSON.stringify(sections, null, 2)); // DEBUG LOG

      const config = await PageConfig.findOneAndUpdate(
        { type: "order-page" },
        { sections },
        { new: true, upsert: true }
      );
      
      console.log("Saved Config Result:", config); // DEBUG LOG

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
