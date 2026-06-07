import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-agricultural-market';
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};
