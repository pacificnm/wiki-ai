import express from 'express';
import {
  getActivityStats,
  getRecentActivities
} from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/activities
 * @desc    Get recent activities
 * @access  Private
 * @query   {number} limit - Number of activities to return (default: 10)
 * @query   {boolean} global - Get global activities or user-specific (default: false)
 * @query   {string} types - Comma-separated list of activity types to filter by
 * @query   {string} since - ISO date string to filter activities since
 */
router.get('/', authenticateToken, getRecentActivities);

/**
 * @route   GET /api/activities/stats
 * @desc    Get activity statistics
 * @access  Private
 * @query   {boolean} global - Get global stats or user-specific (default: false)
 * @query   {string} since - ISO date string to filter activities since
 */
router.get('/stats', authenticateToken, getActivityStats);

export default router;
