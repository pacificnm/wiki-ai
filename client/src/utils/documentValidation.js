import { z } from 'zod';

/**
 * Document validation schemas for client-side validation
 */

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),

  content: z
    .string()
    .optional()
    .default(''),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  categories: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'))
    .min(1, 'At least one category is required')
    .max(10, 'Maximum 10 categories allowed'),

  tags: z
    .array(z.string().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
    .default([]),

  isPublished: z
    .boolean()
    .optional()
    .default(false)
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),

  content: z
    .string()
    .optional(),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  categories: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'))
    .min(1, 'At least one category is required')
    .max(10, 'Maximum 10 categories allowed')
    .optional(),

  tags: z
    .array(z.string().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),

  isPublished: z
    .boolean()
    .optional()
});

/**
 * Validate document creation data
 * @param {Object} data - Document data to validate
 * @returns {Object} Validation result with success, data, and errors
 */
export const validateCreateDocument = (data) => {
  try {
    const validatedData = createDocumentSchema.parse(data);
    return {
      success: true,
      data: validatedData,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
};

/**
 * Validate document update data
 * @param {Object} data - Document data to validate
 * @returns {Object} Validation result with success, data, and errors
 */
export const validateUpdateDocument = (data) => {
  try {
    const validatedData = updateDocumentSchema.parse(data);
    return {
      success: true,
      data: validatedData,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: 'general', message: 'Validation failed' }]
    };
  }
};

/**
 * Validate individual fields
 */
export const validateTitle = (title) => {
  try {
    createDocumentSchema.shape.title.parse(title);
    return { isValid: true, error: null };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid title'
    };
  }
};

export const validateCategories = (categories) => {
  try {
    createDocumentSchema.shape.categories.parse(categories);
    return { isValid: true, error: null };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid categories'
    };
  }
};

export const validateTags = (tags) => {
  try {
    createDocumentSchema.shape.tags.parse(tags);
    return { isValid: true, error: null };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid tags'
    };
  }
};

const documentValidationUtils = {
  createDocumentSchema,
  updateDocumentSchema,
  validateCreateDocument,
  validateUpdateDocument,
  validateTitle,
  validateCategories,
  validateTags
};

export default documentValidationUtils;
