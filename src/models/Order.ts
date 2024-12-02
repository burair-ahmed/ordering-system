import mongoose from 'mongoose';

// Define the order schema
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  tableNumber: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  items: [{ 
    type: Object, 
    required: true,
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create and export the order model
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
