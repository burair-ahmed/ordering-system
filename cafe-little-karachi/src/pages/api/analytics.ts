import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import OrderLedger from '../../models/OrderLedger';
import Order from '../../models/Order';
import MenuItem from '../../models/MenuItem';
import Platter from '../../models/Platter';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(MONGODB_URI);
  }
}

// Format 24-hour integer to 12-hour AM/PM string
function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

// Days of week mapping (MongoDB $dayOfWeek: 1=Sun, 2=Mon, ... 7=Sat)
const DAYS_OF_WEEK = [
  { dayNumber: 2, dayName: 'Monday', shortDay: 'Mon' },
  { dayNumber: 3, dayName: 'Tuesday', shortDay: 'Tue' },
  { dayNumber: 4, dayName: 'Wednesday', shortDay: 'Wed' },
  { dayNumber: 5, dayName: 'Thursday', shortDay: 'Thu' },
  { dayNumber: 6, dayName: 'Friday', shortDay: 'Fri' },
  { dayNumber: 7, dayName: 'Saturday', shortDay: 'Sat' },
  { dayNumber: 1, dayName: 'Sunday', shortDay: 'Sun' },
];

// Helper to compute date ranges and their preceding equivalent period for comparison
function computeDateRanges(
  filter: string,
  customStart?: string,
  customEnd?: string
) {
  const now = new Date();
  let start: Date;
  let end: Date;
  let label = 'Today';

  if (filter === 'custom' && customStart && customEnd) {
    start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    label = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    switch (filter) {
      case 'yesterday': {
        start = new Date(now);
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        label = 'Yesterday';
        break;
      }
      case 'week':
      case '7d': {
        start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        label = 'Last 7 Days';
        break;
      }
      case 'last-week': {
        start = new Date(now);
        start.setDate(now.getDate() - 13);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setDate(now.getDate() - 7);
        end.setHours(23, 59, 59, 999);
        label = 'Previous Week';
        break;
      }
      case 'month':
      case '30d': {
        start = new Date(now);
        start.setDate(now.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        label = 'Last 30 Days';
        break;
      }
      case 'last-month': {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        label = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        break;
      }
      case 'year': {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        label = `Year ${now.getFullYear()}`;
        break;
      }
      case 'all': {
        start = new Date('2020-01-01T00:00:00.000Z');
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        label = 'All Time';
        break;
      }
      case 'today':
      default: {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        label = 'Today';
        break;
      }
    }
  }

  // Calculate prior equivalent timeframe duration for comparison
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, label, prevStart, prevEnd };
}

// Compute percentage delta safely
function computeGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export default async function analyticsHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    filter = 'today',
    startDate,
    endDate,
  } = req.query as Record<string, string>;

  try {
    await connectToDatabase();

    // Determine target collection (primary: OrderLedger, fallback: Order)
    const ledgerCount = await OrderLedger.countDocuments();
    const TargetModel = ledgerCount > 0 ? OrderLedger : Order;

    const { start, end, label, prevStart, prevEnd } = computeDateRanges(
      filter,
      startDate,
      endDate
    );

    // Common non-cancelled filter for valid financial calculations
    const isCancelledRegex = /^(cancelled|canceled|rejected|voided)$/i;

    // 1. Current Period Orders Query
    const currentOrders = await TargetModel.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    // 2. Previous Period Orders Query (for Feature A3 Growth Badges)
    const prevOrders = await TargetModel.find({
      createdAt: { $gte: prevStart, $lte: prevEnd },
    }).lean();

    // 3. Compute Executive Summary KPIs
    let totalRevenue = 0;
    let totalItemsSold = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let activeOrders = 0;

    for (const ord of currentOrders) {
      const isCancelled = isCancelledRegex.test(ord.status || '');
      if (isCancelled) {
        cancelledOrders++;
      } else {
        totalRevenue += Number(ord.totalAmount) || 0;
        if (/^(delivered|completed)$/i.test(ord.status || '')) {
          deliveredOrders++;
        } else {
          activeOrders++;
        }
        for (const it of ord.items || []) {
          totalItemsSold += Number(it.quantity) || 1;
        }
      }
    }

    const totalOrdersCount = currentOrders.length;
    const validOrdersCount = totalOrdersCount - cancelledOrders;
    const aov = validOrdersCount > 0 ? Math.round(totalRevenue / validOrdersCount) : 0;
    const aoq = validOrdersCount > 0 ? Number((totalItemsSold / validOrdersCount).toFixed(1)) : 0;

    // Previous Period KPIs
    let prevRevenue = 0;
    let prevItemsSold = 0;
    let prevCancelled = 0;
    for (const ord of prevOrders) {
      const isCancelled = isCancelledRegex.test(ord.status || '');
      if (isCancelled) {
        prevCancelled++;
      } else {
        prevRevenue += Number(ord.totalAmount) || 0;
        for (const it of ord.items || []) {
          prevItemsSold += Number(it.quantity) || 1;
        }
      }
    }
    const prevValidCount = prevOrders.length - prevCancelled;
    const prevAov = prevValidCount > 0 ? Math.round(prevRevenue / prevValidCount) : 0;
    const prevAoq = prevValidCount > 0 ? Number((prevItemsSold / prevValidCount).toFixed(1)) : 0;

    const revenueGrowth = computeGrowth(totalRevenue, prevRevenue);
    const ordersGrowth = computeGrowth(totalOrdersCount, prevOrders.length);
    const aovGrowth = computeGrowth(aov, prevAov);
    const aoqGrowth = computeGrowth(aoq, prevAoq);

    // 4. Product Performance & Leaderboard (Requirement #1 & #2)
    const productMap = new Map<
      string,
      {
        id: string;
        title: string;
        image: string;
        timesOrdered: number;
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    for (const ord of currentOrders) {
      if (isCancelledRegex.test(ord.status || '')) continue;
      const orderItems = ord.items || [];
      const seenInThisOrder = new Set<string>();

      for (const item of orderItems) {
        const itemKey = item.title || item.id;
        const currentData = productMap.get(itemKey) || {
          id: item.id || itemKey,
          title: item.title,
          image: item.image || '',
          timesOrdered: 0,
          totalQuantity: 0,
          totalRevenue: 0,
        };

        if (!seenInThisOrder.has(itemKey)) {
          currentData.timesOrdered += 1;
          seenInThisOrder.add(itemKey);
        }

        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        currentData.totalQuantity += qty;
        currentData.totalRevenue += price * qty;
        if (item.image && !currentData.image) currentData.image = item.image;

        productMap.set(itemKey, currentData);
      }
    }

    const productLeaderboard = Array.from(productMap.values())
      .map((p) => ({
        ...p,
        avgQuantityPerOrder: Number((p.totalQuantity / p.timesOrdered).toFixed(1)),
        revenueShare:
          totalRevenue > 0 ? Number(((p.totalRevenue / totalRevenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // 5. Low-Velocity / Stagnant Menu Items (Feature A5)
    let stagnantProducts: Array<{
      id: string;
      title: string;
      category: string;
      price: number;
      image: string;
      timesOrdered: number;
    }> = [];

    try {
      const [allDishes, allPlatters] = await Promise.all([
        MenuItem.find({ isVisible: { $ne: false } }).select('id title category price image').lean(),
        Platter.find({ isVisible: { $ne: false } }).select('id title category price image').lean(),
      ]);

      const allCatalogItems = [
        ...allDishes.map((d: any) => ({
          id: d.id,
          title: d.title,
          category: d.category || 'Dishes',
          price: d.price || 0,
          image: d.image || '',
        })),
        ...allPlatters.map((p: any) => ({
          id: p.id,
          title: p.title,
          category: p.category || 'Platters',
          price: p.price || 0,
          image: p.image || '',
        })),
      ];

      stagnantProducts = allCatalogItems
        .map((catalogItem) => {
          const soldData = productMap.get(catalogItem.title) || productMap.get(catalogItem.id);
          return {
            ...catalogItem,
            timesOrdered: soldData ? soldData.timesOrdered : 0,
          };
        })
        .filter((item) => item.timesOrdered === 0)
        .slice(0, 10);
    } catch (catErr) {
      console.warn('Failed to fetch catalog items for stagnant product detection:', catErr);
    }

    // 6. Delivery Area Intelligence (Requirement #3)
    const areaMap = new Map<
      string,
      { area: string; orderCount: number; totalRevenue: number; totalDeliveryCharges: number }
    >();

    for (const ord of currentOrders) {
      if (ord.ordertype !== 'delivery') continue;
      const isCancelled = isCancelledRegex.test(ord.status || '');
      const areaName = ord.area || 'Unknown Area';

      const existing = areaMap.get(areaName) || {
        area: areaName,
        orderCount: 0,
        totalRevenue: 0,
        totalDeliveryCharges: 0,
      };

      existing.orderCount += 1;
      if (!isCancelled) {
        existing.totalRevenue += Number(ord.totalAmount) || 0;
        existing.totalDeliveryCharges += Number(ord.deliveryCharge) || 0;
      }
      areaMap.set(areaName, existing);
    }

    const areaAnalytics = Array.from(areaMap.values())
      .map((a) => ({
        ...a,
        revenueShare:
          totalRevenue > 0 ? Number(((a.totalRevenue / totalRevenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount);

    // 7. Order Channels & Attribution (Requirement #4)
    const fulfillmentMap = {
      dinein: { type: 'dinein' as const, label: 'Dine-In', orderCount: 0, totalRevenue: 0 },
      delivery: { type: 'delivery' as const, label: 'Delivery', orderCount: 0, totalRevenue: 0 },
      pickup: { type: 'pickup' as const, label: 'Pickup / Takeaway', orderCount: 0, totalRevenue: 0 },
    };

    const marketingSourceMap = new Map<
      string,
      { source: string; label: string; orderCount: number; totalRevenue: number }
    >();

    for (const ord of currentOrders) {
      const isCancelled = isCancelledRegex.test(ord.status || '');
      const ordType = (ord.ordertype || 'delivery') as 'dinein' | 'delivery' | 'pickup';
      if (fulfillmentMap[ordType]) {
        fulfillmentMap[ordType].orderCount++;
        if (!isCancelled) fulfillmentMap[ordType].totalRevenue += Number(ord.totalAmount) || 0;
      }

      const rawSource = ord.orderSource?.source || 'direct';
      const label = ord.orderSource?.label || 'Direct / Organic';
      const sourceEntry = marketingSourceMap.get(rawSource) || {
        source: rawSource,
        label,
        orderCount: 0,
        totalRevenue: 0,
      };
      sourceEntry.orderCount++;
      if (!isCancelled) sourceEntry.totalRevenue += Number(ord.totalAmount) || 0;
      marketingSourceMap.set(rawSource, sourceEntry);
    }

    const fulfillmentChannels = Object.values(fulfillmentMap).map((f) => ({
      ...f,
      share: totalOrdersCount > 0 ? Number(((f.orderCount / totalOrdersCount) * 100).toFixed(1)) : 0,
    }));

    const marketingSources = Array.from(marketingSourceMap.values())
      .map((m) => ({
        ...m,
        aov: m.orderCount > 0 ? Math.round(m.totalRevenue / m.orderCount) : 0,
        share: totalOrdersCount > 0 ? Number(((m.orderCount / totalOrdersCount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount);

    // 8. Peak Rush Hours Heatmap (Feature A1)
    const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      hourLabel: formatHour(h),
      orderCount: 0,
      totalRevenue: 0,
    }));

    for (const ord of currentOrders) {
      const d = new Date(ord.createdAt);
      const h = d.getHours();
      if (h >= 0 && h < 24) {
        hourBuckets[h].orderCount += 1;
        if (!isCancelledRegex.test(ord.status || '')) {
          hourBuckets[h].totalRevenue += Number(ord.totalAmount) || 0;
        }
      }
    }

    // 9. Day-of-the-Week Trends (Requirement #5)
    const dayMap = new Map<number, { orderCount: number; totalRevenue: number }>();
    for (let d = 1; d <= 7; d++) {
      dayMap.set(d, { orderCount: 0, totalRevenue: 0 });
    }

    for (const ord of currentOrders) {
      const d = new Date(ord.createdAt);
      const dayNum = d.getDay() + 1; // MongoDB $dayOfWeek equivalent (1=Sun, 2=Mon... 7=Sat)
      const entry = dayMap.get(dayNum);
      if (entry) {
        entry.orderCount += 1;
        if (!isCancelledRegex.test(ord.status || '')) {
          entry.totalRevenue += Number(ord.totalAmount) || 0;
        }
      }
    }

    const dayOfWeekTrends = DAYS_OF_WEEK.map((item) => {
      const stats = dayMap.get(item.dayNumber) || { orderCount: 0, totalRevenue: 0 };
      return {
        ...item,
        orderCount: stats.orderCount,
        totalRevenue: stats.totalRevenue,
      };
    });

    // 10. Basket Affinity / "Frequently Bought Together" (Feature A2)
    const pairCountMap = new Map<string, { itemA: string; itemB: string; pairCount: number }>();

    for (const ord of currentOrders) {
      if (isCancelledRegex.test(ord.status || '')) continue;
      const items = ord.items || [];
      if (items.length < 2) continue;

      const titles: string[] = Array.from(
        new Set<string>(items.map((i: any) => String(i.title || '')))
      ).filter(Boolean).sort();

      for (let i = 0; i < titles.length; i++) {
        for (let j = i + 1; j < titles.length; j++) {
          const itemA = titles[i];
          const itemB = titles[j];
          const pairKey = `${itemA}__&__${itemB}`;
          const current = pairCountMap.get(pairKey) || { itemA, itemB, pairCount: 0 };
          current.pairCount += 1;
          pairCountMap.set(pairKey, current);
        }
      }
    }

    const basketAffinity = Array.from(pairCountMap.values())
      .sort((a, b) => b.pairCount - a.pairCount)
      .slice(0, 6)
      .map((p) => ({
        ...p,
        pairLabel: `${p.itemA} + ${p.itemB}`,
      }));

    // 11. Customer Retention & Repeat Rate (Feature A4)
    const customerMap = new Map<
      string,
      { phone: string; name: string; orderCount: number; totalSpent: number }
    >();

    for (const ord of currentOrders) {
      if (isCancelledRegex.test(ord.status || '')) continue;
      const phone = ord.phone ? String(ord.phone).trim() : null;
      if (!phone) continue;

      const existing = customerMap.get(phone) || {
        phone,
        name: ord.customerName || 'Customer',
        orderCount: 0,
        totalSpent: 0,
      };
      existing.orderCount += 1;
      existing.totalSpent += Number(ord.totalAmount) || 0;
      if (ord.customerName) existing.name = ord.customerName;
      customerMap.set(phone, existing);
    }

    const allCustomers = Array.from(customerMap.values());
    const totalIdentifiedCustomers = allCustomers.length;
    const newCustomers = allCustomers.filter((c) => c.orderCount === 1).length;
    const repeatCustomers = allCustomers.filter((c) => c.orderCount > 1).length;
    const repeatRate =
      totalIdentifiedCustomers > 0
        ? Number(((repeatCustomers / totalIdentifiedCustomers) * 100).toFixed(1))
        : 0;

    const topLoyalCustomers = allCustomers
      .sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((c) => ({
        phoneMasked:
          c.phone.length > 7
            ? `${c.phone.slice(0, 4)}••••${c.phone.slice(-3)}`
            : c.phone,
        name: c.name,
        orderCount: c.orderCount,
        totalSpent: c.totalSpent,
      }));

    // 12. Timeline Time-Series Chart Data (Requirement #5)
    // Bucketing based on date range duration
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const timelineData: Array<{
      label: string;
      date: string;
      revenue: number;
      orders: number;
      delivered: number;
      cancelled: number;
    }> = [];

    if (durationDays <= 1.5) {
      // Hourly timeline for Today or Yesterday
      const hourTimelineMap = new Map<number, { revenue: number; orders: number; delivered: number; cancelled: number }>();
      for (let h = 0; h < 24; h++) {
        hourTimelineMap.set(h, { revenue: 0, orders: 0, delivered: 0, cancelled: 0 });
      }

      for (const ord of currentOrders) {
        const d = new Date(ord.createdAt);
        const h = d.getHours();
        const entry = hourTimelineMap.get(h);
        if (entry) {
          entry.orders += 1;
          const isCancelled = isCancelledRegex.test(ord.status || '');
          if (isCancelled) {
            entry.cancelled += 1;
          } else {
            entry.revenue += Number(ord.totalAmount) || 0;
            if (/^(delivered|completed)$/i.test(ord.status || '')) {
              entry.delivered += 1;
            }
          }
        }
      }

      for (let h = 0; h < 24; h++) {
        const data = hourTimelineMap.get(h)!;
        timelineData.push({
          label: formatHour(h),
          date: `${h.toString().padStart(2, '0')}:00`,
          ...data,
        });
      }
    } else {
      // Daily timeline
      const dayTimelineMap = new Map<string, { revenue: number; orders: number; delivered: number; cancelled: number }>();
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = cursor.toISOString().split('T')[0];
        dayTimelineMap.set(key, { revenue: 0, orders: 0, delivered: 0, cancelled: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      for (const ord of currentOrders) {
        const key = new Date(ord.createdAt).toISOString().split('T')[0];
        const entry = dayTimelineMap.get(key);
        if (entry) {
          entry.orders += 1;
          const isCancelled = isCancelledRegex.test(ord.status || '');
          if (isCancelled) {
            entry.cancelled += 1;
          } else {
            entry.revenue += Number(ord.totalAmount) || 0;
            if (/^(delivered|completed)$/i.test(ord.status || '')) {
              entry.delivered += 1;
            }
          }
        }
      }

      dayTimelineMap.forEach((val, dateKey) => {
        const d = new Date(dateKey);
        timelineData.push({
          label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          date: dateKey,
          ...val,
        });
      });
    }

    return res.status(200).json({
      filter,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        label,
      },
      previousDateRange: {
        start: prevStart.toISOString(),
        end: prevEnd.toISOString(),
      },
      summary: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        deliveredOrders,
        cancelledOrders,
        activeOrders,
        totalItemsSold,
        aov,
        aoq,
        revenueGrowth,
        ordersGrowth,
        aovGrowth,
        aoqGrowth,
        prevRevenue,
        prevOrders: prevOrders.length,
      },
      timeline: timelineData,
      productLeaderboard,
      stagnantProducts,
      areaAnalytics,
      channels: {
        fulfillment: fulfillmentChannels,
        marketingSources,
      },
      peakHours: hourBuckets,
      dayOfWeekTrends,
      basketAffinity,
      customerRetention: {
        totalIdentifiedCustomers,
        newCustomers,
        repeatCustomers,
        repeatRate,
        topLoyalCustomers,
      },
    });
  } catch (error: any) {
    console.error('Error generating advanced analytics:', error);
    return res.status(500).json({
      message: 'Failed to generate advanced analytics',
      error: error.message,
    });
  }
}
