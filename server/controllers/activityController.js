import { logger } from '../middleware/logger.js';
import ActivityService from '../services/ActivityService.js';

/**
 * Get recent activities for the current user or globally
 */
export const getRecentActivities = async (req, res, next) => {
  try {
    const {
      limit = 10,
      global = 'false',
      types,
      since
    } = req.query;

    const userId = global === 'true' ? null : req.user.dbUser._id;
    const activityTypes = types ? types.split(',') : null;
    const sinceDate = since ? new Date(since) : null;

    const activities = await ActivityService.getActivities({
      userId,
      limit: parseInt(limit),
      type: activityTypes?.[0], // ActivityService.getActivities expects single type, not array
      skip: 0
    });

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      user: activity.userId?.displayName || activity.userId?.email || 'Unknown User',
      userId: activity.userId?._id,
      timestamp: activity.createdAt,
      entityType: activity.entityType,
      entityId: activity.entityId,
      metadata: activity.metadata
    }));

    logger.info('Recent activities fetched successfully', {
      requestUserId: req.user.dbUser._id,
      filterUserId: userId,
      activitiesCount: formattedActivities.length,
      global: global === 'true'
    });

    res.json({
      success: true,
      data: {
        activities: formattedActivities,
        total: formattedActivities.length
      }
    });

  } catch (error) {
    logger.error('Error fetching recent activities', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Get activity statistics
 */
export const getActivityStats = async (req, res, next) => {
  try {
    const {
      global = 'false',
      since
    } = req.query;

    const userId = global === 'true' ? null : req.user.dbUser._id;
    const sinceDate = since ? new Date(since) : null;

    const stats = await ActivityService.getActivityStats({
      userId,
      startDate: sinceDate
    });

    logger.info('Activity stats fetched successfully', {
      requestUserId: req.user.dbUser._id,
      filterUserId: userId,
      stats
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching activity stats', {
      userId: req.user?.dbUser?._id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};
