import { z } from 'zod';

/**
 * Schema for category creation
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  parentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema for category updates
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  parentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID')
    .optional()
    .or(z.literal(''))
    .or(z.null())
});

/**
 * Validate category creation data
 * @param {Object} data - Category data to validate
 * @returns {Object} Validated data
 * @throws {z.ZodError} Validation error
 */
export const validateCreateCategory = (data) => {
  return createCategorySchema.parse(data);
};

/**
 * Validate category update data
 * @param {Object} data - Category update data to validate
 * @returns {Object} Validated data
 * @throws {z.ZodError} Validation error
 */
export const validateUpdateCategory = (data) => {
  return updateCategorySchema.parse(data);
};
