import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatterCategory extends Document {
  name: string;
  createdAt: Date;
}

const PlatterCategorySchema = new Schema<IPlatterCategory>({
  name: {
    type: String,
    required: [true, 'Platter category name is required'],
    trim: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PlatterCategory: Model<IPlatterCategory> = mongoose.models.PlatterCategory || mongoose.model<IPlatterCategory>('PlatterCategory', PlatterCategorySchema);

export default PlatterCategory;
