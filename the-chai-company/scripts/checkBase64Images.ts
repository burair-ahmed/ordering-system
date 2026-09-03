import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import MenuItem from "../src/models/MenuItem";
import Platter from "../src/models/Platter";

async function checkDatabaseImages() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment!");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB (TCC)");

    // Check MenuItems
    const menuItems = await MenuItem.find({});
    let menuBase64Count = 0;
    let menuUrlCount = 0;

    for (const item of menuItems) {
      const img = item.image || "";
      if (img.startsWith("data:image") || img.startsWith("data:") || (img.length > 500 && !img.startsWith("http"))) {
        menuBase64Count++;
        console.log(`[MenuItem Base64] ID: ${item._id}, Title: "${item.title}", Base64 Length: ${img.length}`);
      } else if (img.startsWith("http://") || img.startsWith("https://")) {
        menuUrlCount++;
      }
    }

    // Check Platters
    const platters = await Platter.find({});
    let platterBase64Count = 0;
    let platterUrlCount = 0;

    for (const item of platters) {
      const img = item.image || "";
      if (img.startsWith("data:image") || img.startsWith("data:") || (img.length > 500 && !img.startsWith("http"))) {
        platterBase64Count++;
        console.log(`[Platter Base64] ID: ${item._id}, Title: "${item.title}", Base64 Length: ${img.length}`);
      } else if (img.startsWith("http://") || img.startsWith("https://")) {
        platterUrlCount++;
      }
    }

    console.log("\n--- TCC SUMMARY ---");
    console.log(`MenuItems: Total = ${menuItems.length}, Base64 = ${menuBase64Count}, URL = ${menuUrlCount}`);
    console.log(`Platters: Total = ${platters.length}, Base64 = ${platterBase64Count}, URL = ${platterUrlCount}`);

  } catch (err) {
    console.error("❌ Error checking DB images:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkDatabaseImages();
