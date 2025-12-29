//running script npx tsx -r dotenv/config scripts/migrateMenuItemImagesmenu.ts

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import MenuItem from "../src/models/MenuItem"; // ✅ your real model path

// ✅ ENV Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("✅ Connected to MongoDB");
}

async function uploadBase64ToCloudinary(base64: string) {
  const res = await cloudinary.uploader.upload(base64, {
    folder: "menu_items",
  });
  return res.secure_url;
}

async function migrateMenuItems() {
  await connectDB();

  const items = await MenuItem.find({ image: { $exists: true, $ne: "" } });
  console.log(`Found ${items.length} items to migrate...\n`);

  for (const item of items) {
    try {
      console.log(`⬆️ Uploading: ${item.title}`);

      const url = await uploadBase64ToCloudinary(item.image);

      item.image = url; // replace old base64 with URL
      await item.save();

      console.log(`✅ Updated → ${url}\n`);
    } catch (err) {
      console.log(`❌ Failed: ${item.title}`, err);
    }
  }

  console.log("🎉 Migration Completed!");
  process.exit(0);
}

migrateMenuItems(); 