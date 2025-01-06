import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// MongoDB URI
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little";

// Interface for OrderItem
interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variations?: string[];
}

// Interface for the Socket server
interface CustomSocket {
  server: HTTPServer & { io?: SocketIOServer };
}

// Function to connect to MongoDB
async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

// Function to generate a new order number
const generateOrderNumber = async () => {
  const today = new Date();
  const datePart = `${today.getFullYear()}${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;

  const lastOrder = await Order.findOne({ orderNumber: new RegExp(`^CLK-ORD-${datePart}-`) })
    .sort({ orderNumber: -1 })
    .limit(1);

  const counter = lastOrder ? parseInt(lastOrder.orderNumber.split("-")[3]) + 1 : 1;
  const counterPart = counter.toString().padStart(4, "0");
  return `CLK-ORD-${datePart}-${counterPart}`;
};

// Main orders handler
const ordersHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { customerName, email, tableNumber, paymentMethod, items, totalAmount, status } = req.body;

    // Check if all required fields are present
    if (!customerName || !tableNumber || !items || !totalAmount || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      // Connect to the database
      await connectToDatabase();

      // Generate the order number
      const orderNumber = await generateOrderNumber();

      // Save the new order in the database
      const newOrder = new Order({
        orderNumber,
        customerName,
        email,
        tableNumber,
        paymentMethod,
        items: items.map((item: OrderItem) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          variations: item.variations || [],  // Ensure variations is saved as an array
        })),
        totalAmount,
        status,
      });

      // Save the order
      await newOrder.save();

      // Emit the new order event via Socket.IO to the frontend
      const io = (res.socket as unknown as CustomSocket).server?.io;
      if (io) {
        io.emit("newOrder", newOrder);
      }

      // Return success response with the order number
      return res.status(200).json({ message: "Order received successfully", orderNumber });
    } catch (error) {
      console.error("Error saving order:", error);
      return res.status(500).json({ message: "Failed to save order to database" });
    }
  } else if (req.method === "GET") {
    try {
      // Connect to the database
      await connectToDatabase();

      // Fetch orders from the database
      const orders = await Order.find({ status: { $ne: "Completed" } }).sort({ createdAt: -1 });

      // Check if there are no orders
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found" });
      }

      // Return the orders as a response
      return res.status(200).json({ orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Failed to fetch orders" });
    }
  } else {
    // Handle unsupported methods
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default ordersHandler;
