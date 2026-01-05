import mongoose from 'mongoose';
import MenuItem from '../src/models/MenuItem';
import Platter from '../src/models/Platter';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env");
  process.exit(1);
}

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        // Reset all first
        await MenuItem.updateMany({}, { isBestSeller: false, isFeatured: false });
        await Platter.updateMany({}, { isBestSeller: false, isFeatured: false });
        console.log("Reset flags");

        // Get all items
        const menuItems = await MenuItem.find({});
        const platters = await Platter.find({});

        if (menuItems.length > 0) {
            // Set 1 Best Seller
            const bestSeller = menuItems[0];
            bestSeller.isBestSeller = true;
            await bestSeller.save();
            console.log(`Set Best Seller: ${bestSeller.title}`);

            // Set 5 Featured (Mix)
            for (let i = 1; i < Math.min(6, menuItems.length); i++) {
                menuItems[i].isFeatured = true;
                await menuItems[i].save();
                console.log(`Set Featured Menu: ${menuItems[i].title}`);
            }
        }

        if (platters.length > 0) {
             // Set 1 Featured Platter
             platters[0].isFeatured = true;
             await platters[0].save();
             console.log(`Set Featured Platter: ${platters[0].title}`);
        }

        console.log("Seeding complete");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding:", error);
        process.exit(1);
    }
}

seed();
