import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { ensureCloudinaryUrl } from "../src/lib/cloudinary";
import MenuItem from "../src/models/MenuItem";
import Platter from "../src/models/Platter";

async function migrateDatabaseImages() {
  console.log("🚀 Starting Base64 to Cloudinary Migration...\n");

  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment!");
      process.exit(1);
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("❌ Cloudinary credentials missing in environment!");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Migrate MenuItems
    const menuItems = await MenuItem.find({});
    let menuMigratedCount = 0;
    let menuFailedCount = 0;

    for (const item of menuItems) {
      const img = item.image || "";
      if (img.startsWith("data:") || (img.length > 500 && !img.startsWith("http"))) {
        console.log(`⏳ Uploading MenuItem base64 image: "${item.title}" (ID: ${item._id})...`);
        try {
          const cloudinaryUrl = await ensureCloudinaryUrl(img, "cafe-little-karachi/menu_items");
          item.image = cloudinaryUrl;
          await item.save();
          menuMigratedCount++;
          console.log(`  ✅ Successfully updated to: ${cloudinaryUrl}`);
        } catch (err) {
          menuFailedCount++;
          console.error(`  ❌ Failed to migrate MenuItem "${item.title}":`, err);
        }
      }
    }

    // 2. Migrate Platters
    const platters = await Platter.find({});
    let platterMigratedCount = 0;
    let platterFailedCount = 0;

    for (const item of platters) {
      const img = item.image || "";
      if (img.startsWith("data:") || (img.length > 500 && !img.startsWith("http"))) {
        console.log(`⏳ Uploading Platter base64 image: "${item.title}" (ID: ${item._id})...`);
        try {
          const cloudinaryUrl = await ensureCloudinaryUrl(img, "cafe-little-karachi/platters");
          item.image = cloudinaryUrl;
          await item.save();
          platterMigratedCount++;
          console.log(`  ✅ Successfully updated to: ${cloudinaryUrl}`);
        } catch (err) {
          platterFailedCount++;
          console.error(`  ❌ Failed to migrate Platter "${item.title}":`, err);
        }
      }
    }

    console.log("\n==========================================");
    console.log("🎉 MIGRATION SUMMARY");
    console.log(`MenuItems: Migrated = ${menuMigratedCount}, Failed = ${menuFailedCount}`);
    console.log(`Platters:  Migrated = ${platterMigratedCount}, Failed = ${platterFailedCount}`);
    console.log("==========================================\n");

  } catch (err) {
    console.error("❌ Fatal Error during migration:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateDatabaseImages();
