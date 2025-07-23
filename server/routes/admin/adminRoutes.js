import express from 'express';
import {
  deleteUser,
  getAllUsers,
  getUserById,
  getUserStats,
  toggleUserStatus,
  updateUser,
  updateUserRole
} from '../../controllers/adminController.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Handle preflight requests for all admin routes
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

/**
 * @route GET /api/admin/users
 * @desc Get all users with filtering and pagination (Admin only)
 * @access Private (Admin)
 */
router.get('/users', authenticateToken, getAllUsers);

/**
 * @route GET /api/admin/users/stats
 * @desc Get user statistics (Admin only)
 * @access Private (Admin)
 */
router.get('/users/stats', authenticateToken, getUserStats);

/**
 * @route GET /api/admin/users/:id
 * @desc Get a single user by ID (Admin only)
 * @access Private (Admin)
 */
router.get('/users/:id', authenticateToken, getUserById);

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user (Admin only)
 * @access Private (Admin)
 */
router.put('/users/:id', authenticateToken, updateUser);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete user (Admin only)
 * @access Private (Admin)
 */
router.delete('/users/:id', authenticateToken, deleteUser);

/**
 * @route PATCH /api/admin/users/:id/status
 * @desc Toggle user status (Admin only)
 * @access Private (Admin)
 */
router.patch('/users/:id/status', authenticateToken, toggleUserStatus);

/**
 * @route PATCH /api/admin/users/:id/role
 * @desc Update user role (Admin only)
 * @access Private (Admin)
 */
router.patch('/users/:id/role', authenticateToken, updateUserRole);

export default router;
