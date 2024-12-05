// /pages/api/analytics.ts

import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) { 
    await mongoose.connect(MONGODB_URI); 
  }
}

// Get analytics (daily orders and revenue per table)
const getAnalytics = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await connectToDatabase();

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateStart = new Date(today.setHours(0, 0, 0, 0));
    const dateEnd = new Date(today.setHours(23, 59, 59, 999));

    // Aggregate data
    const analytics = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateStart, $lte: dateEnd },
        },
      },
      {
        $group: {
          _id: "$tableNumber",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          tableNumber: "$_id",
          orderCount: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
    ]);

    // Calculate combined revenue
    const totalRevenueCombined = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateStart, $lte: dateEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.status(200).json({
      tableAnalytics: analytics,
      totalRevenueCombined: totalRevenueCombined[0]?.totalRevenue || 0,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

export default getAnalytics;
