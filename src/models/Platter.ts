import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

interface IPlatter extends Document {
  id: string;
  title: string;
  basePrice: number;
  description: string;
  image: string;
  categories: { categoryName: string; options: { name: string }[] }[]; // Categories with options, no price for options
  platterCategory: string; // New field for platter category
  createdAt: Date;
  status: 'in stock' | 'out of stock'; // Stock status
}

const PlatterSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, default: uuidv4 }, // UUID for platter ID
  title: { type: String, required: true },
  basePrice: { type: Number, required: true }, // Fixed base price for platter
  description: { type: String, required: true },
  image: { type: String, required: true },
  categories: [
    {
      categoryName: { type: String, required: true }, // Name of the category (e.g., "Soup", "Meat Cut")
      options: [
        {
          name: { type: String, required: true }, // Options for the category (e.g., "Chicken Tikka", "Beef Gravy")
        },
      ],
    },
  ],
  platterCategory: { type: String, required: true }, // The platter's category (e.g., "Sharing", "Chinese")
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['in stock', 'out of stock'], required: true, default: 'in stock' }, // In-stock status
});

export default mongoose.models.Platters || mongoose.model<IPlatter>('Platters', PlatterSchema);
