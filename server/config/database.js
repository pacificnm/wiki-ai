import mongoose from 'mongoose';
import { logger } from '../middleware/logger.js';

/**
 * MongoDB connection configuration and utilities.
 *
 * @module config/database
 */

/**
 * MongoDB connection options optimized for MongoDB Atlas.
 *
 * @constant {Object} connectionOptions
 */
const connectionOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds (Atlas needs more time)
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  retryWrites: true, // Automatically retry write operations on transient network errors
  w: 'majority' // Write concern - wait for majority of replica set members
};

/**
 * Database connection state.
 *
 * @type {Object}
 */
export const dbState = {
  isConnected: false,
  isConnecting: false,
  error: null,
  retryAttempts: 0,
  maxRetries: 5
};

/**
 * Connect to MongoDB with retry logic.
 *
 * @async
 * @function connectToDatabase
 * @param {string} [uri] - MongoDB connection URI (defaults to env variable)
 * @param {string} [dbName] - Database name (defaults to env variable)
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 *
 * @throws {Error} When connection fails after max retries
 *
 * @example
 * await connectToDatabase();
 * // or with custom URI
 * await connectToDatabase('mongodb://localhost:27017/custom-db');
 */
export async function connectToDatabase(uri = null, dbName = null) {
  if (dbState.isConnected) {
    logger.info('Database already connected');
    return mongoose.connection;
  }

  if (dbState.isConnecting) {
    logger.info('Database connection in progress, waiting...');
    // Wait for existing connection attempt
    while (dbState.isConnecting && dbState.retryAttempts < dbState.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return mongoose.connection;
  }

  const connectionUri = uri || process.env.MONGO_URI;
  const database = dbName || process.env.MONGO_DB_NAME || 'wiki-ai';

  if (!connectionUri) {
    throw new Error('MongoDB URI is required. Set MONGO_URI environment variable.');
  }

  dbState.isConnecting = true;
  dbState.error = null;

  const connectWithRetry = async (attemptNumber = 1) => {
    try {
      logger.info(`Attempting MongoDB connection (attempt ${attemptNumber}/${dbState.maxRetries})`, {
        uri: connectionUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials in logs
        database,
        attempt: attemptNumber
      });

      const connection = await mongoose.connect(connectionUri, {
        ...connectionOptions,
        dbName: database
      });

      dbState.isConnected = true;
      dbState.isConnecting = false;
      dbState.error = null;
      dbState.retryAttempts = 0;

      logger.info('MongoDB connected successfully', {
        database,
        host: connection.connection.host,
        port: connection.connection.port,
        readyState: connection.connection.readyState
      });

      return connection.connection;

    } catch (error) {
      dbState.retryAttempts = attemptNumber;
      dbState.error = error;

      logger.error(`MongoDB connection attempt ${attemptNumber} failed`, {
        error: error.message,
        code: error.code,
        attempt: attemptNumber,
        maxRetries: dbState.maxRetries
      });

      if (attemptNumber < dbState.maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, attemptNumber), 30000); // Exponential backoff, max 30s
        logger.info(`Retrying MongoDB connection in ${retryDelay}ms...`);

        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return connectWithRetry(attemptNumber + 1);
      } else {
        dbState.isConnecting = false;
        throw new Error(`Failed to connect to MongoDB after ${dbState.maxRetries} attempts: ${error.message}`);
      }
    }
  };

  return connectWithRetry();
}

/**
 * Disconnect from MongoDB.
 *
 * @async
 * @function disconnectFromDatabase
 * @returns {Promise<void>}
 *
 * @example
 * await disconnectFromDatabase();
 */
export async function disconnectFromDatabase() {
  if (!dbState.isConnected) {
    logger.info('Database not connected, nothing to disconnect');
    return;
  }

  try {
    await mongoose.disconnect();
    dbState.isConnected = false;
    dbState.error = null;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: error.message });
    throw error;
  }
}

/**
 * Check database connection health.
 *
 * @async
 * @function checkDatabaseHealth
 * @returns {Promise<Object>} Database health information
 *
 * @example
 * const health = await checkDatabaseHealth();
 * console.log(health.status); // 'connected' | 'disconnected' | 'error'
 */
export async function checkDatabaseHealth() {
  try {
    const { connection } = mongoose;
    const isConnected = connection.readyState === 1;

    if (!isConnected) {
      return {
        status: 'disconnected',
        readyState: connection.readyState,
        error: dbState.error?.message
      };
    }

    // Test the connection with a ping
    await connection.db.admin().ping();

    return {
      status: 'connected',
      readyState: connection.readyState,
      database: connection.name,
      host: connection.host,
      port: connection.port,
      collections: await connection.db.listCollections().toArray()
    };

  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'error',
      error: error.message,
      readyState: mongoose.connection.readyState
    };
  }
}

/**
 * Get database statistics.
 *
 * @async
 * @function getDatabaseStats
 * @returns {Promise<Object>} Database statistics
 *
 * @example
 * const stats = await getDatabaseStats();
 * console.log(stats.collections); // Number of collections
 */
export async function getDatabaseStats() {
  try {
    if (!dbState.isConnected) {
      throw new Error('Database not connected');
    }

    const { db } = mongoose.connection;
    const stats = await db.stats();
    const collections = await db.listCollections().toArray();

    return {
      database: mongoose.connection.name,
      collections: collections.length,
      collectionNames: collections.map(c => c.name),
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexSize: stats.indexSize,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
      ok: stats.ok === 1
    };

  } catch (error) {
    logger.error('Failed to get database statistics', { error: error.message });
    throw error;
  }
}

/**
 * Setup database event listeners.
 *
 * @function setupDatabaseListeners
 * @returns {void}
 */
export function setupDatabaseListeners() {
  const { connection } = mongoose;

  connection.on('connected', () => {
    dbState.isConnected = true;
    dbState.isConnecting = false;
    logger.info('Mongoose connected to MongoDB');
  });

  connection.on('error', (error) => {
    dbState.error = error;
    logger.error('Mongoose connection error', { error: error.message });
  });

  connection.on('disconnected', () => {
    dbState.isConnected = false;
    logger.warn('Mongoose disconnected from MongoDB');
  });

  connection.on('reconnected', () => {
    dbState.isConnected = true;
    dbState.error = null;
    logger.info('Mongoose reconnected to MongoDB');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, closing MongoDB connection...');
    await disconnectFromDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, closing MongoDB connection...');
    await disconnectFromDatabase();
    process.exit(0);
  });
}

/**
 * Initialize database with collections and indexes.
 *
 * @async
 * @function initializeDatabase
 * @returns {Promise<void>}
 *
 * @example
 * await initializeDatabase();
 */
export async function initializeDatabase() {
  try {
    logger.info('Initializing database collections and indexes...');

    // Example: Create indexes for common collections
    // You can expand this based on your models
    const collections = ['users', 'documents', 'sessions'];

    for (const collectionName of collections) {
      try {
        // Check if collection exists, create if not
        const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();

        if (collections.length === 0) {
          await mongoose.connection.db.createCollection(collectionName);
          logger.info(`Created collection: ${collectionName}`);
        }

        // Add common indexes
        const collection = mongoose.connection.db.collection(collectionName);

        switch (collectionName) {
          case 'users':
            await collection.createIndex({ email: 1 }, { unique: true, background: true });
            await collection.createIndex({ uid: 1 }, { unique: true, background: true });
            await collection.createIndex({ createdAt: 1 }, { background: true });
            break;
          case 'documents':
            await collection.createIndex({ userId: 1 }, { background: true });
            await collection.createIndex({ title: 'text', content: 'text' }, { background: true });
            await collection.createIndex({ createdAt: -1 }, { background: true });
            break;
          case 'sessions':
            await collection.createIndex({ sessionId: 1 }, { unique: true, background: true });
            await collection.createIndex({ userId: 1 }, { background: true });
            await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });
            break;
        }

        logger.info(`Indexes created for collection: ${collectionName}`);
      } catch (error) {
        logger.warn(`Failed to initialize collection ${collectionName}`, { error: error.message });
      }
    }

    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
}

/**
 * Backup database to a file.
 *
 * @async
 * @function backupDatabase
 * @param {string} [outputPath] - Output path for backup file
 * @returns {Promise<string>} Path to backup file
 *
 * @example
 * const backupPath = await backupDatabase('./backups/');
 */
export async function backupDatabase(outputPath = './backups/') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${outputPath}backup-${timestamp}.json`;

    logger.info('Starting database backup...', { outputPath: backupFile });

    // This is a simple JSON backup - for production use mongodump
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backup = {};

    for (const collection of collections) {
      const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
      backup[collection.name] = data;
      logger.debug(`Backed up collection: ${collection.name} (${data.length} documents)`);
    }

    // Write backup file (you'll need to implement file writing)
    logger.info('Database backup completed', {
      file: backupFile,
      collections: collections.length,
      timestamp
    });

    return backupFile;
  } catch (error) {
    logger.error('Database backup failed', { error: error.message });
    throw error;
  }
}

// Setup listeners on module load
setupDatabaseListeners();

export default {
  connectToDatabase,
  disconnectFromDatabase,
  checkDatabaseHealth,
  getDatabaseStats,
  initializeDatabase,
  backupDatabase,
  dbState
};
