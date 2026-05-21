import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import AnalyticsEvent from "../../../models/AnalyticsEvent";

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { sessionId, distinctId, eventType, path, properties } = req.body;

  if (!sessionId || !distinctId || !eventType || !path) {
    return res.status(400).json({ message: 'Missing required tracking fields' });
  }

  try {
    await connectToDatabase();

    const newEvent = new AnalyticsEvent({
      sessionId,
      distinctId,
      eventType,
      path,
      properties: properties || {},
      timestamp: new Date()
    });

    await newEvent.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving analytics event:", error);
    return res.status(500).json({ message: "Failed to save event logs" });
  }
}
