
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPageSection {
  id: string;
  type: 'best-seller' | 'featured' | 'slider' | 'grid';
  title: string;
  isVisible: boolean;
  props: any; // Allow any structure for CMS flexibility
}

export interface IPageConfig extends Document {
  type: string;
  sections: IPageSection[];
}

const PageSectionSchema = new Schema({
  id: { type: String, required: true },
  type: { 
      type: String, 
      required: true, 
      enum: ['best-seller', 'featured', 'slider', 'grid'] 
  },
  title: { type: String, default: "" },
  isVisible: { type: Boolean, default: true },
  props: { type: Schema.Types.Mixed, default: {} } // Use Mixed for flexibility
}, { _id: false }); // Disable auto _id for sections to keep it clean

const PageConfigSchema: Schema<IPageConfig> = new Schema(
  {
    type: { type: String, required: true, unique: true, default: "order-page" },
    sections: [PageSectionSchema]
  },
  { timestamps: true }
);

// Prevent overwrite error
const PageConfig: Model<IPageConfig> =
  mongoose.models.PageConfig || mongoose.model<IPageConfig>("PageConfig", PageConfigSchema);

export default PageConfig;
