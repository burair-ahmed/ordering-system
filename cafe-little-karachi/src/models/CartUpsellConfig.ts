import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartUpsellConfig extends Document {
  isEnabled: boolean;
  heading: string;
  mode: 'auto' | 'manual';
  itemIds: string[]; // List of MenuItem / Platter UUIDs or ObjectIds
  createdAt: Date;
  updatedAt: Date;
}

const CartUpsellConfigSchema: Schema<ICartUpsellConfig> = new Schema(
  {
    isEnabled: { type: Boolean, default: true },
    heading: { type: String, default: 'Popular with your order' },
    mode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    itemIds: [{ type: String }],
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.CartUpsellConfig) {
  delete mongoose.models.CartUpsellConfig;
}

const CartUpsellConfig: Model<ICartUpsellConfig> =
  mongoose.model<ICartUpsellConfig>("CartUpsellConfig", CartUpsellConfigSchema);

export default CartUpsellConfig;
