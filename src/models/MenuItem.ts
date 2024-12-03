import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

interface IMenuItem extends Document {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  variations: { name: string; price: number }[];
  category: { type: String, required: true },
  createdAt: Date;
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
      id: { type: String }, 
    },
  ],
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MenuItems || mongoose.model<IMenuItem>('MenuItems', MenuItemSchema);
