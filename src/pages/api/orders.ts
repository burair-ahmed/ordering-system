import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) { // Check if MongoDB is not already connected
    await mongoose.connect(MONGODB_URI); // Connect to MongoDB
  }
}

// Handle incoming requests
const ordersHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { orderNumber, customerName, email, tableNumber, paymentMethod, items, totalAmount, status } = req.body;

    // Validate required fields
    if (!orderNumber || !customerName || !email || !tableNumber || !items || !totalAmount || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      // Connect to the database
      await connectToDatabase();

      // Create a new order document
      const newOrder = new Order({
        orderNumber,
        customerName,
        email,
        tableNumber,
        paymentMethod,
        items,
        totalAmount,
        status,
      });

      // Save the new order to MongoDB
      await newOrder.save();

      return res.status(200).json({ message: "Order received successfully" });
    } catch (error) {
      console.error("Error saving order:", error);
      return res.status(500).json({ message: "Failed to save order to database" });
    }
  } else if (req.method === "GET") {
    try {
      // Connect to the database
      await connectToDatabase();

      // Fetch all orders from the database
      const orders = await Order.find({});

      return res.status(200).json({ orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Failed to fetch orders" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default ordersHandler;
