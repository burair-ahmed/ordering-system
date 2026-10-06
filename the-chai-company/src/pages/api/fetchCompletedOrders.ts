import { NextApiRequest, NextApiResponse } from "next";
import Order from "../../models/Order";
import connectDB from "../../lib/db";

const fetchCompletedOrdersHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    try {
      await connectDB();
      const orders = await Order.find({ status: { $regex: /^completed$/i } }); // Case-insensitive search
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
