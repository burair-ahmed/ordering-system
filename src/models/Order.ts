import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // For generating a unique UUID for id

// Define the order schema
const orderSchema = new mongoose.Schema({
  id: { type: String, default: () => uuidv4(), unique: true },
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  email: { type: String },

  ordertype: { 
    type: String, 
    enum: ['dinein', 'pickup', 'delivery'], 
    required: true 
  },

  tableNumber: { type: String, default: null }, // for dine-in
  area: { type: String, default: null },        // for delivery
  phone: { type: String, default: null },       // for delivery


  paymentMethod: { type: String, required: true },
  items: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    variations: { type: [String], default: [] },
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});


// Create and export the order model
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
