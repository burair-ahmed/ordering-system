// pages/api/updateorderstatus.ts

import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";
import OrderLedger from "../../models/OrderLedger";

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(MONGODB_URI);
  }
}

const updateOrderStatusHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "PUT") {
    const { orderNumber, status, paymentStatus } = req.body;

    // Validate required fields
    if (!orderNumber || !status) {
      return res.status(400).json({ message: "Missing required fields: orderNumber or status" });
    }

    try {
      // Connect to the database
      await connectToDatabase();

      const updateFields: Record<string, any> = { status };
      if (paymentStatus) {
        updateFields.paymentStatus = paymentStatus;
      } else if (status === "Received" || status === "Preparing" || status === "Delivered") {
        // If order was in pending verification and is now marked Received/Preparing/Delivered, auto-verify payment
        updateFields.paymentStatus = "verified";
      }

      // Find and update the order in live queue
      const updatedOrder = await Order.findOneAndUpdate(
        { orderNumber }, // Find by orderNumber
        updateFields,    // Update fields
        { new: true }    // Return the updated document
      );

      // Synchronize status with immutable OrderLedger
      try {
        await OrderLedger.findOneAndUpdate(
          { orderNumber },
          updateFields
        );
      } catch (ledgerSyncErr) {
        console.warn('[OrderLedger Sync] Could not sync status update to ledger:', ledgerSyncErr);
      }

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Emit real-time WebSocket event to customer holding page / tracking clients
      try {
        const socket = (res.socket as any)?.server?.io;
        if (socket) {
          socket.emit("order-status-updated", {
            orderNumber,
            status: updatedOrder.status,
            paymentStatus: updatedOrder.paymentStatus,
          });
        }
      } catch (wsErr) {
        console.warn("WebSocket status update notification error:", wsErr);
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
