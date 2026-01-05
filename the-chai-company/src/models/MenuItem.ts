import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

interface IMenuItem extends Document {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  variations: { name: string; price: number; id: string }[]; // Ensure 'id' is part of the variation type
  category: string; // Use 'string' instead of 'String'
  createdAt: Date;
  status: 'in stock' | 'out of stock'; // New status field
}

const MenuItemSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, default: uuidv4 }, // Add UUID as 'id'
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  variations: [
    {
      name: { type: String },
      price: { type: Number },
      id: { type: String },  // Use 'string' for the id
    },
  ],
  category: { type: String, required: true }, // Change 'String' to 'string'
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['in stock', 'out of stock'], required: true, default: 'in stock' }, // New status field
  isBestSeller: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
});

export default mongoose.models.MenuItems || mongoose.model<IMenuItem>('MenuItems', MenuItemSchema);
