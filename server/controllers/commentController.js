import { logger } from '../middleware/logger.js';
import Comment from '../models/Comment.js';
import Document from '../models/Document.js';
import ActivityService from '../services/ActivityService.js';

/**
 * Create a new comment
 */
export const createComment = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { text, location, versionId } = req.body;

    // Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if user has permission to comment on this document
    if (!document.isPublished && document.userId.toString() !== req.user.dbUser._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to comment on this document'
      });
    }

    // Create the comment
    const comment = new Comment({
      documentId,
      userId: req.user.dbUser._id,
      text: text.trim(),
      location: location || null,
      versionId: versionId || null
    });

    await comment.save();

    // Add comment ID to document
    await Document.findByIdAndUpdate(
      documentId,
      { $push: { commentIds: comment._id } },
      { new: true }
    );

    // Log activity
    try {
      await ActivityService.logCommentAdded({
        userId: req.user.dbUser._id,
        commentId: comment._id,
        documentId: document._id,
        documentTitle: document.title,
        metadata: {
          textLength: text.trim().length,
          hasLocation: !!location,
          hasVersionId: !!versionId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (activityError) {
      logger.warn('Failed to log comment activity', {
        error: activityError.message,
        commentId: comment._id
      });
    }

    // Populate user data for response
    await comment.populate('userId', 'displayName email');

    logger.info('Comment created successfully', {
      commentId: comment._id,
      documentId,
      userId: req.user.dbUser._id
    });

    res.status(201).json({
      success: true,
      data: comment
    });

  } catch (error) {
    logger.error('Error creating comment', {
      error: error.message,
      documentId: req.params.documentId,
      userId: req.user?.dbUser?._id
    });
    next(error);
  }
  return null;
};

/**
 * Get comments for a document
 */
export const getDocumentComments = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { limit = 50, skip = 0, sortOrder = 'asc' } = req.query;

    // Check if document exists and user has access
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check permissions
    if (!document.isPublished && document.userId.toString() !== req.user.dbUser._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view comments for this document'
      });
    }

    // Get comments
    const comments = await Comment.find({ documentId })
      .populate('userId', 'displayName email')
      .sort({ createdAt: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Comment.countDocuments({ documentId });

    logger.info('Comments retrieved successfully', {
      documentId,
      count: comments.length,
      total,
      userId: req.user.dbUser._id
    });

    res.json({
      success: true,
      data: {
        comments,
        total,
        hasMore: parseInt(skip) + comments.length < total
      }
    });

  } catch (error) {
    logger.error('Error getting document comments', {
      error: error.message,
      documentId: req.params.documentId,
      userId: req.user?.dbUser?._id
    });
    next(error);
  }
  return null;
};

/**
 * Update a comment
 */
export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    // Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin
    if (comment.userId.toString() !== req.user.dbUser._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this comment'
      });
    }

    // Update the comment
    comment.text = text.trim();
    await comment.save();

    // Log activity
    try {
      // Get document info for activity logging
      const document = await Document.findById(comment.documentId);

      await ActivityService.logCommentUpdated({
        userId: req.user.dbUser._id,
        commentId: comment._id,
        documentId: comment.documentId,
        documentTitle: document?.title || 'Unknown Document',
        metadata: {
          textLength: text.trim().length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (activityError) {
      logger.warn('Failed to log comment update activity', {
        error: activityError.message,
        commentId: comment._id
      });
    }

    // Populate user data for response
    await comment.populate('userId', 'displayName email');

    logger.info('Comment updated successfully', {
      commentId,
      userId: req.user.dbUser._id
    });

    res.json({
      success: true,
      data: comment
    });

  } catch (error) {
    logger.error('Error updating comment', {
      error: error.message,
      commentId: req.params.commentId,
      userId: req.user?.dbUser?._id
    });
    next(error);
  }
  return null;
};

/**
 * Delete a comment
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin
    if (comment.userId.toString() !== req.user.dbUser._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    // Get document info for activity logging before deletion
    const document = await Document.findById(comment.documentId);

    // Remove comment from document
    await Document.findByIdAndUpdate(
      comment.documentId,
      { $pull: { commentIds: comment._id } }
    );

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Log activity
    try {
      await ActivityService.logCommentDeleted({
        userId: req.user.dbUser._id,
        commentId: comment._id,
        documentId: comment.documentId,
        documentTitle: document?.title || 'Unknown Document',
        metadata: {
          deletedTextLength: comment.text?.length || 0
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (activityError) {
      logger.warn('Failed to log comment deletion activity', {
        error: activityError.message,
        commentId: comment._id
      });
    }

    logger.info('Comment deleted successfully', {
      commentId,
      userId: req.user.dbUser._id
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting comment', {
      error: error.message,
      commentId: req.params.commentId,
      userId: req.user?.dbUser?._id
    });
    next(error);
  }
  return null;
};
