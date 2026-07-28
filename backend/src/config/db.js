const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp_clone';
    
    // Attempt standard connection first with timeout
    mongoose.set('strictQuery', false);
    
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[DB] Connected to MongoDB at: ${mongoUri}`);
    } catch (err) {
      console.warn('[DB] Primary MongoDB connection failed. Initializing MongoMemoryServer fallback...');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Connected to In-Memory MongoDB at: ${memoryUri}`);
    }
  } catch (error) {
    console.error('[DB] Mongoose connection error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
