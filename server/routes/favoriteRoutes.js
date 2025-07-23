import express from 'express';
import {
  addToFavorites,
  checkFavoriteStatus,
  getFavoriteStats,
  getUserFavorites,
  removeFromFavorites
} from '../controllers/favoriteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/favorites
 * @desc    Get all favorites for the current user
 * @access  Private
 */
router.get('/', authenticateToken, getUserFavorites);

/**
 * @route   GET /api/favorites/stats
 * @desc    Get favorite statistics for the current user
 * @access  Private
 */
router.get('/stats', authenticateToken, getFavoriteStats);

/**
 * @route   POST /api/favorites/:documentId
 * @desc    Add a document to favorites
 * @access  Private
 */
router.post('/:documentId', authenticateToken, addToFavorites);

/**
 * @route   DELETE /api/favorites/:documentId
 * @desc    Remove a document from favorites
 * @access  Private
 */
router.delete('/:documentId', authenticateToken, removeFromFavorites);

/**
 * @route   GET /api/favorites/:documentId/status
 * @desc    Check if a document is favorited by the user
 * @access  Private
 */
router.get('/:documentId/status', authenticateToken, checkFavoriteStatus);

export default router;
