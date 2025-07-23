import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import favoriteService from '../services/favoriteService';
import { logger } from '../utils/logger';
import { useError } from './useError';

/**
 * Custom hook for managing user favorites
 * @returns {Object} Favorites state and functions
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalFavorites: 0, recentFavorites: [] });
  const { enqueueSnackbar } = useSnackbar();
  const { handleError } = useError();

  /**
   * Fetch all favorites from the API
   */
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const favoritesData = await favoriteService.getFavorites();
      setFavorites(favoritesData);

      logger.info('Favorites loaded successfully', {
        count: favoritesData.length
      });
    } catch (error) {
      handleError(error, 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Fetch favorite statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await favoriteService.getFavoriteStats();
      setStats(statsData);
    } catch (error) {
      handleError(error, 'Failed to load favorite statistics');
    }
  }, [handleError]);

  /**
   * Add a document to favorites
   * @param {string} documentId - Document ID to add
   * @param {Object} documentData - Optional document data for optimistic update
   */
  const addToFavorites = useCallback(async (documentId, documentData = null) => {
    try {
      // Optimistic update if document data is provided
      if (documentData) {
        const optimisticFavorite = {
          ...documentData,
          id: documentId,
          isFavorite: true,
          addedToFavorites: new Date().toISOString()
        };
        setFavorites(prev => [optimisticFavorite, ...prev]);
      }

      await favoriteService.addToFavorites(documentId);

      enqueueSnackbar('Document added to favorites', { variant: 'success' });

      // Refresh favorites and stats
      await Promise.all([fetchFavorites(), fetchStats()]);

    } catch (error) {
      // Revert optimistic update on error
      if (documentData) {
        setFavorites(prev => prev.filter(fav => fav.id !== documentId));
      }

      if (error.message.includes('already in favorites')) {
        enqueueSnackbar('Document is already in favorites', { variant: 'info' });
      } else {
        handleError(error, 'Failed to add document to favorites');
      }
    }
  }, [enqueueSnackbar, handleError, fetchFavorites, fetchStats]);

  /**
   * Remove a document from favorites
   * @param {string} documentId - Document ID to remove
   */
  const removeFromFavorites = useCallback(async (documentId) => {
    // Store original favorites for potential revert
    const originalFavorites = favorites;

    try {
      // Optimistic update
      setFavorites(prev => prev.filter(fav => fav.id !== documentId));

      await favoriteService.removeFromFavorites(documentId);

      enqueueSnackbar('Document removed from favorites', { variant: 'success' });

      // Refresh stats
      await fetchStats();

    } catch (error) {
      // Revert optimistic update on error
      setFavorites(originalFavorites);

      if (error.message.includes('not found')) {
        enqueueSnackbar('Document was not in favorites', { variant: 'info' });
      } else {
        handleError(error, 'Failed to remove document from favorites');
      }
    }
  }, [favorites, enqueueSnackbar, handleError, fetchStats]);  /**
   * Toggle favorite status of a document
   * @param {string} documentId - Document ID to toggle
   * @param {Object} documentData - Optional document data for optimistic update
   */
  const toggleFavorite = useCallback(async (documentId, documentData = null) => {
    const isFavorited = favorites.some(fav => fav.id === documentId);

    if (isFavorited) {
      await removeFromFavorites(documentId);
    } else {
      await addToFavorites(documentId, documentData);
    }
  }, [favorites, addToFavorites, removeFromFavorites]);

  /**
   * Check if a document is favorited
   * @param {string} documentId - Document ID to check
   * @returns {boolean} Whether the document is favorited
   */
  const isFavorited = useCallback((documentId) => {
    return favorites.some(fav => fav.id === documentId);
  }, [favorites]);

  /**
   * Get favorite by document ID
   * @param {string} documentId - Document ID
   * @returns {Object|null} Favorite object or null
   */
  const getFavorite = useCallback((documentId) => {
    return favorites.find(fav => fav.id === documentId) || null;
  }, [favorites]);

  // Load favorites and stats on mount
  useEffect(() => {
    fetchFavorites();
    fetchStats();
  }, [fetchFavorites, fetchStats]);

  return {
    favorites,
    loading,
    stats,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    getFavorite,
    refreshFavorites: fetchFavorites,
    refreshStats: fetchStats
  };
};
