// 1. Core and third-party imports
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
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
    // 4. App middleware with Firebase Auth popup support
    if (process.env.NODE_ENV === 'production') {
      // More restrictive headers for production
      app.use(helmet({
        crossOriginOpenerPolicy: { policy: 'unsafe-none' },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false
      }));
    } else {
      // More permissive headers for development to allow Firebase Auth
      app.use(helmet({
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: false // Disable CSP in development for Firebase Auth
      }));
    }

    // Configure CORS for different environments
    const allowedOrigins = [];

    if (process.env.NODE_ENV === 'production') {
      // Production origins
      if (process.env.CLIENT_URL) {
        allowedOrigins.push(process.env.CLIENT_URL);
      }
      allowedOrigins.push(/^https:\/\/.*\.railway\.app$/);
      allowedOrigins.push(/^https:\/\/.*\.up\.railway\.app$/);

      // Also allow Codespaces for development testing
      allowedOrigins.push(/^https:\/\/.*\.app\.github\.dev$/);
    } else {
      // Development origins - use CLIENT_URL from env or fallback to localhost
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      allowedOrigins.push(clientUrl);

      // Also add localhost variations for development
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://localhost:5000');

      // Allow all GitHub Codespaces URLs
      allowedOrigins.push(/^https:\/\/.*\.app\.github\.dev$/);
    }

    // Log allowed origins for debugging
    logger.info('CORS allowed origins:', {
      origins: allowedOrigins.map(o => o.toString()),
      clientUrl: process.env.CLIENT_URL,
      nodeEnv: process.env.NODE_ENV
    });

    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          callback(null, true);
          return;
        }

        // Check if the origin is allowed
        const isAllowed = allowedOrigins.some(allowedOrigin => {
          if (typeof allowedOrigin === 'string') {
            return allowedOrigin === origin;
          } else if (allowedOrigin instanceof RegExp) {
            return allowedOrigin.test(origin);
          }
          return false;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked origin: ${origin}`, {
            origin,
            allowedOrigins: allowedOrigins.map(o => o.toString())
          });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Authorization'],
      optionsSuccessStatus: 200,
      preflightContinue: false
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

      // Handle favicon.ico requests to prevent 404 errors
      app.get('/favicon.ico', (req, res) => {
        res.status(204).end(); // No content response
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
