import mongoose from 'mongoose';
import Order from '../src/models/Order';
import OrderLedger from '../src/models/OrderLedger';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

async function backfillOrderLedger() {
  console.log('🔄 Connecting to MongoDB for OrderLedger backfill...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const totalOrders = await Order.countDocuments();
  console.log(`📦 Found ${totalOrders} active/historical orders in Order collection.`);

  if (totalOrders === 0) {
    console.log('ℹ️ No orders to migrate.');
    await mongoose.disconnect();
    return;
  }

  const orders = await Order.find({}).sort({ createdAt: 1 }).lean();
  let syncedCount = 0;
  let errorCount = 0;

  for (const order of orders) {
    try {
      await OrderLedger.findOneAndUpdate(
        { orderNumber: order.orderNumber },
        {
          id: order.id || (order as any)._id?.toString() || order.orderNumber,
          orderNumber: order.orderNumber,
          customerName: order.customerName || 'Customer',
          email: order.email || '',
          phone: order.phone || null,
          ordertype: order.ordertype || 'delivery',
          deliveryCharge: order.deliveryCharge || 0,
          tableNumber: order.tableNumber || null,
          area: order.area || null,
          paymentMethod: order.paymentMethod || 'cash',
          items: (order.items || []).map((it: any) => ({
            id: String(it.id || it._id || 'item'),
            title: it.title || 'Item',
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            image: it.image || '',
            variations: Array.isArray(it.variations) ? it.variations : [],
          })),
          orderSource: (order as any).orderSource || {
            source: 'direct',
            label: 'Direct / Organic',
            capturedAt: order.createdAt || new Date(),
          },
          totalAmount: Number(order.totalAmount) || 0,
          status: order.status || 'Received',
          createdAt: order.createdAt || new Date(),
          archivedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      syncedCount++;
    } catch (err) {
      console.error(`❌ Error syncing order ${order.orderNumber}:`, err);
      errorCount++;
    }
  }

  const ledgerTotal = await OrderLedger.countDocuments();
  console.log('🎉 Backfill Migration Completed!');
  console.log(`📊 Successfully synced: ${syncedCount} orders`);
  console.log(`⚠️ Errors: ${errorCount}`);
  console.log(`📚 Total documents in OrderLedger collection: ${ledgerTotal}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

backfillOrderLedger().catch((err) => {
  console.error('Fatal backfill error:', err);
  process.exit(1);
});
