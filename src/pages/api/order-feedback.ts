import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Feedback from "../../models/Feedback";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

/**
 * POST /api/order-feedback
 * Body: { orderNumber, ordertype?, phone?, rating (1-5), comment? }
 */
const orderFeedbackHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { orderNumber, ordertype, phone, rating, comment } = req.body || {};

    if (!orderNumber || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Missing or invalid orderNumber or rating" });
    }

    try {
      await connectToDatabase();

      const doc = new Feedback({
        orderNumber,
        ordertype: ordertype || null,
        phone: phone || null,
        rating,
        comment: comment || "",
      });

      await doc.save();
      return res.status(200).json({ message: "Feedback recorded" });
    } catch (error) {
      console.error("Error saving feedback:", error);
      return res.status(500).json({ message: "Failed to save feedback" });
    }
  } else if (req.method === "GET") {
    const { orderNumber } = req.query;
    if (!orderNumber) {
      return res.status(400).json({ message: "Missing orderNumber parameter" });
    }
    try {
      await connectToDatabase();
      const feedback = await Feedback.find({ orderNumber }).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ feedback });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return res.status(500).json({ message: "Failed to fetch feedback" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default orderFeedbackHandler;

