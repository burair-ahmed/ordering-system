import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

interface IOption {
  name: string; // Option name (e.g., "Chicken", "Beef Gravy")
  price: number; // Price for the option
  uuid: string; // Unique identifier for the option
}

interface IAdditionalChoice {
  heading: string; // Heading for the choice (e.g., "Meat", "Soup")
  options: IOption[]; // List of options under the heading
}

interface IPlatter extends Document {
  id: string;
  title: string;
  basePrice: number;
  description: string;
  image: string;
  categories: { 
    categoryName: string; 
    options: { name: string }[];
    selectionType: 'category' | 'items';
    itemIds?: string[];
  }[]; // Categories with options or specific items
  platterCategory: string; // New field for platter category
  createdAt: Date;
  status: 'in stock' | 'out of stock'; // Stock status
  additionalChoices: IAdditionalChoice[]; // Additional choices like meat, soup, etc.
  discountType?: 'percentage' | 'fixed'; // Discount type
  discountValue?: number; // Discount value
  isVisible: boolean; // Visibility on order page
}

const PlatterSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, default: uuidv4 }, // UUID for platter ID
  title: { type: String, required: true },
  basePrice: { type: Number, required: true }, // Fixed base price for platter
  description: { type: String, required: true },
  image: { type: String, required: true },
  categories: [
    {
      categoryName: { type: String, required: false }, // Name of the category (e.g., "Soup", "Meat Cut")
      selectionType: { type: String, enum: ['category', 'items'], default: 'category' },
      itemIds: [{ type: String }],
      options: [
        {
          name: { type: String, required: false }, // Options for the category (e.g., "Chicken Tikka", "Beef Gravy")
        },
      ],
    },
  ],
  platterCategory: { type: String, required: true }, // The platter's category (e.g., "Sharing", "Chinese")
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['in stock', 'out of stock'], required: true, default: 'in stock' }, // In-stock status
  
  additionalChoices: [
    {
      heading: { type: String, required: true },
      options: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true },
          uuid: { type: String, required: true, default: uuidv4 },
        },
      ],
    },
  ],
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  discountValue: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
});

export default mongoose.models.Platters || mongoose.model<IPlatter>('Platters', PlatterSchema); 
