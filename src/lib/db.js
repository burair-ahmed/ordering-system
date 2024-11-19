import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI,   
 {
      // Remove useNewUrlParser and useUnifiedTopology options
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('MongoDB connection failed');
  }
};

export default connectDB;