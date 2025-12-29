import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  // If the connection is already established, don't reconnect
  if (mongoose.connection.readyState >= 1) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    // Get the MongoDB URI from the environment variable
    const MONGODB_URI = process.env.MONGODB_URI || '';
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI is not defined');
    }

    console.log('Using MongoDB URI:', MONGODB_URI); // Log the URI for debugging

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('MongoDB connection failed');
  }
};

export default connectDB;
