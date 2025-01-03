import { NextApiRequest, NextApiResponse } from "next";
import testMongoConnection from "../../lib/testConnection";
import Order from "../../models/Order";

const deleteOrderHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "DELETE") {
    const { orderNumber } = req.query;

    if (!orderNumber || typeof orderNumber !== "string") {
      return res.status(400).json({ message: "Invalid or missing orderNumber" });
    }

    try {
      // Ensure the MongoDB connection is established
      await testMongoConnection();

      // Find and delete the order
      const deletedOrder = await Order.findOneAndDelete({ orderNumber });

      if (!deletedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json({ message: "Order deleted successfully", order: deletedOrder });
    } catch (error) {
      console.error("Error deleting order:", error);
      return res.status(500).json({ message: "Failed to delete order" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default deleteOrderHandler;
