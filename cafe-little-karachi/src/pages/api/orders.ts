import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variations?: string[];
}

interface CustomSocket {
  server: HTTPServer & { io?: SocketIOServer };
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

const generateOrderNumber = async () => {
  const today = new Date();
  const datePart = `${today.getFullYear()}${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;

  const lastOrder = await Order.findOne({
    orderNumber: new RegExp(`^CLK-ORD-${datePart}-`),
  })
    .sort({ orderNumber: -1 })
    .limit(1);

  const counter = lastOrder
    ? parseInt(lastOrder.orderNumber.split("-")[3]) + 1
    : 1;
  const counterPart = counter.toString().padStart(4, "0");
  return `CLK-ORD-${datePart}-${counterPart}`;
};

const ordersHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const {
      customerName,
      email,
      tableNumber,
      paymentMethod,
      items,
      totalAmount,
      deliveryCharge,
      status,
      ordertype,
      area,
      phone,
    } = req.body;

    if (!customerName || !items || !totalAmount || !status || !ordertype) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (ordertype === "delivery" && (!area || !phone)) {
      return res
        .status(400)
        .json({ message: "Delivery requires both address and phone number." });
    }

    try {
      await connectToDatabase();

      const orderNumber = await generateOrderNumber();

      const newOrder = new Order({
        orderNumber,
        customerName,
        email,
        ordertype,
        tableNumber: ordertype === "dinein" ? tableNumber : null,
        area: ordertype === "delivery" ? area : null,
        phone: ordertype === "delivery" ? phone : null,
        paymentMethod,
        deliveryCharge: ordertype === "delivery" ? deliveryCharge : 0,
        items: items.map((item: OrderItem) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          variations: item.variations || [],
        })),
        totalAmount,
        status,
      });

      await newOrder.save();

      const io = (res.socket as unknown as CustomSocket).server?.io;
      if (io) io.emit("newOrder", newOrder);

      return res.status(200).json({
        message: "Order received successfully",
        orderNumber,
        ordertype,
        tableNumber: newOrder.tableNumber,
      });
    } catch (error) {
      console.error("Error saving order:", error);
      return res.status(500).json({ message: "Failed to save order to database" });
    }
  } else if (req.method === "GET") {
    try {
      await connectToDatabase();
      const orders = await Order.find({ status: { $ne: "Completed" } }).sort({
        createdAt: -1,
      });
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found" });
      }
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
