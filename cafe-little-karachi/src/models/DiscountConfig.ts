import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDiscountConfig extends Document {
  isActive: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountConfigSchema: Schema<IDiscountConfig> = new Schema(
  {
    isActive: { type: Boolean, default: false },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, default: 0, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    label: { type: String, default: 'Checkout Discount' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.DiscountConfig) {
  delete mongoose.models.DiscountConfig;
}

const DiscountConfig: Model<IDiscountConfig> =
  mongoose.model<IDiscountConfig>("DiscountConfig", DiscountConfigSchema);

export default DiscountConfig;
