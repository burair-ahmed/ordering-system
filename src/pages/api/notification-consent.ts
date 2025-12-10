import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import NotificationConsent from "../../models/NotificationConsent";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

/**
 * POST /api/notification-consent
 * Body: { orderNumber, ordertype?, phone?, channel: "whatsapp" | "push", consent: boolean }
 */
const notificationConsentHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { orderNumber, ordertype, phone, channel, consent } = req.body || {};

    if (!orderNumber || !channel || typeof consent !== "boolean") {
      return res
        .status(400)
        .json({ message: "Missing required fields: orderNumber, channel, consent" });
    }

    if (!["whatsapp", "push"].includes(channel)) {
      return res.status(400).json({ message: "Invalid channel" });
    }

    try {
      await connectToDatabase();

      const doc = new NotificationConsent({
        orderNumber,
        ordertype: ordertype || null,
        phone: phone || null,
        channel,
        consent,
      });

      await doc.save();
      return res.status(200).json({ message: "Consent recorded" });
    } catch (error) {
      console.error("Error saving notification consent:", error);
      return res.status(500).json({ message: "Failed to save notification consent" });
    }
  } else if (req.method === "GET") {
    const { orderNumber } = req.query;
    if (!orderNumber) {
      return res.status(400).json({ message: "Missing orderNumber parameter" });
    }
    try {
      await connectToDatabase();
      const consents = await NotificationConsent.find({ orderNumber }).lean();
      return res.status(200).json({ consents });
    } catch (error) {
      console.error("Error fetching notification consent:", error);
      return res.status(500).json({ message: "Failed to fetch notification consent" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
};

export default notificationConsentHandler;

