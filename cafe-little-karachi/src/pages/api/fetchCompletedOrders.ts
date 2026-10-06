import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(MONGODB_URI);
  }
}

const fetchCompletedOrdersHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    try {
      await connectToDatabase();
      const orders = await Order.find({ status: { $regex: /^(completed|delivered)$/i } }); // Case-insensitive search
      res.status(200).json({ orders });
    } catch (error) {
      console.error("Error fetching completed orders:", error);
      res.status(500).json({ message: "Failed to fetch completed orders.", error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
};

export default fetchCompletedOrdersHandler;
