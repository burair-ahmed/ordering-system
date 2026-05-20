import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryArea extends Document {
  name: string;
  charge: number;
  isAvailable: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryAreaSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    charge: { type: Number, required: true, default: 0 },
    isAvailable: { type: Boolean, required: true, default: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.DeliveryArea || mongoose.model<IDeliveryArea>('DeliveryArea', DeliveryAreaSchema);
