import mongoose from 'mongoose';

// Item schema inside immutable ledger
const orderLedgerItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, default: '' },
    variations: { type: [String], default: [] },
  },
  { _id: false }
);

// Order Source schema inside immutable ledger
const orderLedgerSourceSchema = new mongoose.Schema(
  {
    source: { type: String, default: 'direct' },
    medium: { type: String, default: null },
    campaign: { type: String, default: null },
    content: { type: String, default: null },
    term: { type: String, default: null },
    referrer: { type: String, default: null },
    landingPage: { type: String, default: null },
    label: { type: String, default: 'Direct / Organic' },
    capturedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Immutable Order Ledger Schema
// Preserves 100% of historical order data, items, and timestamps even if live orders are purged or deleted.
const orderLedgerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  orderNumber: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: null, index: true },

  ordertype: {
    type: String,
    enum: ['dinein', 'pickup', 'delivery'],
    required: true,
    index: true,
  },
  deliveryCharge: { type: Number, default: 0 },
  tableNumber: { type: String, default: null },
  area: { type: String, default: null, index: true },

  paymentMethod: { type: String, default: 'cash' },
  paymentProvider: { type: String, default: null },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'failed', 'cod'], 
    default: 'cod',
    index: true 
  },
  items: { type: [orderLedgerItemSchema], required: true },
  orderSource: { type: orderLedgerSourceSchema, default: () => ({}) },
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true, index: true },
  createdAt: { type: Date, required: true, index: true },
  archivedAt: { type: Date, default: Date.now, index: true },
});

// Compound indexes for high-speed analytics queries
orderLedgerSchema.index({ createdAt: -1, status: 1 });
orderLedgerSchema.index({ createdAt: -1, ordertype: 1 });
orderLedgerSchema.index({ createdAt: -1, area: 1 });
orderLedgerSchema.index({ 'items.id': 1, createdAt: -1 });
orderLedgerSchema.index({ 'items.title': 1, createdAt: -1 });

const OrderLedger =
  mongoose.models.OrderLedger || mongoose.model('OrderLedger', orderLedgerSchema);

export default OrderLedger;
