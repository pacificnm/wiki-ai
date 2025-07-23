import mongoose from 'mongoose';
import { logger } from '../middleware/logger.js';
import Category from '../models/Category.js';
import Document from '../models/Document.js';
import Version from '../models/Version.js';
import ActivityService from '../services/ActivityService.js';

/**
 * Get all documents with filtering, search, and pagination
 */
export const getAllDocuments = async (req, res, next) => {
  try {
    const {
      search,
      category,
      author,
      tags,
      isPublished,
      limit = 20,
      skip = 0,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // If user is not admin, only show their own documents or published documents
    if (req.user.role !== 'admin') {
      query.$or = [
        { userId: req.user.dbUser._id },
        { isPublished: true }
      ];
    }

    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category
    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        query.categoryIds = categoryDoc._id;
      }
    }

    // Filter by author (for admin users)
    if (author && req.user.role === 'admin') {
      const User = mongoose.model('User');
      const authorUser = await User.findOne({
        $or: [
          { email: author },
          { displayName: new RegExp(author, 'i') }
        ]
      });
      if (authorUser) {
        query.userId = authorUser._id;
      }
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Filter by published status
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const documents = await Document.find(query)
      .populate('userId', 'displayName email')
      .populate('categoryIds', 'name description')
      .populate('currentVersionId', 'content excerpt')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Get total count for pagination
    const total = await Document.countDocuments(query);

    // Transform documents for frontend
    const transformedDocuments = documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      description: doc.description,
      excerpt: doc.currentVersionId?.excerpt || doc.description || '',
      category: doc.categoryIds?.[0]?.name || 'Uncategorized',
      categories: doc.categoryIds?.map(cat => cat.name) || [],
      author: doc.userId?.displayName || doc.userId?.email || 'Unknown',
      authorId: doc.userId?._id,
      tags: doc.tags || [],
      autoTags: doc.autoTags || [],
      summary: doc.summary,
      isPublished: doc.isPublished,
      publishedAt: doc.publishedAt,
      viewCount: doc.viewCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      hasCurrentVersion: !!doc.currentVersionId
    }));

    logger.info('Documents fetched successfully', {
      userId: req.user.dbUser._id,
      userRole: req.user.role,
      count: documents.length,
      total,
      filters: { search, category, author, tags, isPublished }
    });

    res.json({
      success: true,
      data: {
        documents: transformedDocuments,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: parseInt(skip) + documents.length < total
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching documents', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Get a single document by ID
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id)
      .populate('userId', 'displayName email')
      .populate('categoryIds', 'name description color')
      .populate('currentVersionId')
      .populate({
        path: 'commentIds',
        populate: {
          path: 'userId',
          select: 'displayName email'
        }
      })
      .populate({
        path: 'versionHistory',
        populate: {
          path: 'createdBy',
          select: 'displayName email'
        }
      });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions - users can only view their own documents or published documents
    if (req.user.role !== 'admin' &&
      document.userId._id.toString() !== req.user.dbUser._id.toString() &&
      !document.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count
    await Document.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    // Log document view activity
    ActivityService.logDocumentViewed({
      userId: req.user.dbUser._id,
      documentId: document._id,
      title: document.title,
      metadata: {
        viewCount: (document.viewCount || 0) + 1,
        category: document.categoryIds?.[0]?.name
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Transform document for frontend
    const transformedDocument = {
      id: document._id,
      title: document.title,
      description: document.description,
      content: document.currentVersionId?.markdown || '',
      excerpt: document.currentVersionId?.excerpt || document.description || '',
      category: document.categoryIds?.[0]?.name || 'Uncategorized',
      categories: document.categoryIds?.map(cat => ({
        id: cat._id,
        name: cat.name,
        description: cat.description,
        color: cat.color
      })) || [],
      author: document.userId?.displayName || document.userId?.email || 'Unknown',
      authorId: document.userId?._id,
      tags: document.tags || [],
      autoTags: document.autoTags || [],
      summary: document.summary,
      isPublished: document.isPublished,
      publishedAt: document.publishedAt,
      viewCount: document.viewCount,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      comments: document.commentIds || [],
      attachments: document.attachmentPaths || [],
      versionHistory: document.versionHistory?.map(version => ({
        id: version._id,
        createdAt: version.createdAt,
        createdBy: {
          displayName: version.createdBy?.displayName,
          email: version.createdBy?.email
        },
        reason: version.reason,
        wordCount: version.wordCount,
        charCount: version.charCount,
        isMinor: version.isMinor
      })) || []
    };

    logger.info('Document fetched successfully', {
      documentId: id,
      userId: req.user.dbUser._id,
      viewCount: document.viewCount
    });

    res.json({
      success: true,
      data: transformedDocument
    });

  } catch (error) {
    logger.error('Error fetching document', {
      documentId: req.params.id,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Create a new document
 */
export const createDocument = async (req, res, next) => {
  try {
    const {
      title,
      description,
      content,
      tags,
      categories,
      isPublished = false
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Find or create categories
    let categoryIds = [];
    if (categories && categories.length > 0) {
      // Check if categories are IDs or names
      for (const categoryData of categories) {
        let category;

        // If it's an ObjectId string, find by ID
        if (typeof categoryData === 'string' && categoryData.match(/^[0-9a-fA-F]{24}$/)) {
          category = await Category.findById(categoryData);
        } else {
          // Otherwise treat as name and find or create
          const categoryName = typeof categoryData === 'string' ? categoryData : categoryData.name;
          category = await Category.findOne({ name: categoryName });
          if (!category) {
            category = new Category({
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              description: `Auto-created category: ${categoryName}`,
              icon: '📁',
              color: '#1976d2'
            });
            await category.save();
          }
        }

        if (category) {
          categoryIds.push(category._id);
        }
      }
    }

    // Create the document
    const document = new Document({
      userId: req.user.dbUser._id,
      title,
      description,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      categoryIds,
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? new Date() : null
    });

    await document.save();

    // Create initial version if content is provided
    if (content) {
      const version = new Version({
        documentId: document._id,
        createdBy: req.user.dbUser._id,
        markdown: content,
        reason: 'Initial version'
      });

      await version.save();

      // Update document with current version
      document.currentVersionId = version._id;
      document.versionHistory.push(version._id);
      await document.save();
    }

    // Populate the created document
    const populatedDocument = await Document.findById(document._id)
      .populate('userId', 'displayName email')
      .populate('categoryIds', 'name description color')
      .populate('currentVersionId');

    // Transform for frontend
    const transformedDocument = {
      id: populatedDocument._id,
      title: populatedDocument.title,
      description: populatedDocument.description,
      content: populatedDocument.currentVersionId?.markdown || '',
      excerpt: populatedDocument.description || populatedDocument.currentVersionId?.markdown?.substring(0, 200) + (populatedDocument.currentVersionId?.markdown?.length > 200 ? '...' : '') || '',
      category: populatedDocument.categoryIds?.[0]?.name || 'Uncategorized',
      categories: populatedDocument.categoryIds?.map(cat => ({
        id: cat._id,
        name: cat.name,
        description: cat.description,
        color: cat.color
      })) || [],
      author: populatedDocument.userId?.displayName || populatedDocument.userId?.email || 'Unknown',
      authorId: populatedDocument.userId?._id,
      tags: populatedDocument.tags || [],
      autoTags: populatedDocument.autoTags || [],
      summary: populatedDocument.summary,
      isPublished: populatedDocument.isPublished,
      publishedAt: populatedDocument.publishedAt,
      viewCount: populatedDocument.viewCount,
      createdAt: populatedDocument.createdAt,
      updatedAt: populatedDocument.updatedAt
    };

    logger.info('Document created successfully', {
      documentId: document._id,
      userId: req.user.dbUser._id,
      title,
      isPublished
    });

    // Log document creation activity
    ActivityService.logDocumentCreated({
      userId: req.user.dbUser._id,
      documentId: document._id,
      title,
      metadata: {
        isPublished,
        categoryCount: categoryIds.length,
        tagCount: (tags || []).length,
        hasContent: !!content
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: transformedDocument
    });

  } catch (error) {
    logger.error('Error creating document', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Update an existing document
 */
export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      content,
      tags,
      categories,
      isPublished
    } = req.body;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions - users can only edit their own documents
    if (req.user.role !== 'admin' && document.userId.toString() !== req.user.dbUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Handle categories if provided
    let categoryIds = document.categoryIds;
    if (categories && categories.length > 0) {
      categoryIds = [];
      // Check if categories are IDs or names
      for (const categoryData of categories) {
        let category;

        // If it's an ObjectId string, find by ID
        if (typeof categoryData === 'string' && categoryData.match(/^[0-9a-fA-F]{24}$/)) {
          category = await Category.findById(categoryData);
        } else {
          // Otherwise treat as name and find or create
          const categoryName = typeof categoryData === 'string' ? categoryData : categoryData.name;
          category = await Category.findOne({ name: categoryName });
          if (!category) {
            category = new Category({
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              description: `Auto-created category: ${categoryName}`,
              icon: '📁',
              color: '#1976d2'
            });
            await category.save();
          }
        }

        if (category) {
          categoryIds.push(category._id);
        }
      }
    }

    // Update document fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (tags !== undefined) updateFields.tags = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    if (categoryIds !== document.categoryIds) updateFields.categoryIds = categoryIds;
    if (isPublished !== undefined) {
      updateFields.isPublished = Boolean(isPublished);
      if (Boolean(isPublished) && !document.isPublished) {
        updateFields.publishedAt = new Date();
      }
    }

    // Update the document
    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate('userId', 'displayName email')
      .populate('categoryIds', 'name description color')
      .populate('currentVersionId');

    // Create new version if content is provided
    if (content !== undefined) {
      const version = new Version({
        documentId: id,
        createdBy: req.user.dbUser._id,
        markdown: content,
        reason: 'Content update'
      });

      await version.save();

      // Update document with new current version
      updatedDocument.currentVersionId = version._id;
      updatedDocument.versionHistory.push(version._id);
      await updatedDocument.save();

      // Re-populate with new version
      await updatedDocument.populate('currentVersionId');
    }

    // Transform for frontend
    const transformedDocument = {
      id: updatedDocument._id,
      title: updatedDocument.title,
      description: updatedDocument.description,
      content: updatedDocument.currentVersionId?.markdown || '',
      excerpt: updatedDocument.description || updatedDocument.currentVersionId?.markdown?.substring(0, 200) + (updatedDocument.currentVersionId?.markdown?.length > 200 ? '...' : '') || '',
      category: updatedDocument.categoryIds?.[0]?.name || 'Uncategorized',
      categories: updatedDocument.categoryIds?.map(cat => ({
        id: cat._id,
        name: cat.name,
        description: cat.description,
        color: cat.color
      })) || [],
      author: updatedDocument.userId?.displayName || updatedDocument.userId?.email || 'Unknown',
      authorId: updatedDocument.userId?._id,
      tags: updatedDocument.tags || [],
      autoTags: updatedDocument.autoTags || [],
      summary: updatedDocument.summary,
      isPublished: updatedDocument.isPublished,
      publishedAt: updatedDocument.publishedAt,
      viewCount: updatedDocument.viewCount,
      createdAt: updatedDocument.createdAt,
      updatedAt: updatedDocument.updatedAt
    };

    logger.info('Document updated successfully', {
      documentId: id,
      userId: req.user.dbUser._id,
      updatedFields: Object.keys(updateFields)
    });

    // Log document update activity
    ActivityService.logDocumentUpdated({
      userId: req.user.dbUser._id,
      documentId: id,
      title: updatedDocument.title,
      metadata: {
        updatedFields: Object.keys(updateFields),
        hasContentUpdate: content !== undefined,
        isPublished: updatedDocument.isPublished,
        categoryCount: updatedDocument.categoryIds?.length || 0
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Log publish/unpublish activity if status changed
    if (isPublished !== undefined && isPublished !== document.isPublished) {
      ActivityService.logDocumentPublished({
        userId: req.user.dbUser._id,
        documentId: id,
        title: updatedDocument.title,
        isPublished: Boolean(isPublished),
        metadata: {
          previousState: document.isPublished
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      data: transformedDocument
    });

  } catch (error) {
    logger.error('Error updating document', {
      documentId: req.params.id,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions - users can only delete their own documents
    if (req.user.role !== 'admin' && document.userId.toString() !== req.user.dbUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete associated versions
    if (document.versionHistory && document.versionHistory.length > 0) {
      await Version.deleteMany({ _id: { $in: document.versionHistory } });
    }

    // Delete the document
    await Document.findByIdAndDelete(id);

    logger.info('Document deleted successfully', {
      documentId: id,
      userId: req.user.dbUser._id,
      title: document.title
    });

    // Log document deletion activity
    ActivityService.logDocumentDeleted({
      userId: req.user.dbUser._id,
      documentId: id,
      title: document.title,
      metadata: {
        versionCount: document.versionHistory?.length || 0,
        wasPublished: document.isPublished,
        viewCount: document.viewCount || 0
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting document', {
      documentId: req.params.id,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};

/**
 * Get document statistics
 */
export const getDocumentStats = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.dbUser._id;
    const baseQuery = userId ? { userId } : {};

    const [
      totalDocuments,
      publishedDocuments,
      draftDocuments,
      totalViews,
      recentDocuments
    ] = await Promise.all([
      Document.countDocuments(baseQuery),
      Document.countDocuments({ ...baseQuery, isPublished: true }),
      Document.countDocuments({ ...baseQuery, isPublished: false }),
      Document.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
      ]),
      Document.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt viewCount')
        .lean()
    ]);

    const stats = {
      totalDocuments,
      publishedDocuments,
      draftDocuments,
      totalViews: totalViews[0]?.total || 0,
      recentDocuments: recentDocuments.map(doc => ({
        id: doc._id,
        title: doc.title,
        createdAt: doc.createdAt,
        viewCount: doc.viewCount
      }))
    };

    logger.info('Document stats fetched successfully', {
      userId: req.user.dbUser._id,
      userRole: req.user.role,
      stats
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching document stats', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    return next(error);
  }
};
