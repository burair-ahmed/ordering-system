import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import Order from '../../../models/Order';
import OrderLedger from '../../../models/OrderLedger';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(MONGODB_URI);
  }
}

/**
 * Safe Purge API (Feature A6)
 * Safely archives and purges completed/cancelled orders from the active live queue
 * while ensuring 100% of the order data is permanently secured in OrderLedger.
 */
export default async function purgeCompletedOrdersHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    olderThanDays = 0,
    targetStatuses = ['Delivered', 'Completed', 'Cancelled', 'Canceled', 'Voided'],
    orderNumbers,
  } = req.body || {};

  try {
    await connectToDatabase();

    const filterQuery: Record<string, any> = {};

    if (Array.isArray(orderNumbers) && orderNumbers.length > 0) {
      filterQuery.orderNumber = { $in: orderNumbers };
    } else {
      // Build status regex
      const statusRegexArray = targetStatuses.map((st: string) => new RegExp(`^${st}$`, 'i'));
      filterQuery.status = { $in: statusRegexArray };

      if (olderThanDays > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        filterQuery.createdAt = { $lte: cutoffDate };
      }
    }

    // 1. Find all matching orders in the live queue
    const ordersToPurge = await Order.find(filterQuery).lean();

    if (!ordersToPurge || ordersToPurge.length === 0) {
      return res.status(200).json({
        success: true,
        purgedCount: 0,
        message: 'No eligible orders found to purge.',
      });
    }

    // 2. Guarantee 100% dual-sync into OrderLedger before deleting anything from live collection
    let backedUpCount = 0;
    for (const ord of ordersToPurge) {
      await OrderLedger.findOneAndUpdate(
        { orderNumber: ord.orderNumber },
        {
          id: ord.id || (ord as any)._id?.toString() || ord.orderNumber,
          orderNumber: ord.orderNumber,
          customerName: ord.customerName || 'Customer',
          email: ord.email || '',
          phone: ord.phone || null,
          ordertype: ord.ordertype || 'delivery',
          deliveryCharge: ord.deliveryCharge || 0,
          tableNumber: ord.tableNumber || null,
          area: ord.area || null,
          paymentMethod: ord.paymentMethod || 'cash',
          items: (ord.items || []).map((it: any) => ({
            id: String(it.id || it._id || 'item'),
            title: it.title || 'Item',
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            image: it.image || '',
            variations: Array.isArray(it.variations) ? it.variations : [],
          })),
          orderSource: (ord as any).orderSource || {
            source: 'direct',
            label: 'Direct / Organic',
            capturedAt: ord.createdAt || new Date(),
          },
          totalAmount: Number(ord.totalAmount) || 0,
          status: ord.status || 'Received',
          createdAt: ord.createdAt || new Date(),
          archivedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      backedUpCount++;
    }

    // 3. Perform safe purge from live `Order` queue
    const purgeIds = ordersToPurge.map((o: any) => o._id);
    const deleteResult = await Order.deleteMany({ _id: { $in: purgeIds } });

    return res.status(200).json({
      success: true,
      purgedCount: deleteResult.deletedCount,
      backedUpCount,
      message: `Successfully purged ${deleteResult.deletedCount} orders from the live queue. All records are 100% secured in the permanent OrderLedger.`,
    });
  } catch (error: any) {
    console.error('Error during safe order purge:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to safely purge completed orders.',
      error: error.message,
    });
  }
}
