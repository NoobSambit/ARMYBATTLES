import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(retries = 5, delay = 1000) {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      throw new Error('Please define MONGO_URI environment variable');
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = (async () => {
      let lastError;
      for (let i = 0; i < retries; i++) {
        try {
          const conn = await mongoose.connect(MONGO_URI, opts);
          console.log('MongoDB connected successfully');
          return conn;
        } catch (error) {
          lastError = error;
          console.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`, error.message);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
          }
        }
      }
      throw lastError;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

