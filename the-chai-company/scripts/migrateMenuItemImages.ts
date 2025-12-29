//running script npx tsx -r dotenv/config scripts/migrateMenuItemImages.ts


import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Platter from "../src/models/Platter"; // ✅ Platter model path

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
    folder: "platter_items", // ✅ different folder (optional)
  });
  return res.secure_url;
}

async function migratePlatterImages() {
  await connectDB();

  const items = await Platter.find({ image: { $exists: true, $ne: "" } });
  console.log(`Found ${items.length} platter images to migrate...\n`);

  for (const item of items) {
    try {
      console.log(`⬆️ Uploading: ${item.title}`);

      const url = await uploadBase64ToCloudinary(item.image);

      item.image = url;
      await item.save();

      console.log(`✅ Updated → ${url}\n`);
    } catch (err) {
      console.log(`❌ Failed for ${item.title}`, err);
    }
  }

  console.log("🎉 Platter Migration Completed!");
  process.exit(0);
}

migratePlatterImages();
