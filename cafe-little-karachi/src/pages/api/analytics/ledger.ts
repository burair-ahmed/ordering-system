import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import OrderLedger from '../../../models/OrderLedger';
import Order from '../../../models/Order';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(MONGODB_URI);
  }
}

export default async function ledgerHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    page = '1',
    limit = '20',
    search = '',
    status = 'all',
    ordertype = 'all',
    startDate,
    endDate,
  } = req.query as Record<string, string>;

  try {
    await connectToDatabase();

    const ledgerCount = await OrderLedger.countDocuments();
    const TargetModel = ledgerCount > 0 ? OrderLedger : Order;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};

    // 1. Status filter
    if (status && status !== 'all') {
      if (status === 'cancelled') {
        query.status = { $regex: /^(cancelled|canceled|rejected|voided)$/i };
      } else if (status === 'delivered') {
        query.status = { $regex: /^(delivered|completed)$/i };
      } else if (status === 'received') {
        query.status = { $regex: /^(received|pending|in progress)$/i };
      } else {
        query.status = new RegExp(`^${status}$`, 'i');
      }
    }

    // 2. Order Type filter
    if (ordertype && ordertype !== 'all') {
      query.ordertype = ordertype.toLowerCase();
    }

    // 3. Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        query.createdAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.createdAt.$lte = e;
      }
    }

    // 4. Keyword search across multiple fields
    if (search && search.trim().length > 0) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { phone: regex },
        { area: regex },
        { tableNumber: regex },
        { 'items.title': regex },
      ];
    }

    const [totalOrders, orders] = await Promise.all([
      TargetModel.countDocuments(query),
      TargetModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalOrders / limitNum);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalOrders,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching historical ledger:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch historical ledger orders',
      error: error.message,
    });
  }
}
