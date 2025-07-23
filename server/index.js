// 1. Core and third-party imports
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
// 2. Custom imports
import { connectToDatabase, initializeDatabase } from './config/database.js';
import { initializeFirebase } from './config/firebase.js';
import { AppError, errorHandler } from './middleware/error.js';
import { logger, morganStream } from './middleware/logger.js';
import routes from './routes/index.js';
// Import all models to register them with Mongoose
import './models/index.js';

// 3. Init and config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Configure CORS for different environments
    const corsOptions = {
      origin: process.env.NODE_ENV === 'production'
        ? [
          process.env.CLIENT_URL,
          /^https:\/\/.*\.railway\.app$/,
          /^https:\/\/.*\.up\.railway\.app$/
        ]
        : [
          'http://localhost:3000',
          'https://curly-train-7jgg75w5w2rr57-3000.app.github.dev',
          /^https:\/\/.*\.app\.github\.dev$/
        ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 200
    };

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(morgan('combined', { stream: morganStream }));

    // 5. Initialize Firebase Admin SDK
    await initializeFirebase();

    // 6. Routes
    app.use('/api', routes);

    // 7. Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      // Serve static files from the React app build directory
      app.use(express.static(path.join(__dirname, '../client/build')));

      // Handle React routing, return all requests to React app
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
      });
    } else {
      // 8. Development health check
      app.get('/', (req, res) => {
        logger.info('Health check requested');
        res.status(200).json({ status: 'ok', message: 'Server running' });
      });

      // 9. 404 handler for non-API routes in development
      app.use('*', (req, res, next) => {
        const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
        next(error);
      });
    }

    // 10. Global error handler
    app.use(errorHandler);

    // 11. MongoDB connection
    await connectToDatabase();
    await initializeDatabase();

    logger.info('Database connected and initialized successfully');

    // 12. Start server
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      logger.info(`Server running at http://${HOST}:${PORT}`);
    });

  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();
