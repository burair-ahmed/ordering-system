import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import AnalyticsEvent from "../../../models/AnalyticsEvent";
import Order from "../../../models/Order";

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { range } = req.query;
    
    const filter: any = {};
    let dateLimit = new Date();
    let isHourly = false;
    let formatString = "%Y-%m-%d";

    if (range === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      filter.timestamp = { $gte: startOfToday };
      dateLimit = startOfToday;
      isHourly = true;
      formatString = "%H:00";
    } else if (range === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filter.timestamp = { $gte: sevenDaysAgo };
      dateLimit = sevenDaysAgo;
    } else if (range === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filter.timestamp = { $gte: thirtyDaysAgo };
      dateLimit = thirtyDaysAgo;
    } else if (range === 'all') {
      // All time - do not filter KPI counts
      // Limit trend chart to last 90 days to avoid clutter
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      dateLimit = ninetyDaysAgo;
    } else {
      // Default to last 7 days (week)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filter.timestamp = { $gte: sevenDaysAgo };
      dateLimit = sevenDaysAgo;
    }

    // 1. Basic counts
    const totalEvents = await AnalyticsEvent.countDocuments(filter);
    const uniqueVisitors = await AnalyticsEvent.distinct('distinctId', filter).then(arr => arr.length);
    const uniqueSessions = await AnalyticsEvent.distinct('sessionId', filter).then(arr => arr.length);

    // 2. Conversion Funnel (Unique Sessions per step)
    // Step 1: Views
    const sessionsWithViews = await AnalyticsEvent.distinct('sessionId', { 
      ...filter,
      eventType: 'journey_view_item_details' 
    }).then(arr => arr.length);

    // Step 2: Add to Cart
    const sessionsWithAdd = await AnalyticsEvent.distinct('sessionId', { 
      ...filter,
      eventType: 'journey_add_item' 
    }).then(arr => arr.length);

    // Step 3: Checkout Start
    const sessionsWithCheckout = await AnalyticsEvent.distinct('sessionId', { 
      ...filter,
      eventType: 'journey_start_checkout' 
    }).then(arr => arr.length);

    // Step 4: Order Completed
    const sessionsWithOrder = await AnalyticsEvent.distinct('sessionId', { 
      ...filter,
      eventType: 'journey_order_success' 
    }).then(arr => arr.length);

    // 3. Cart Abandonment Rate
    const abandonmentRate = sessionsWithAdd > 0 
      ? Math.max(0, Math.min(100, Math.round(((sessionsWithAdd - sessionsWithOrder) / sessionsWithAdd) * 100)))
      : 0;

    // 4. Daily Activity Trends
    const dailyActivity = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: dateLimit }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: formatString, date: "$timestamp" }
          },
          count: { $sum: 1 },
          visitors: { $addToSet: "$distinctId" }
        }
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          visitors: { $size: "$visitors" },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    // 5. Popular Items (Aggregated by Views and Adds)
    const popularItemsAggregation = await AnalyticsEvent.aggregate([
      {
        $match: {
          ...filter,
          eventType: { $in: ['journey_view_item_details', 'journey_add_item'] }
        }
      },
      {
        $group: {
          _id: "$properties.item_name",
          views: {
            $sum: { $cond: [{ $eq: ["$eventType", "journey_view_item_details"] }, 1, 0] }
          },
          adds: {
            $sum: { $cond: [{ $eq: ["$eventType", "journey_add_item"] }, 1, 0] }
          }
        }
      },
      {
        $match: {
          _id: { $ne: null }
        }
      },
      {
        $project: {
          name: "$_id",
          views: 1,
          adds: 1,
          _id: 0
        }
      },
      { $sort: { adds: -1, views: -1 } },
      { $limit: 7 }
    ]);

    // Format daily data if empty
    const defaultLabel = isHourly ? "12:00" : new Date().toISOString().split('T')[0];
    const formattedDaily = dailyActivity.length > 0 ? dailyActivity : [
      { date: defaultLabel, count: totalEvents, visitors: uniqueVisitors }
    ];

    return res.status(200).json({
      metrics: {
        totalEvents,
        uniqueVisitors,
        uniqueSessions,
        abandonmentRate,
        conversionRate: sessionsWithViews > 0 ? Math.round((sessionsWithOrder / sessionsWithViews) * 100) : 0
      },
      funnel: [
        { name: "View Item", value: sessionsWithViews },
        { name: "Add to Cart", value: sessionsWithAdd },
        { name: "Initiate Checkout", value: sessionsWithCheckout },
        { name: "Complete Order", value: sessionsWithOrder }
      ],
      popularItems: popularItemsAggregation,
      dailyActivity: formattedDaily
    });

  } catch (error) {
    console.error("Error creating analytics aggregated metrics:", error);
    return res.status(500).json({ message: "Failed to load analytics dashboard data" });
  }
}
