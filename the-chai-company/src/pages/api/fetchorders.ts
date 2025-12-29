// pages/api/fetchorders.ts

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

const fetchOrdersHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    const { page = "1", limit = "20", status = "active" } = req.query;
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 200);

    const isCompleted = status === "completed";
    const match = isCompleted ? { status: "Completed" } : { status: { $ne: "Completed" } };

    try {
      await connectToDatabase();

      const orders = await Order.find(match)
        .sort({ orderNumber: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize);

      const total = await Order.countDocuments(match);
      const totalPages = Math.ceil(total / pageSize);

      return res.status(200).json({ orders, page: pageNum, total, totalPages });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Failed to fetch orders" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default fetchOrdersHandler;
