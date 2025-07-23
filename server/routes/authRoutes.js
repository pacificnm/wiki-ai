import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../middleware/logger.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @access Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware and includes dbUser
    if (!req.user || !req.user.dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        id: req.user.dbUser._id,
        firebaseUid: req.user.dbUser.firebaseUid,
        email: req.user.dbUser.email,
        displayName: req.user.dbUser.displayName,
        role: req.user.dbUser.role,
        profileImage: req.user.dbUser.profileImage,
        createdAt: req.user.dbUser.createdAt,
        lastLogin: req.user.dbUser.lastLogin
      }
    });
  } catch (error) {
    logger.error('Error fetching user profile', { error: error.message, userId: req.user?.uid });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

/**
 * Register new user
 * @route POST /api/auth/register
 * @access Private (requires Firebase token)
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    // User is already created by authenticateToken middleware if needed
    // This endpoint now just returns the user data
    if (!req.user || !req.user.dbUser) {
      return res.status(400).json({
        success: false,
        message: 'User authentication failed'
      });
    }

    return res.json({
      success: true,
      data: {
        id: req.user.dbUser._id,
        firebaseUid: req.user.dbUser.firebaseUid,
        email: req.user.dbUser.email,
        displayName: req.user.dbUser.displayName,
        role: req.user.dbUser.role,
        profileImage: req.user.dbUser.profileImage,
        createdAt: req.user.dbUser.createdAt,
        lastLogin: req.user.dbUser.lastLogin
      },
      message: req.user.dbUser.createdAt.getTime() === req.user.dbUser.lastLogin.getTime()
        ? 'User registered successfully'
        : 'User already exists'
    });
  } catch (error) {
    logger.error('Error in register endpoint', { error: error.message, userId: req.user?.uid });
    return res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.firebaseUid;
    delete updates.id;
    delete updates._id;
    delete updates.createdAt;
    delete updates.lastLogin;

    // Update user in database
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info('User profile updated', { userId: req.user.uid, updates: Object.keys(updates) });

    res.json({
      success: true,
      data: {
        id: updatedUser._id,
        firebaseUid: updatedUser.firebaseUid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Error updating user profile', { error: error.message, userId: req.user?.uid });
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

export default router;
