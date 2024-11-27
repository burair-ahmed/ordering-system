// models/MenuItem.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IMenuItem extends Document {
  title: string;
  price: number;
  description: string;
  image: string;
  variations: { name: string; price: number }[];
  createdAt: Date;
}

const MenuItemSchema: Schema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, default: '' },
  variations: [
    {
      name: { type: String },
      price: { type: Number },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItems', MenuItemSchema);
