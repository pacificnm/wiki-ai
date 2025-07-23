import { logger } from '../middleware/logger.js';
import Activity from '../models/Activity.js';

/**
 * Activity tracking service
 */
class ActivityService {
  /**
   * Log a user activity
   * @param {Object} params - Activity parameters
   * @param {string} params.userId - User ID
   * @param {string} params.type - Activity type
   * @param {string} params.entityType - Entity type (optional)
   * @param {string} params.entityId - Entity ID (optional)
   * @param {string} params.title - Activity title
   * @param {string} params.description - Activity description (optional)
   * @param {Object} params.metadata - Additional metadata (optional)
   * @param {Object} params.req - Express request object (optional)
   */
  static async logActivity({
    userId,
    type,
    entityType = null,
    entityId = null,
    title,
    description = null,
    metadata = {},
    req = null
  }) {
    try {
      const activityData = {
        userId,
        type,
        title,
        description,
        metadata
      };

      // Add entity reference if provided
      if (entityType && entityId) {
        activityData.entityType = entityType;
        activityData.entityId = entityId;
      }

      // Add request metadata if available
      if (req) {
        activityData.ipAddress = req.ip || req.connection.remoteAddress;
        activityData.userAgent = req.get('User-Agent');
      }

      const activity = new Activity(activityData);
      await activity.save();

      logger.info('Activity logged', {
        userId,
        type,
        title,
        entityType,
        entityId
      });

      return activity;
    } catch (error) {
      logger.error('Error logging activity', {
        userId,
        type,
        title,
        error: error.message,
        stack: error.stack
      });
      // Don't throw error to prevent breaking main functionality
    }
  }

  /**
   * Get recent activities for a user or globally
   * @param {Object} options - Query options
   * @param {string} options.userId - User ID (optional, if not provided returns global activities)
   * @param {number} options.limit - Number of activities to return (default: 10)
   * @param {Array} options.types - Activity types to filter by (optional)
   * @param {Date} options.since - Only return activities since this date (optional)
   */
  static async getRecentActivities({
    userId = null,
    limit = 10,
    types = null,
    since = null
  } = {}) {
    try {
      const query = {};

      // Filter by user if provided
      if (userId) {
        query.userId = userId;
      }

      // Filter by activity types if provided
      if (types && types.length > 0) {
        query.type = { $in: types };
      }

      // Filter by date if provided
      if (since) {
        query.createdAt = { $gte: since };
      }

      const activities = await Activity.find(query)
        .populate('userId', 'displayName email')
        .populate('entityId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return activities;
    } catch (error) {
      logger.error('Error fetching recent activities', {
        userId,
        limit,
        types,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @param {Object} options - Query options
   * @param {string} options.userId - User ID (optional)
   * @param {Date} options.since - Only count activities since this date (optional)
   */
  static async getActivityStats({
    userId = null,
    since = null
  } = {}) {
    try {
      const matchQuery = {};

      if (userId) {
        matchQuery.userId = userId;
      }

      if (since) {
        matchQuery.createdAt = { $gte: since };
      }

      const stats = await Activity.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const totalActivities = await Activity.countDocuments(matchQuery);

      return {
        totalActivities,
        byType: stats
      };
    } catch (error) {
      logger.error('Error fetching activity stats', {
        userId,
        since,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

export default ActivityService;
