import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DeliveryArea from '../src/models/DeliveryArea';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';

const initialAreas = [
  { name: "Gulistan-e-Johar (All Blocks)", charge: 200, isAvailable: true, note: "" },
  { name: "Johor Block 6", charge: 200, isAvailable: true, note: "Delivery not possible after Magrib" },
  { name: "Bhitaiabad", charge: 300, isAvailable: true, note: "Delivery not possible after 6:00 PM" },
  { name: "Johor Block 7", charge: 250, isAvailable: true, note: "" },
  { name: "Johor Block 8", charge: 250, isAvailable: true, note: "" },
  { name: "Johor Block 9", charge: 250, isAvailable: true, note: "" },
  { name: "Johor Block 10", charge: 280, isAvailable: true, note: "" },
  { name: "Dalmia Road", charge: 250, isAvailable: true, note: "" },
  { name: "Askari 4", charge: 220, isAvailable: true, note: "" },
  { name: "Gulshan-e-Jamal", charge: 220, isAvailable: true, note: "" },
  { name: "NHS Phase 1", charge: 350, isAvailable: true, note: "" },
  { name: "NHS Phase 2", charge: 350, isAvailable: true, note: "" },
  { name: "NHS Phase 3", charge: 350, isAvailable: true, note: "" },
  { name: "NHS Phase 4", charge: 400, isAvailable: true, note: "" },
  { name: "Scheme 33", charge: 400, isAvailable: true, note: "" },
  { name: "Saadi Town / Societies on Saadi Town Road", charge: 450, isAvailable: true, note: "" },
  { name: "Malir Checkpost 5", charge: 450, isAvailable: true, note: "" },
  { name: "Malir Checkpost 6", charge: 450, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 1", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 2", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 3", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 4", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 5", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 6", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 7", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 8", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 9", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 10", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 10A", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 11", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 13", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 14", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 15", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 16", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 17", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 18", charge: 280, isAvailable: true, note: "" },
  { name: "Gulshan-e-Iqbal Block 19", charge: 280, isAvailable: true, note: "" },
  { name: "FB Area (All Blocks)", charge: 400, isAvailable: true, note: "" },
  { name: "Naya Nazimabad", charge: 800, isAvailable: true, note: "" },
  { name: "Nazimabad", charge: 550, isAvailable: true, note: "" },
  { name: "North Nazimabad", charge: 500, isAvailable: true, note: "" },
  { name: "North Karachi", charge: 600, isAvailable: true, note: "" },
  { name: "New Karachi", charge: 700, isAvailable: true, note: "" },
  { name: "Malir (All Areas)", charge: 550, isAvailable: true, note: "" },
  { name: "Shah Faisal Colony", charge: 450, isAvailable: true, note: "" },
  { name: "Bahadurabad (All Areas)", charge: 450, isAvailable: true, note: "" },
  { name: "Shahrah-e-Faisal (On Demand)", charge: 0, isAvailable: true, note: "Charges on demand" },
  { name: "AOHS", charge: 300, isAvailable: true, note: "" },
  { name: "DOHS", charge: 300, isAvailable: true, note: "" },
  { name: "KDA Officers Colony A, B", charge: 300, isAvailable: true, note: "" },
  { name: "Gulistan Society", charge: 550, isAvailable: true, note: "" },
  { name: "Teacher Sector 19-A", charge: 550, isAvailable: true, note: "" },
  { name: "Halari Memon", charge: 550, isAvailable: true, note: "" },
  { name: "Musalmanane Punjabi Saudagran", charge: 550, isAvailable: true, note: "" },
  { name: "Tariq Road / SMCHS", charge: 500, isAvailable: true, note: "" },
];

async function seed() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB. Seeding delivery areas...");

    await DeliveryArea.deleteMany({});
    console.log("Cleared existing delivery areas.");

    const result = await DeliveryArea.insertMany(initialAreas);
    console.log(`Successfully seeded ${result.length} delivery areas!`);

    await mongoose.disconnect();
    console.log("Disconnected from database.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
