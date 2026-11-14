import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Optional: Add strictQuery if needed
    mongoose.set('strictQuery', false);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging 10s+
    });
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;