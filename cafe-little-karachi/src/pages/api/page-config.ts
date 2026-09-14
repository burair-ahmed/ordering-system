import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import PageConfig from "@/models/PageConfig";

const DEFAULT_CLASSIC_CATEGORIES = [
  { id: "sharing-platters", name: "Sharing Platters", isPlatter: true, isVisible: true },
  { id: "meal-boxes", name: "Meal Boxes", isPlatter: true, isVisible: true },
  { id: "fast-food-deals", name: "Fast Food Deals", isPlatter: true, isVisible: true },
  { id: "very-fast-food", name: "Very Fast Food", isPlatter: false, isVisible: true },
  { id: "beast-bbq", name: "Beast BBQ", isPlatter: false, isVisible: true },
  { id: "pizza-parlour", name: "Pizza Parlour", isPlatter: false, isVisible: true },
  { id: "hotpot-and-chinese", name: "Hotpot and Chinese", isPlatter: false, isVisible: true },
  { id: "rolls-royce", name: "Rolls Royce", isPlatter: false, isVisible: true },
  { id: "the-chai-company", name: "The Chai Company", isPlatter: false, isVisible: true },
  { id: "very-extra", name: "Very Extra", isPlatter: false, isVisible: true },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === "GET") {
    try {
      let config = await PageConfig.findOne({ type: "order-page" });
      
      if (!config) {
        // Initialize default CMS config if not found
        config = new PageConfig({
          type: "order-page",
          sections: [],
          useCmsLayout: true,
          classicBannerType: 'hero',
          classicCategories: DEFAULT_CLASSIC_CATEGORIES
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
      const { sections, useCmsLayout, classicBannerType, classicCategories } = req.body;
      console.log("Saving PageConfig for Cafe Little Karachi:", JSON.stringify({ sections, useCmsLayout, classicBannerType, classicCategoriesCount: classicCategories?.length }, null, 2));

      const updateData: any = { sections, useCmsLayout };
      if (classicBannerType) {
        updateData.classicBannerType = classicBannerType;
      }
      if (classicCategories !== undefined) {
        updateData.classicCategories = classicCategories;
      }

      const config = await PageConfig.findOneAndUpdate(
        { type: "order-page" },
        updateData,
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
