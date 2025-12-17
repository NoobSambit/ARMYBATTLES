import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(retries = 2, delay = 500) {
  // Check if connection exists and is still ready (important for serverless)
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  
  // If connection exists but is not ready, reset it
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      throw new Error(
        'MONGO_URI environment variable is not defined. ' +
        'Please create a .env file with MONGO_URI=your_mongodb_connection_string'
      );
    }

    // Validate MONGO_URI format
    if (!MONGO_URI.startsWith('mongodb://') && !MONGO_URI.startsWith('mongodb+srv://')) {
      throw new Error(
        'Invalid MONGO_URI format. It should start with mongodb:// or mongodb+srv://'
      );
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Reduced to 5s for faster failures
      socketTimeoutMS: 20000, // Reduced to 20s
      connectTimeoutMS: 5000, // Reduced to 5s for faster connection
      minPoolSize: 1, // Keep at least 1 connection alive
    };

    cached.promise = (async () => {
      let lastError;
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`MongoDB connection attempt ${i + 1}/${retries}...`);
          const conn = await mongoose.connect(MONGO_URI, opts);
          console.log('✅ MongoDB connected successfully');
          return conn;
        } catch (error) {
          lastError = error;
          console.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed:`, error.message);

          // Provide helpful error messages
          if (error.message.includes('ENOTFOUND')) {
            console.error('   → DNS resolution failed. Check your MongoDB host address.');
          } else if (error.message.includes('ETIMEDOUT')) {
            console.error('   → Connection timed out. Check network connectivity or firewall settings.');
          } else if (error.message.includes('authentication failed')) {
            console.error('   → Authentication failed. Check your MongoDB username and password.');
          } else if (error.message.includes('ECONNREFUSED')) {
            console.error('   → Connection refused. Ensure MongoDB is running and accessible.');
          }

          if (i < retries - 1) {
            const waitTime = delay * Math.pow(2, i);
            console.log(`   → Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      console.error(`❌ All ${retries} MongoDB connection attempts failed.`);
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

