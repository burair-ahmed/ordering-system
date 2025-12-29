import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

/**
 * GET /api/order-status
 * Query params:
 *  - orderNumber?: string
 *  - tableId?: string (returns most recent order for that table)
 *
 * Returns the order with minimal fields required for tracking.
 */
const orderStatusHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { orderNumber, tableId } = req.query;

  if (!orderNumber && !tableId) {
    return res
      .status(400)
      .json({ message: "Missing orderNumber or tableId parameter" });
  }

  try {
    await connectToDatabase();

    const query = orderNumber
      ? { orderNumber }
      : { tableNumber: tableId as string };

    const order = await Order.findOne(query)
      .sort({ createdAt: -1 })
      .select(
        "orderNumber status items totalAmount deliveryCharge paymentMethod ordertype tableNumber area phone createdAt"
      )
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order status:", error);
    return res.status(500).json({ message: "Failed to fetch order status" });
  }
};

export default orderStatusHandler;

