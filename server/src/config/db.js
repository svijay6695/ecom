import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isConnected = false;
let embeddedMongoInstance = null;

export const connectDB = async () => {
  const customUri = process.env.MONGODB_URI;

  // 1. If an external/custom URI is provided (e.g. Atlas or local running mongod), try connecting
  if (customUri) {
    try {
      const sanitized = customUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
      console.log(`📡 Connecting to MongoDB at ${sanitized}...`);
      const conn = await mongoose.connect(customUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log(`✅ MongoDB Connected successfully (External/Atlas): ${conn.connection.host}/${conn.connection.name}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ External MongoDB at ${customUri} not reachable (${error.message}).`);
    }
  }

  // 2. Fallback to Local Persistent MongoDB Engine (WiredTiger) via mongodb-memory-server
  try {
    console.log(`🚀 Starting persistent local MongoDB engine (WiredTiger)...`);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve(__dirname, '../../data/mongodb_data');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    embeddedMongoInstance = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
        dbName: 'vr_nuts'
      }
    });

    const localUri = embeddedMongoInstance.getUri() + 'vr_nuts';
    const conn = await mongoose.connect(localUri);
    isConnected = true;
    console.log(`✅ MongoDB Connected successfully (Persistent Engine): ${conn.connection.host}/${conn.connection.name}`);
    console.log(`📂 Database directory: ${dbPath}`);
    return true;
  } catch (err) {
    isConnected = false;
    console.error(`❌ Could not start MongoDB engine:`, err.message);
    return false;
  }
};

export const getDBStatus = () => ({
  connected: isConnected,
  ready: mongoose.connection.readyState === 1,
  type: embeddedMongoInstance ? 'embedded_persistent_mongodb' : 'external_mongodb'
});

// Graceful cleanup on server stop
const cleanup = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    if (embeddedMongoInstance) {
      await embeddedMongoInstance.stop();
    }
  } catch {
    // Ignore cleanup errors on shutdown
  }
};

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});
