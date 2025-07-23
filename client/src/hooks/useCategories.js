import { useCallback, useEffect, useState } from 'react';
import categoryService from '../services/categoryService.js';
import { useError } from './useError.js';

/**
 * Custom hook for managing categories
 * @returns {Object} Categories state and operations
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { handleError } = useError();

  /**
   * Fetch all categories
   */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedCategories = await categoryService.getAllCategories();
      // Ensure we have an array
      setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
    } catch (error) {
      handleError(error, 'Failed to fetch categories');
      // Set empty array on error
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Fetch category statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const categoryStats = await categoryService.getCategoryStats();
      setStats(categoryStats);
    } catch (error) {
      handleError(error, 'Failed to fetch category statistics');
    }
  }, [handleError]);

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   */
  const createCategory = useCallback(async (categoryData) => {
    try {
      const newCategory = await categoryService.createCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      await fetchStats(); // Refresh stats after creation
      return newCategory;
    } catch (error) {
      handleError(error, 'Failed to create category');
      throw error;
    }
  }, [handleError, fetchStats]);

  /**
   * Update a category
   * @param {string} id - Category ID
   * @param {Object} categoryData - Updated category data
   */
  const updateCategory = useCallback(async (id, categoryData) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, categoryData);
      setCategories(prev =>
        prev.map(cat => cat._id === id ? updatedCategory : cat)
      );
      await fetchStats(); // Refresh stats after update
      return updatedCategory;
    } catch (error) {
      handleError(error, 'Failed to update category');
      throw error;
    }
  }, [handleError, fetchStats]);

  /**
   * Delete a category
   * @param {string} id - Category ID
   */
  const deleteCategory = useCallback(async (id) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat._id !== id));
      await fetchStats(); // Refresh stats after deletion
    } catch (error) {
      handleError(error, 'Failed to delete category');
      throw error;
    }
  }, [handleError, fetchStats]);

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @returns {Object|null} Category object or null
   */
  const getCategoryById = useCallback((id) => {
    return categories.find(cat => cat._id === id) || null;
  }, [categories]);

  /**
   * Get categories by parent ID
   * @param {string|null} parentId - Parent category ID
   * @returns {Array} Array of child categories
   */
  const getCategoriesByParent = useCallback((parentId = null) => {
    return categories.filter(cat => cat.parentId === parentId);
  }, [categories]);

  /**
   * Get root categories (categories without parent)
   * @returns {Array} Array of root categories
   */
  const getRootCategories = useCallback(() => {
    return categories.filter(cat => !cat.parentId);
  }, [categories]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  return {
    categories,
    loading,
    stats,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByParent,
    getRootCategories,
    refresh: fetchCategories
  };
}