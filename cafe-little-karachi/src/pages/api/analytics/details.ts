// pages/api/analytics/details.ts
import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../../models/Order";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

const getTableOrderDetails = async (req: NextApiRequest, res: NextApiResponse) => {
  const { tableNumber } = req.query;

  if (!tableNumber) {
    return res.status(400).json({ message: "Table Number is required" });
  }

  try {
    await connectToDatabase();

    // Fetch the table's orders
    const orders = await Order.aggregate([
      {
        $match: { tableNumber: String(tableNumber) }, // Match orders for the specific table
      },
      {
        $unwind: "$items", // Unwind the items array to handle each item individually
      },
      {
        $match: { "items.title": { $exists: true, $ne: null } }, // Ensure items have a title
      },
      {
        $group: {
          _id: "$items.title", // Group by item title
          totalQuantity: { $sum: "$items.quantity" }, // Sum the quantity for each item
        },
      },
      {
        $project: {
          itemName: "$_id", // Rename `_id` to `itemName`
          totalQuantity: 1,
          _id: 0,
        },
      },
    ]);

    // Log the orders to debug the result
    console.log("Fetched orders:", orders);

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching table order details:", error);
    res.status(500).json({ message: "Failed to fetch table order details" });
  }
};

export default getTableOrderDetails;
