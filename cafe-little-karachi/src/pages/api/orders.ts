import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { isOpenAt } from "../../app/lib/restaurantStatus";
import { sendMetaCapiEvent } from "../../lib/metaCapi";

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
    // Check operating hours in production (allow daytime testing in development)
    if (process.env.NODE_ENV === "production" && !isOpenAt()) {
      return res.status(400).json({
        success: false,
        message: "Cafe Little Karachi is currently closed. Ordering opens at 6:30 PM.",
      });
    }

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

    const missingFields: string[] = [];
    if (!customerName) missingFields.push("Customer Name");
    if (!items || !items.length) missingFields.push("Cart Items");
    if (totalAmount === undefined || totalAmount === null) missingFields.push("Total Amount");
    if (!status) missingFields.push("Status");
    if (!ordertype) missingFields.push("Order Type");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (ordertype === "delivery" && (!area || !phone)) {
      return res.status(400).json({
        success: false,
        message: "Delivery orders require both a delivery area and contact phone number.",
      });
    }

    if (ordertype === "dinein" && !tableNumber) {
      return res.status(400).json({
        success: false,
        message: "Dine-in orders require a table number.",
      });
    }

    try {
      await connectToDatabase();

      const orderNumber = await generateOrderNumber();

      const newOrder = new Order({
        orderNumber,
        customerName,
        email: email || "",
        ordertype,
        tableNumber: ordertype === "dinein" ? tableNumber : null,
        area: ordertype === "delivery" ? area : null,
        phone: phone || null,
        paymentMethod: paymentMethod || "cash",
        deliveryCharge: ordertype === "delivery" ? deliveryCharge || 0 : 0,
        items: items.map((item: OrderItem) => ({
          id: String(item.id),
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "",
          variations: Array.isArray(item.variations)
            ? item.variations.map((v: any) =>
                typeof v === "string" ? v : v.name || v.optionName || JSON.stringify(v)
              )
            : [],
        })),
        totalAmount,
        status: status || "Received",
        createdAt: new Date(),
      });

      await newOrder.save();

      // Dispatch Meta Conversions API (CAPI) Purchase Event (Server-Side)
      try {
        const forwardedFor = req.headers["x-forwarded-for"];
        const clientIp =
          (typeof forwardedFor === "string"
            ? forwardedFor.split(",")[0].trim()
            : undefined) || req.socket.remoteAddress;
        const clientUserAgent = req.headers["user-agent"];
        const fbp = req.cookies?.["_fbp"];
        const fbc = req.cookies?.["_fbc"];
        const referer = req.headers.referer || "https://cafelittlekarachi.com/checkout";

        sendMetaCapiEvent({
          eventName: "Purchase",
          eventId: orderNumber, // Matches browser Meta Pixel eventID for deduplication
          eventSourceUrl: referer,
          userData: {
            email: email || undefined,
            phone: phone || undefined,
            firstName: customerName ? customerName.split(" ")[0] : undefined,
            lastName: customerName && customerName.includes(" ") ? customerName.split(" ").slice(1).join(" ") : undefined,
            clientIp,
            clientUserAgent,
            fbp,
            fbc,
          },
          customData: {
            currency: "PKR",
            value: totalAmount,
            content_type: "product",
            order_id: orderNumber,
            contents: items.map((it: OrderItem) => ({
              id: String(it.id),
              quantity: it.quantity,
              item_price: it.price,
              title: it.title,
            })),
          },
        }).catch((capiErr) => {
          console.warn("[Meta CAPI Purchase] Async send error:", capiErr);
        });
      } catch (capiSyncErr) {
        console.warn("[Meta CAPI Purchase] Setup error:", capiSyncErr);
      }

      // Emit real-time WebSocket event to kitchen/admin dashboard
      try {
        const socket = (res.socket as unknown as CustomSocket)?.server?.io;
        if (socket) {
          socket.emit("new-order", newOrder);
        }
      } catch (wsErr) {
        console.warn("WebSocket notification error:", wsErr);
      }

      return res.status(201).json(newOrder);
    } catch (error: any) {
      console.error("Error creating order:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create order. Please try again.",
        error: error.message,
      });
    }
  } else if (req.method === "GET") {
    try {
      await connectToDatabase();
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.status(200).json(orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders.",
        error: error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default ordersHandler;
