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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectToDatabase();

    const { range = "30d" } = req.query;

    let startDate: Date | null = null;
    const now = new Date();

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const matchStage: Record<string, any> = {};
    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }

    // 1. Fetch Orders in range (excluding cancelled orders from revenue metrics if desired, or include all with breakdown)
    const orders = await Order.find(matchStage)
      .sort({ createdAt: -1 })
      .lean();

    const totalOrders = orders.length;
    let totalRevenue = 0;
    let paidAdsOrders = 0;
    let paidAdsRevenue = 0;
    let directOrganicOrders = 0;

    const sourceMap: Record<
      string,
      { count: number; revenue: number; source: string; label: string }
    > = {};

    const campaignMap: Record<
      string,
      { campaign: string; source: string; label: string; count: number; revenue: number }
    > = {};

    const dailyTimelineMap: Record<
      string,
      { date: string; totalOrders: number; totalRevenue: number; sources: Record<string, number> }
    > = {};

    for (const order of orders) {
      const isCancelled =
        order.status &&
        (order.status.toLowerCase() === "cancelled" ||
          order.status.toLowerCase() === "canceled" ||
          order.status.toLowerCase() === "rejected");

      const amount = isCancelled ? 0 : Number(order.totalAmount) || 0;
      if (!isCancelled) {
        totalRevenue += amount;
      }

      const sourceInfo = (order as any).orderSource || {};
      const label = sourceInfo.label || "Direct / Organic";
      const rawSource = sourceInfo.source || "direct";
      const campaign = sourceInfo.campaign;

      const isPaid =
        label.toLowerCase().includes("ad") ||
        (sourceInfo.medium && sourceInfo.medium.toLowerCase().includes("paid")) ||
        (sourceInfo.medium && sourceInfo.medium.toLowerCase().includes("cpc"));

      if (isPaid) {
        paidAdsOrders += 1;
        if (!isCancelled) paidAdsRevenue += amount;
      } else {
        directOrganicOrders += 1;
      }

      // Group by Source Label
      if (!sourceMap[label]) {
        sourceMap[label] = {
          count: 0,
          revenue: 0,
          source: rawSource,
          label,
        };
      }
      sourceMap[label].count += 1;
      if (!isCancelled) {
        sourceMap[label].revenue += amount;
      }

      // Group by Campaign (if exists)
      if (campaign) {
        const campaignKey = `${campaign}___${label}`;
        if (!campaignMap[campaignKey]) {
          campaignMap[campaignKey] = {
            campaign,
            source: rawSource,
            label,
            count: 0,
            revenue: 0,
          };
        }
        campaignMap[campaignKey].count += 1;
        if (!isCancelled) {
          campaignMap[campaignKey].revenue += amount;
        }
      }

      // Group by Day
      const orderDate = new Date(order.createdAt || Date.now());
      const dateKey = orderDate.toISOString().split("T")[0];

      if (!dailyTimelineMap[dateKey]) {
        dailyTimelineMap[dateKey] = {
          date: dateKey,
          totalOrders: 0,
          totalRevenue: 0,
          sources: {},
        };
      }
      dailyTimelineMap[dateKey].totalOrders += 1;
      if (!isCancelled) {
        dailyTimelineMap[dateKey].totalRevenue += amount;
      }
      dailyTimelineMap[dateKey].sources[label] =
        (dailyTimelineMap[dateKey].sources[label] || 0) + 1;
    }

    const sourceBreakdown = Object.values(sourceMap).sort(
      (a, b) => b.count - a.count
    );

    const campaignBreakdown = Object.values(campaignMap).sort(
      (a, b) => b.count - a.count
    );

    const timelineData = Object.values(dailyTimelineMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const paidShare = totalOrders > 0 ? Math.round((paidAdsOrders / totalOrders) * 100) : 0;
    const topChannel = sourceBreakdown.length > 0 ? sourceBreakdown[0].label : "None";

    // Recent 100 attributed orders list
    const recentOrders = orders.slice(0, 100).map((o: any) => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      ordertype: o.ordertype,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      orderSource: o.orderSource || {
        source: "direct",
        label: "Direct / Organic",
      },
    }));

    return res.status(200).json({
      summary: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        paidAdsOrders,
        paidAdsRevenue,
        directOrganicOrders,
        paidShare,
        topChannel,
      },
      sourceBreakdown,
      campaignBreakdown,
      timelineData,
      recentOrders,
    });
  } catch (error: any) {
    console.error("Error generating order source analytics:", error);
    return res.status(500).json({
      message: "Failed to generate order source analytics",
      error: error.message,
    });
  }
}
