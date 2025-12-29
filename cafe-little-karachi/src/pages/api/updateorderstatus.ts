// pages/api/updateorderstatus.ts

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

const updateOrderStatusHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "PUT") {
    const { orderNumber, status } = req.body;

    // Validate required fields
    if (!orderNumber || !status) {
      return res.status(400).json({ message: "Missing required fields: orderNumber or status" });
    }

    try {
      // Connect to the database
      await connectToDatabase();

      // Find and update the order
      const updatedOrder = await Order.findOneAndUpdate(
        { orderNumber }, // Find by orderNumber
        { status },      // Update the status field
        { new: true }    // Return the updated document
      );

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json({ message: "Order status updated successfully", order: updatedOrder });
    } catch (error) {
      console.error("Error updating order status:", error);
      return res.status(500).json({ message: "Failed to update order status" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default updateOrderStatusHandler;
