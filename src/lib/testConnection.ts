import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const testMongoConnection = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:jHG1csS4fbZWUcrL@cafe-little.mfqm3.mongodb.net/?retryWrites=true&w=majority&appName=cafe-little';
  
  console.log('Using MongoDB URI'); // Log the URI to check

  try {
    await mongoose.connect(MONGODB_URI); // No need for `useNewUrlParser` or `useUnifiedTopology` in Mongoose v6
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

export default testMongoConnection();
