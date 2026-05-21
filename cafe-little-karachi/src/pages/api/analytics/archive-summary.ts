import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../../models/Order";

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectToDatabase();

    // Aggregation for completed orders statistics
    const stats = await Order.aggregate([
      { $match: { status: "Completed" } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" },
          dineinCount: {
            $sum: { $cond: [{ $eq: ["$ordertype", "dinein"] }, 1, 0] }
          },
          pickupCount: {
            $sum: { $cond: [{ $eq: ["$ordertype", "pickup"] }, 1, 0] }
          },
          deliveryCount: {
            $sum: { $cond: [{ $eq: ["$ordertype", "delivery"] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        dineinCount: 0,
        pickupCount: 0,
        deliveryCount: 0,
        ratios: { dinein: 0, pickup: 0, delivery: 0 }
      });
    }

    const s = stats[0];
    const total = s.totalOrders || 1; // avoid divide by zero

    return res.status(200).json({
      totalOrders: s.totalOrders || 0,
      totalRevenue: Math.round(s.totalRevenue || 0),
      averageOrderValue: Math.round(s.averageOrderValue || 0),
      dineinCount: s.dineinCount || 0,
      pickupCount: s.pickupCount || 0,
      deliveryCount: s.deliveryCount || 0,
      ratios: {
        dinein: Math.round(((s.dineinCount || 0) / total) * 100),
        pickup: Math.round(((s.pickupCount || 0) / total) * 100),
        delivery: Math.round(((s.deliveryCount || 0) / total) * 100),
      }
    });

  } catch (error) {
    console.error("Error fetching archive summary statistics:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
