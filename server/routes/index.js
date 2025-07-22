import express from 'express';
import authRoutes from './authRoutes.js';
import errorRoutes from './errorRoutes.js';

const router = express.Router();

/**
 * Main API routes.
 * 
 * @namespace Routes
 */

/**
 * Health check endpoint.
 * 
 * @route GET /api/health
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * Authentication routes.
 * 
 * @route /api/auth/*
 */
router.use('/auth', authRoutes);

/**
 * Error logging and management routes.
 * 
 * @route /api/errors/*
 */
router.use('/errors', errorRoutes);

/**
 * Admin routes (when implemented).
 * 
 * @route /api/admin/*
 */
// router.use('/admin', adminRoutes);

/**
 * User routes (when implemented).
 * 
 * @route /api/user/*
 */
// router.use('/user', userRoutes);

/**
 * Catch-all route for undefined API endpoints.
 * 
 * @route * /api/*
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

export default router;
