import { logger } from '../middleware/logger.js';
import Activity from '../models/Activity.js';

/**
 * Activity Service for logging user activities and system events
 */
class ActivityService {
  /**
   * Log a user activity
   * @param {Object} params - Activity parameters
   * @param {string} params.userId - User ID who performed the action
   * @param {string} params.type - Type of activity (from Activity model enum)
   * @param {string} [params.entityType] - Type of entity involved (Document, Comment, etc.)
   * @param {string} [params.entityId] - ID of the entity involved
   * @param {string} [params.title] - Title/summary of the activity
   * @param {string} [params.description] - Detailed description
   * @param {Object} [params.metadata] - Additional metadata
   * @param {string} [params.ipAddress] - User's IP address
   * @param {string} [params.userAgent] - User's browser/client info
   * @returns {Promise<Activity>} Created activity record
   */
  static async logActivity({
    userId,
    type,
    entityType,
    entityId,
    title,
    description,
    metadata = {},
    ipAddress,
    userAgent
  }) {
    try {
      const activity = new Activity({
        userId,
        type,
        entityType,
        entityId,
        title,
        description,
        metadata,
        ipAddress,
        userAgent
      });

      await activity.save();

      logger.info('Activity logged successfully', {
        userId,
        type,
        entityType,
        entityId,
        title
      });

      return activity;
    } catch (error) {
      logger.error('Failed to log activity', {
        error: error.message,
        userId,
        type,
        entityType,
        entityId
      });
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  /**
   * Log document creation activity
   * @param {Object} params - Parameters
   * @param {string} params.userId - User ID
   * @param {string} params.documentId - Document ID
   * @param {string} params.title - Document title
   * @param {Object} [params.metadata] - Additional metadata
   * @param {string} [params.ipAddress] - IP address
   * @param {string} [params.userAgent] - User agent
   */
  static async logDocumentCreated({ userId, documentId, title, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'document_created',
      entityType: 'Document',
      entityId: documentId,
      title: `Created document: ${title}`,
      description: `Created a new document titled "${title}"`,
      metadata,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log document update activity
   * @param {Object} params - Parameters
   */
  static async logDocumentUpdated({ userId, documentId, title, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'document_updated',
      entityType: 'Document',
      entityId: documentId,
      title: `Updated document: ${title}`,
      description: `Updated the document titled "${title}"`,
      metadata,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log document deletion activity
   * @param {Object} params - Parameters
   */
  static async logDocumentDeleted({ userId, documentId, title, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'document_deleted',
      entityType: 'Document',
      entityId: documentId,
      title: `Deleted document: ${title}`,
      description: `Deleted the document titled "${title}"`,
      metadata,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log document published/unpublished activity
   * @param {Object} params - Parameters
   */
  static async logDocumentPublished({ userId, documentId, title, isPublished, metadata, ipAddress, userAgent }) {
    const action = isPublished ? 'Published' : 'Unpublished';
    return this.logActivity({
      userId,
      type: 'document_published',
      entityType: 'Document',
      entityId: documentId,
      title: `${action} document: ${title}`,
      description: `${action} the document titled "${title}"`,
      metadata: { ...metadata, isPublished },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log document view activity
   * @param {Object} params - Parameters
   */
  static async logDocumentViewed({ userId, documentId, title, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'document_viewed',
      entityType: 'Document',
      entityId: documentId,
      title: `Viewed document: ${title}`,
      description: `Viewed the document titled "${title}"`,
      metadata,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log favorite added activity
   * @param {Object} params - Parameters
   */
  static async logFavoriteAdded({ userId, documentId, title, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'favorite_added',
      entityType: 'Document',
      entityId: documentId,
      title: `Added favorite: ${title}`,
      description: `Added "${title}" to favorites`,
      metadata,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log favorite removed activity
   * @param {Object} params - Parameters
   */
  static async logFavoriteRemoved({ userId, documentId, title, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'favorite_removed',
      entityType: 'Document',
      entityId: documentId,
      title: `Removed favorite: ${title}`,
      description: `Removed "${title}" from favorites`,
      metadata,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log comment added activity
   * @param {Object} params - Parameters
   */
  static async logCommentAdded({ userId, commentId, documentId, documentTitle, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'comment_added',
      entityType: 'Comment',
      entityId: commentId,
      title: `Commented on: ${documentTitle}`,
      description: `Added a comment to "${documentTitle}"`,
      metadata: { ...metadata, documentId },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log comment updated activity
   * @param {Object} params - Parameters
   */
  static async logCommentUpdated({ userId, commentId, documentId, documentTitle, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'comment_updated',
      entityType: 'Comment',
      entityId: commentId,
      title: `Updated comment on: ${documentTitle}`,
      description: `Updated a comment on "${documentTitle}"`,
      metadata: { ...metadata, documentId },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log comment deleted activity
   * @param {Object} params - Parameters
   */
  static async logCommentDeleted({ userId, commentId, documentId, documentTitle, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'comment_deleted',
      entityType: 'Comment',
      entityId: commentId,
      title: `Deleted comment on: ${documentTitle}`,
      description: `Deleted a comment from "${documentTitle}"`,
      metadata: { ...metadata, documentId },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log category creation activity
   * @param {Object} params - Parameters
   */
  static async logCategoryCreated({ userId, categoryId, name, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'category_created',
      entityType: 'Category',
      entityId: categoryId,
      title: `Created category: ${name}`,
      description: `Created a new category named "${name}"`,
      metadata,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log category update activity
   * @param {Object} params - Parameters
   */
  static async logCategoryUpdated({ userId, categoryId, name, metadata, ipAddress, userAgent }) {
    return this.logActivity({
      userId,
      type: 'category_updated',
      entityType: 'Category',
      entityId: categoryId,
      title: `Updated category: ${name}`,
      description: `Updated the category named "${name}"`,
      metadata,
      ipAddress,
      userAgent
    });
  }

  /**
   * Get user activities with pagination
   * @param {Object} params - Query parameters
   * @param {string} [params.userId] - Filter by user ID
   * @param {string} [params.type] - Filter by activity type
   * @param {string} [params.entityType] - Filter by entity type
   * @param {number} [params.limit=50] - Number of records to return
   * @param {number} [params.skip=0] - Number of records to skip
   * @returns {Promise<Array>} Array of activities
   */
  static async getActivities({ userId, type, entityType, limit = 50, skip = 0 } = {}) {
    try {
      const query = {};
      if (userId) query.userId = userId;
      if (type) query.type = type;
      if (entityType) query.entityType = entityType;

      const activities = await Activity.find(query)
        .populate('userId', 'displayName email')
        .populate('entityId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return activities;
    } catch (error) {
      logger.error('Failed to fetch activities', { error: error.message });
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @param {Object} params - Query parameters
   * @param {string} [params.userId] - Filter by user ID
   * @param {Date} [params.startDate] - Start date for stats
   * @param {Date} [params.endDate] - End date for stats
   * @returns {Promise<Object>} Activity statistics
   */
  static async getActivityStats({ userId, startDate, endDate } = {}) {
    try {
      const matchStage = {};
      if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      const stats = await Activity.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});
    } catch (error) {
      logger.error('Failed to fetch activity stats', { error: error.message });
      throw error;
    }
  }
}

export default ActivityService;
