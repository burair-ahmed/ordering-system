import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import DiscountConfig from "@/models/DiscountConfig";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === "GET") {
    try {
      let config = await DiscountConfig.findOne({});
      if (!config) {
        config = new DiscountConfig({
          isActive: false,
          discountType: "percentage",
          discountValue: 0,
          minOrderAmount: 0,
          label: "Checkout Discount",
        });
        await config.save();
      }
      return res.status(200).json(config);
    } catch (error: any) {
      console.error("Error fetching DiscountConfig:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch discount configuration" });
    }
  } else if (req.method === "POST" || req.method === "PUT") {
    try {
      const { isActive, discountType, discountValue, minOrderAmount, label } = req.body;

      const updateData: any = {};
      if (typeof isActive === "boolean") updateData.isActive = isActive;
      if (discountType === "percentage" || discountType === "fixed") updateData.discountType = discountType;
      if (discountValue !== undefined) updateData.discountValue = Math.max(0, Number(discountValue));
      if (minOrderAmount !== undefined) updateData.minOrderAmount = Math.max(0, Number(minOrderAmount));
      if (label !== undefined) updateData.label = String(label).trim() || "Checkout Discount";

      // If discount value is 0, auto-deactivate
      if (updateData.discountValue === 0 && updateData.isActive === true) {
        updateData.isActive = false;
      }

      let config = await DiscountConfig.findOne({});
      if (!config) {
        config = new DiscountConfig(updateData);
        await config.save();
      } else {
        config = await DiscountConfig.findByIdAndUpdate(config._id, updateData, { new: true });
      }

      return res.status(200).json({ success: true, config });
    } catch (error: any) {
      console.error("Error updating DiscountConfig:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to update discount configuration" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
