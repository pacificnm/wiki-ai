import { AppError } from '../middleware/error.js';
import Category from '../models/Category.js';
import Document from '../models/Document.js';

/**
 * Get all categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('parentId', 'name slug')
      .sort({ name: 1 });

    // Get document count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const documentCount = await Document.countDocuments({ categoryIds: category._id });
        return {
          ...category.toJSON(),
          documentCount
        };
      })
    );

    res.status(200).json({
      success: true,
      categories: categoriesWithCounts,
      count: categoriesWithCounts.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('parentId', 'name slug');

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Get document count for this category
    const documentCount = await Document.countDocuments({ categoryIds: id });

    res.status(200).json({
      success: true,
      category: {
        ...category.toJSON(),
        documentCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;

    if (!name) {
      return next(new AppError('Category name is required', 400));
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return next(new AppError('Category with this name already exists', 409));
    }

    // Calculate path and depth if parent is specified
    let path = [slug];
    let depth = 0;

    if (parentId) {
      const parent = await Category.findById(parentId);
      if (!parent) {
        return next(new AppError('Parent category not found', 404));
      }
      path = [...parent.path, slug];
      depth = parent.depth + 1;
    }

    const category = new Category({
      name,
      slug,
      description,
      parentId: parentId || null,
      path,
      depth
    });

    await category.save();

    res.status(201).json({
      success: true,
      category: {
        ...category.toJSON(),
        documentCount: 0
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Category with this name already exists', 409));
    }
    next(error);
  }
};

/**
 * Update category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, parentId } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Update basic fields
    if (name && name !== category.name) {
      const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Check if new slug already exists (excluding current category)
      const existingCategory = await Category.findOne({
        slug: newSlug,
        _id: { $ne: id }
      });
      if (existingCategory) {
        return next(new AppError('Category with this name already exists', 409));
      }

      category.name = name;
      category.slug = newSlug;

      // Update path
      if (category.parentId) {
        const parent = await Category.findById(category.parentId);
        category.path = [...parent.path, newSlug];
      } else {
        category.path = [newSlug];
      }

      // Update paths of all child categories
      await updateChildrenPaths(category._id, category.path);
    }

    if (description !== undefined) {
      category.description = description;
    }

    // Handle parent change
    if (parentId !== undefined && parentId !== category.parentId?.toString()) {
      if (parentId) {
        const parent = await Category.findById(parentId);
        if (!parent) {
          return next(new AppError('Parent category not found', 404));
        }

        // Check for circular dependency
        if (parent.path.includes(category.slug)) {
          return next(new AppError('Cannot set parent to a child category', 400));
        }

        category.parentId = parentId;
        category.depth = parent.depth + 1;
        category.path = [...parent.path, category.slug];
      } else {
        category.parentId = null;
        category.depth = 0;
        category.path = [category.slug];
      }

      // Update paths of all child categories
      await updateChildrenPaths(category._id, category.path);
    }

    await category.save();

    // Get document count
    const documentCount = await Document.countDocuments({ categoryIds: id });

    res.status(200).json({
      success: true,
      category: {
        ...category.toJSON(),
        documentCount
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Category with this name already exists', 409));
    }
    next(error);
  }
};

/**
 * Delete category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Check if category has documents
    const documentCount = await Document.countDocuments({ categoryIds: id });
    if (documentCount > 0) {
      return next(new AppError('Cannot delete category with documents. Move documents first.', 400));
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parentId: id });
    if (childrenCount > 0) {
      return next(new AppError('Cannot delete category with subcategories. Delete subcategories first.', 400));
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getCategoryStats = async (req, res, next) => {
  try {
    const totalCategories = await Category.countDocuments();
    const totalDocuments = await Document.countDocuments();

    // Get categories with document counts
    const categoryStats = await Category.aggregate([
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'categoryIds',
          as: 'documents'
        }
      },
      {
        $project: {
          name: 1,
          documentCount: { $size: '$documents' }
        }
      },
      {
        $sort: { documentCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      totalCategories,
      totalDocuments,
      topCategories: categoryStats,
      averageDocumentsPerCategory: totalCategories > 0 ? Math.round(totalDocuments / totalCategories) : 0
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to update paths of all child categories
 * @param {string} parentId - Parent category ID
 * @param {Array} newParentPath - New parent path
 */
async function updateChildrenPaths(parentId, newParentPath) {
  const children = await Category.find({ parentId });

  for (const child of children) {
    child.path = [...newParentPath, child.slug];
    await child.save();

    // Recursively update grandchildren
    await updateChildrenPaths(child._id, child.path);
  }
}
