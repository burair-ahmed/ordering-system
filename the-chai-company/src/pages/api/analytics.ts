import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Order from "../../models/Order";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

// Utility function to get the start and end date for different periods
const getDateRange = (filter: string, startDate?: string, endDate?: string) => {
  const today = new Date();
  let start: Date, end: Date;

  if (filter === "custom" && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    switch (filter) {
      case "week": {
        const startOfWeek = today.getDate() - today.getDay(); // Get the first day of the week
        start = new Date(today.setDate(startOfWeek));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6); // Last day of the week
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "month": {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "last-week": {
        const startOfLastWeek = today.getDate() - today.getDay() - 7;
        start = new Date(today.setDate(startOfLastWeek));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "last-month": {
        const lastMonth = today.getMonth() - 1;
        start = new Date(today.getFullYear(), lastMonth, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), lastMonth + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "today":
      default: {
        start = new Date(today.setHours(0, 0, 0, 0));
        end = new Date(today.setHours(23, 59, 59, 999));
        break;
      }
    }
  }

  return { start, end };
};

// Main handler for analytics
const getAnalytics = async (req: NextApiRequest, res: NextApiResponse) => {
  const { filter = "today", startDate, endDate } = req.query; // Default to 'today'

  try {
    await connectToDatabase();

    const { start, end } = getDateRange(filter as string, startDate as string, endDate as string);

    // Aggregate orders for the selected date range
    const analytics = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$tableNumber",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          tableNumber: "$_id",
          orderCount: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
    ]);

    // Aggregate total revenue for the selected date range
    const totalRevenueCombined = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.status(200).json({
      tableAnalytics: analytics,
      totalRevenueCombined: totalRevenueCombined[0]?.totalRevenue || 0,
      filter,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

export default getAnalytics;
