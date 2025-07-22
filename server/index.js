// 1. Core and third-party imports
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 2. Custom imports
import { logger, morganStream } from './middleware/logger.js';
import { initializeFirebase } from './config/firebase.js';
import routes from './routes/index.js';

// 3. Init and config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 4. App middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: morganStream }));

// 5. Initialize Firebase Admin SDK
initializeFirebase();

// 6. Routes
app.use('/api', routes);

// 7. Health check
app.get('/', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({ status: 'ok', message: 'Server running' });
});

// 8. MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.MONGO_DB_NAME || 'knowledgebase',
})
  .then(() => {
    logger.info(`MongoDB connected`);
    app.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection failed', { error: error.message });
    process.exit(1);
  });
