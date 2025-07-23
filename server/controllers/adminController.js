import { logger } from '../middleware/logger.js';
import Document from '../models/Document.js';
import User from '../models/User.js';

/**
 * Get all users with filtering, search, and pagination (Admin only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const {
      search,
      role,
      status,
      limit = 20,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Build query
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { displayName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const users = await User.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v')
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get document counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const documentsCreated = await Document.countDocuments({ userId: user._id });

        return {
          id: user._id,
          firebaseUid: user.firebaseUid,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
          profileImage: user.profileImage,
          department: user.department || 'Not specified',
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          documentsCreated,
          lastActive: user.lastLogin ? user.lastLogin.toISOString() : null,
          joinDate: user.createdAt.toISOString().split('T')[0]
        };
      })
    );

    logger.info('Users fetched successfully by admin', {
      adminId: req.user.id,
      count: users.length,
      total,
      filters: { search, role, status }
    });

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: parseInt(skip) + users.length < total
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching users', {
      adminId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Get a single user by ID (Admin only)
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const user = await User.findById(id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional user statistics
    const documentsCreated = await Document.countDocuments({ userId: id });

    const userWithStats = {
      id: user._id,
      firebaseUid: user.firebaseUid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      profileImage: user.profileImage,
      department: user.department || 'Not specified',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      documentsCreated,
      lastActive: user.lastLogin ? user.lastLogin.toISOString() : null,
      joinDate: user.createdAt.toISOString().split('T')[0]
    };

    logger.info('User fetched successfully by admin', {
      adminId: req.user.id,
      userId: id
    });

    res.json({
      success: true,
      data: userWithStats
    });

  } catch (error) {
    logger.error('Error fetching user', {
      adminId: req.user?.id,
      userId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Prevent updating sensitive fields
    delete updateData.firebaseUid;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.lastLogin;

    // Validate role if provided
    if (updateData.role && !['admin', 'user'].includes(updateData.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or user.'
      });
    }

    // Validate status if provided
    if (updateData.status && !['active', 'inactive'].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active or inactive.'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get document count
    const documentsCreated = await Document.countDocuments({ userId: id });

    const userWithStats = {
      id: updatedUser._id,
      firebaseUid: updatedUser.firebaseUid,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status || 'active',
      profileImage: updatedUser.profileImage,
      department: updatedUser.department || 'Not specified',
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      documentsCreated,
      lastActive: updatedUser.lastLogin ? updatedUser.lastLogin.toISOString() : null,
      joinDate: updatedUser.createdAt.toISOString().split('T')[0]
    };

    logger.info('User updated successfully by admin', {
      adminId: req.user.id,
      userId: id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: userWithStats
    });

  } catch (error) {
    logger.error('Error updating user', {
      adminId: req.user?.id,
      userId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Don't allow admin to delete themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has documents - we might want to handle this differently
    const documentCount = await Document.countDocuments({ userId: id });

    if (documentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${documentCount} documents. Please transfer or delete documents first.`
      });
    }

    await User.findByIdAndDelete(id);

    logger.info('User deleted successfully by admin', {
      adminId: req.user.id,
      userId: id,
      deletedUserEmail: user.email
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting user', {
      adminId: req.user?.id,
      userId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Toggle user status (Admin only)
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Validate status
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active or inactive.'
      });
    }

    // Don't allow admin to deactivate themselves
    if (id === req.user.id && status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get document count
    const documentsCreated = await Document.countDocuments({ userId: id });

    const userWithStats = {
      id: updatedUser._id,
      firebaseUid: updatedUser.firebaseUid,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      profileImage: updatedUser.profileImage,
      department: updatedUser.department || 'Not specified',
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      documentsCreated,
      lastActive: updatedUser.lastLogin ? updatedUser.lastLogin.toISOString() : null,
      joinDate: updatedUser.createdAt.toISOString().split('T')[0]
    };

    logger.info('User status updated successfully by admin', {
      adminId: req.user.id,
      userId: id,
      newStatus: status
    });

    res.json({
      success: true,
      data: userWithStats
    });

  } catch (error) {
    logger.error('Error updating user status', {
      adminId: req.user?.id,
      userId: req.params.id,
      status,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Validate role
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or user.'
      });
    }

    // Don't allow admin to demote themselves
    if (id === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get document count
    const documentsCreated = await Document.countDocuments({ userId: id });

    const userWithStats = {
      id: updatedUser._id,
      firebaseUid: updatedUser.firebaseUid,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status || 'active',
      profileImage: updatedUser.profileImage,
      department: updatedUser.department || 'Not specified',
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      documentsCreated,
      lastActive: updatedUser.lastLogin ? updatedUser.lastLogin.toISOString() : null,
      joinDate: updatedUser.createdAt.toISOString().split('T')[0]
    };

    logger.info('User role updated successfully by admin', {
      adminId: req.user.id,
      userId: id,
      newRole: role
    });

    res.json({
      success: true,
      data: userWithStats
    });

  } catch (error) {
    logger.error('Error updating user role', {
      adminId: req.user?.id,
      userId: req.params.id,
      role,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers,
      totalDocuments,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ $or: [{ status: 'active' }, { status: { $exists: false } }] }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' }),
      Document.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('displayName email createdAt')
        .lean()
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers,
      totalDocuments,
      averageDocumentsPerUser: totalUsers > 0 ? Math.round(totalDocuments / totalUsers) : 0,
      recentUsers: recentUsers.map(user => ({
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        joinDate: user.createdAt.toISOString().split('T')[0]
      }))
    };

    logger.info('User stats fetched successfully by admin', {
      adminId: req.user.id,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers
      }
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching user stats', {
      adminId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};
