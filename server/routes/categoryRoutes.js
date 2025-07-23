import express from 'express';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getCategoryStats,
  updateCategory
} from '../controllers/categoryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', getAllCategories);

/**
 * @route   GET /api/categories/stats
 * @desc    Get category statistics
 * @access  Public
 */
router.get('/stats', getCategoryStats);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (Authentication required)
 */
router.post('/', authenticateToken, createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Authentication required)
 */
router.put('/:id', authenticateToken, updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Authentication required)
 */
router.delete('/:id', authenticateToken, deleteCategory);

export default router;
