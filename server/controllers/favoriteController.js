import { logger } from '../middleware/logger.js';
import Document from '../models/Document.js';
import Favorite from '../models/Favorite.js';
import ActivityService from '../services/ActivityService.js';

/**
 * Get all favorites for the current user
 */
export const getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.user.dbUser._id;

    const favorites = await Favorite.find({ userId })
      .populate({
        path: 'documentId',
        select: 'title description tags userId categoryIds viewCount createdAt updatedAt isPublished',
        populate: [
          {
            path: 'userId',
            select: 'displayName email'
          },
          {
            path: 'categoryIds',
            select: 'name'
          }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out favorites where the document no longer exists
    const validFavorites = favorites.filter(fav => fav.documentId);

    // Transform the data to match the expected format
    const formattedFavorites = validFavorites.map(fav => ({
      id: fav.documentId._id,
      title: fav.documentId.title,
      description: fav.documentId.description,
      excerpt: fav.documentId.description, // alias for compatibility
      category: fav.documentId.categoryIds?.[0]?.name || 'Uncategorized',
      author: fav.documentId.userId?.displayName || fav.documentId.userId?.email || 'Unknown',
      updatedAt: fav.documentId.updatedAt,
      tags: fav.documentId.tags || [],
      isFavorite: true,
      addedToFavorites: fav.createdAt,
      viewCount: fav.documentId.viewCount || 0,
      isPublished: fav.documentId.isPublished
    }));

    logger.info('User favorites fetched successfully', {
      userId,
      favoritesCount: formattedFavorites.length
    });

    res.json({
      success: true,
      data: {
        favorites: formattedFavorites,
        total: formattedFavorites.length
      }
    });

  } catch (error) {
    logger.error('Error fetching user favorites', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Add a document to user's favorites
 */
export const addToFavorites = async (req, res, next) => {
  try {
    const userId = req.user.dbUser._id;
    const { documentId } = req.params;

    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, documentId });
    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: 'Document is already in favorites'
      });
    }

    // Create favorite
    const favorite = new Favorite({ userId, documentId });
    await favorite.save();

    // Log activity
    await ActivityService.logFavoriteAdded({
      userId,
      documentId,
      title: document.title,
      metadata: {
        documentTitle: document.title,
        categoryId: document.categoryIds?.[0]
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }).catch(err => {
      logger.error('Failed to log favorite added activity', {
        userId,
        documentId,
        error: err.message
      });
    });

    logger.info('Document added to favorites', {
      userId,
      documentId,
      documentTitle: document.title
    });

    res.status(201).json({
      success: true,
      message: 'Document added to favorites',
      data: {
        favoriteId: favorite._id,
        addedAt: favorite.createdAt
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error (race condition)
      return res.status(409).json({
        success: false,
        message: 'Document is already in favorites'
      });
    }

    logger.error('Error adding document to favorites', {
      userId: req.user?.id,
      documentId: req.params?.documentId,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Remove a document from user's favorites
 */
export const removeFromFavorites = async (req, res, next) => {
  try {
    const userId = req.user.dbUser._id;
    const { documentId } = req.params;

    // Get document info before deletion for activity logging
    const document = await Document.findById(documentId);

    const result = await Favorite.findOneAndDelete({ userId, documentId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Log activity if document exists
    if (document) {
      await ActivityService.logFavoriteRemoved({
        userId,
        documentId,
        title: document.title,
        metadata: {
          documentTitle: document.title,
          categoryId: document.categoryIds?.[0]
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }).catch(err => {
        logger.error('Failed to log favorite removed activity', {
          userId,
          documentId,
          error: err.message
        });
      });
    }

    logger.info('Document removed from favorites', {
      userId,
      documentId
    });

    res.json({
      success: true,
      message: 'Document removed from favorites'
    });

  } catch (error) {
    logger.error('Error removing document from favorites', {
      userId: req.user?.id,
      documentId: req.params?.documentId,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Check if a document is favorited by the user
 */
export const checkFavoriteStatus = async (req, res, next) => {
  try {
    const userId = req.user.dbUser._id;
    const { documentId } = req.params;

    const favorite = await Favorite.findOne({ userId, documentId });

    res.json({
      success: true,
      data: {
        isFavorite: !!favorite,
        addedAt: favorite?.createdAt || null
      }
    });

  } catch (error) {
    logger.error('Error checking favorite status', {
      userId: req.user?.id,
      documentId: req.params?.documentId,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Get user's favorite statistics
 */
export const getFavoriteStats = async (req, res, next) => {
  try {
    const userId = req.user.dbUser._id;

    const totalFavorites = await Favorite.countDocuments({ userId });

    // Get recent favorites
    const recentFavorites = await Favorite.find({ userId })
      .populate('documentId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const stats = {
      totalFavorites,
      recentFavorites: recentFavorites
        .filter(fav => fav.documentId) // Filter out deleted documents
        .map(fav => ({
          documentId: fav.documentId._id,
          title: fav.documentId.title,
          addedAt: fav.createdAt
        }))
    };

    logger.info('Favorite stats fetched successfully', {
      userId,
      stats
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching favorite stats', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};
