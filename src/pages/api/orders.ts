import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";
import { Server as HTTPServer } from "http";

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) { 
    await mongoose.connect(MONGODB_URI); 
  }
}

// Function to generate a new order number (e.g., CLK-ORD-20241205-0001)
const generateOrderNumber = async () => {
  const today = new Date();
  const datePart = `${today.getFullYear()}${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;
  
  // Get the last order for the current day to determine the counter
  const lastOrder = await Order.findOne({ orderNumber: new RegExp(`^CLK-ORD-${datePart}-`) })
    .sort({ orderNumber: -1 })
    .limit(1);

  // Generate the counter, incrementing by 1 for each new order
  const counter = lastOrder ? parseInt(lastOrder.orderNumber.split("-")[3]) + 1 : 1;
  const counterPart = counter.toString().padStart(4, "0"); // Ensure the counter is always 4 digits
  return `CLK-ORD-${datePart}-${counterPart}`;
};

// Define a custom socket type
interface CustomSocket {
  server: HTTPServer & { io: any };
}

// Handle incoming requests
const ordersHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { customerName, email, tableNumber, paymentMethod, items, totalAmount, status } = req.body;

    // Validate required fields
    if (!customerName || !tableNumber || !items || !totalAmount || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      // Connect to the database
      await connectToDatabase();

      // Generate the new order number
      const orderNumber = await generateOrderNumber();

      // Create a new order document with a custom id field and the generated order number
      const newOrder = new Order({
        orderNumber, // The custom order number
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

      // Emit the new order event via Socket.IO
      const io = (res.socket as unknown as CustomSocket).server?.io; // Cast to unknown first, then to CustomSocket
      if (io) {
        io.emit("newOrder", newOrder); // Emit the new order to all connected clients
        console.log("New order emitted:", newOrder);
      }

      return res.status(200).json({ message: "Order received successfully" });
    } catch (error) {
      console.error("Error saving order:", error);
      return res.status(500).json({ message: "Failed to save order to database" });
    }
  } else if (req.method === "GET") {
    try {
      // Connect to the database
      await connectToDatabase();

      // Fetch all orders
      const orders = await Order.find({}).sort({ createdAt: -1 });  // Sort by creation date, most recent first

      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found" });
      }

      return res.status(200).json({ orders }); // Return all orders
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Failed to fetch orders" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default ordersHandler;
