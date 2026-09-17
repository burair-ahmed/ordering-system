import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPageSection {
  id: string;
  type: 'hero' | 'banner' | 'rich-content' | 'divider' | 'testimonials' | 'slider' | 'grid' | 'image-slider';
  title: string;
  isVisible: boolean;
  props: any; // Flexible schema to support diverse settings (columns, timers, layout settings)
}

export interface IClassicCategoryConfig {
  id: string;
  name: string;
  isPlatter: boolean;
  isVisible: boolean;
}

export interface IPageConfig extends Document {
  type: string;
  sections: IPageSection[];
  useCmsLayout: boolean;
  classicBannerType?: 'hero' | 'image-slider';
  classicCategories?: IClassicCategoryConfig[];
}

const ClassicCategorySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  isPlatter: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true }
}, { _id: false });

const PageSectionSchema = new Schema({
  id: { type: String, required: true },
  type: { 
      type: String, 
      required: true, 
      enum: ['hero', 'banner', 'rich-content', 'divider', 'testimonials', 'slider', 'grid', 'image-slider'] 
  },
  title: { type: String, default: "" },
  isVisible: { type: Boolean, default: true },
  props: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const PageConfigSchema: Schema<IPageConfig> = new Schema(
  {
    type: { type: String, required: true, unique: true, default: "order-page" },
    sections: [PageSectionSchema],
    useCmsLayout: { type: Boolean, default: true },
    classicBannerType: { type: String, enum: ['hero', 'image-slider'], default: 'hero' },
    classicCategories: [ClassicCategorySchema]
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.PageConfig) {
  delete mongoose.models.PageConfig;
}

const PageConfig: Model<IPageConfig> = mongoose.model<IPageConfig>("PageConfig", PageConfigSchema);

export default PageConfig;

