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

// New API to fetch the most recent order for a given tableId
const getOrderByTableId = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    const { tableId } = req.query;

    // Validate if tableId is provided
    if (!tableId) {
      return res.status(400).json({ message: "Missing tableId parameter" });
    }

    try {
      // Connect to the database
      await connectToDatabase();

      // Fetch the most recent order for the given tableId
      const order = await Order.findOne({ tableNumber: tableId })
        .sort({ createdAt: -1 })  // Sort by creation date, most recent first
        .limit(1); // Get only the most recent order

      // Debugging: log the result
      console.log("Fetched order for tableId", tableId, ":", order);

      if (!order) {
        return res.status(404).json({ message: "Order not found for the given tableId" });
      }

      // Return the order number
      return res.status(200).json({ orderNumber: order.orderNumber });
    } catch (error) {
      console.error("Error fetching order:", error);
      return res.status(500).json({ message: "Failed to fetch order" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default getOrderByTableId;
