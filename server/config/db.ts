import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    // Read URI inside function so it gets the env var after dotenv loads
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-assistant';
    
    console.log('🔄 Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    
    const db = await mongoose.connect(MONGODB_URI);
    
    isConnected = db.connections[0].readyState === 1;
    
    console.log('✅ MongoDB connected successfully');
    console.log(`Database: ${db.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectDB() {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

export default connectDB;
