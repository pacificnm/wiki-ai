import express from 'express';
import activityRoutes from './activityRoutes.js';
import adminRoutes from './admin/adminRoutes.js';
import aiRoutes from './aiRoutes.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import commentRoutes from './commentRoutes.js';
import documentRoutes from './documentRoutes.js';
import errorRoutes from './errorRoutes.js';
import exportRoutes from './exportRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';

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
 * Error handling and logging routes.
 *
 * @route /api/error/*
 */
router.use('/error', errorRoutes);

/**
 * Client-side logging endpoint.
 *
 * @route POST /api/logs
 */
router.post('/logs', (req, res) => {
  // Just acknowledge receipt - client logging is optional
  res.status(200).json({ success: true, message: 'Log received' });
});

/**
 * Category management routes.
 *
 * @route /api/categories/*
 */
router.use('/categories', categoryRoutes);

/**
 * Document management routes.
 *
 * @route /api/documents/*
 */
router.use('/documents', documentRoutes);

/**
 * Comment management routes.
 *
 * @route /api/comments/*
 */
router.use('/comments', commentRoutes);

/**
 * Favorite management routes.
 *
 * @route /api/favorites/*
 */
router.use('/favorites', favoriteRoutes);

/**
 * Activity tracking routes.
 *
 * @route /api/activities/*
 */
router.use('/activities', activityRoutes);

/**
 * Export routes for documents.
 *
 * @route /api/export/*
 */
router.use('/export', exportRoutes);

/**
 * Admin routes.
 *
 * @route /api/admin/*
 */
router.use('/admin', adminRoutes);

/**
 * AI-powered document generation and improvement routes.
 *
 * @route /api/ai/*
 */
router.use('/ai', aiRoutes);

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
