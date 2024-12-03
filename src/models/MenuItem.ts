// models/MenuItem.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IMenuItem extends Document {
  title: string;
  price: number;
  description: string;
  image: string;
  variations: { name: string; price: number }[];
  category: { type: String, required: true },
  createdAt: Date;
}

const MenuItemSchema: Schema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // Should be a string for Base64 image
  variations: [
    {
      name: { type: String },
      price: { type: Number },
    },
  ],
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Access MenuItems instead of MenuItem
export default mongoose.models.MenuItems || mongoose.model<IMenuItem>('MenuItems', MenuItemSchema);
