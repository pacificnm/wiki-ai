import express from 'express';
import { createUser, getUserById, updateUser } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../middleware/logger.js';

const router = express.Router();

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @access Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware
    const user = await getUserById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error fetching user profile', { error: error.message, userId: req.user?.uid });
    res.status(500).json({
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
    const { firebaseUid, email, displayName, profileImage } = req.body;

    // Verify the Firebase UID matches the token
    if (firebaseUid !== req.user.uid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID mismatch'
      });
    }

    // Check if user already exists
    const existingUser = await getUserById(firebaseUid);
    if (existingUser) {
      return res.json({
        success: true,
        data: existingUser,
        message: 'User already exists'
      });
    }

    // Create new user
    const newUser = await createUser({
      firebaseUid,
      email,
      displayName: displayName || email,
      profileImage,
      role: 'user'
    });

    logger.info('New user registered', { userId: newUser.id, email });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User registered successfully'
    });
  } catch (error) {
    logger.error('Error registering user', { error: error.message, body: req.body });
    res.status(500).json({
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
    delete updates.createdAt;

    const updatedUser = await updateUser(req.user.uid, updates);

    logger.info('User profile updated', { userId: req.user.uid });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Error updating user profile', { error: error.message, userId: req.user?.uid });
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

export default router;
