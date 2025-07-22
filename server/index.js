
// 1. Core and third-party imports
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 2. Custom imports
import { logger, morganStream } from './middleware/logger.js';
import { errorHandler, AppError } from './middleware/error.js';
import { initializeFirebase } from './config/firebase.js';
import routes from './routes/index.js';

// 3. Init and config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Start the server with proper async initialization.
 * 
 * @async
 * @function startServer
 * @returns {Promise<void>}
 */
async function startServer() {
  try {
    // 4. App middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(morgan('combined', { stream: morganStream }));

    // 5. Initialize Firebase Admin SDK
    await initializeFirebase();

    // 6. Routes
    app.use('/api', routes);

    // 7. Health check
    app.get('/', (req, res) => {
      logger.info('Health check requested');
      res.status(200).json({ status: 'ok', message: 'Server running' });
    });

    // 8. 404 handler for non-API routes
    app.use('*', (req, res, next) => {
      const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
      next(error);
    });

    // 9. Global error handler
    app.use(errorHandler);

    // 10. MongoDB connection
    // 10. MongoDB connection
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGO_DB_NAME || 'knowledgebase',
    });
    
    logger.info('MongoDB connected successfully');

    // 11. Start server
    app.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();
