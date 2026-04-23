import mongoose from 'mongoose';

let connectionPromise = null;

function getConnectionStateLabel() {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
}

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri) {
      throw new Error('Missing MONGODB_URI environment variable.');
    }

    console.log('Connecting to MongoDB...');

    connectionPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 10000
      })
      .then((connection) => {
        console.log('MongoDB connected successfully');
        return connection;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error('MongoDB connection failed:', error);
        throw error;
      });
  }

  await connectionPromise;
  return mongoose.connection;
}

export function getDatabaseHealth() {
  return {
    connected: mongoose.connection.readyState === 1,
    state: getConnectionStateLabel(),
    databaseName: mongoose.connection.name || null
  };
}
