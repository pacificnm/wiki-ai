import { logger } from '../utils/logger';

/**
 * Service for handling favorite-related API calls
 */
class FavoriteService {
  constructor() {
    this.baseURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  }

  /**
   * Get authorization headers with Firebase token
   * @private
   */
  async _getAuthHeaders() {
    try {
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const token = await currentUser.getIdToken();

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    } catch (error) {
      logger.error('Error getting auth headers', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all favorites for the current user
   * @returns {Promise<Array>} Array of favorite documents
   */
  async getFavorites() {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/favorites`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch favorites');
      }

      logger.info('Favorites fetched successfully', {
        count: data.data?.favorites?.length || 0
      });

      return data.data.favorites || [];
    } catch (error) {
      logger.error('Error fetching favorites', { error: error.message });
      throw error;
    }
  }

  /**
   * Add a document to favorites
   * @param {string} documentId - Document ID to add to favorites
   * @returns {Promise<Object>} Response data
   */
  async addToFavorites(documentId) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/favorites/${documentId}`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Document is already in favorites');
        }
        throw new Error(`Failed to add to favorites: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to add to favorites');
      }

      logger.info('Document added to favorites', { documentId });

      return data.data;
    } catch (error) {
      logger.error('Error adding to favorites', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Remove a document from favorites
   * @param {string} documentId - Document ID to remove from favorites
   * @returns {Promise<Object>} Response data
   */
  async removeFromFavorites(documentId) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/favorites/${documentId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Favorite not found');
        }
        throw new Error(`Failed to remove from favorites: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to remove from favorites');
      }

      logger.info('Document removed from favorites', { documentId });

      return data;
    } catch (error) {
      logger.error('Error removing from favorites', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if a document is favorited by the user
   * @param {string} documentId - Document ID to check
   * @returns {Promise<Object>} Favorite status
   */
  async checkFavoriteStatus(documentId) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/favorites/${documentId}/status`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to check favorite status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to check favorite status');
      }

      return data.data;
    } catch (error) {
      logger.error('Error checking favorite status', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get favorite statistics for the current user
   * @returns {Promise<Object>} Favorite statistics
   */
  async getFavoriteStats() {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/favorites/stats`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch favorite stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch favorite stats');
      }

      logger.info('Favorite stats fetched successfully', {
        stats: data.data
      });

      return data.data;
    } catch (error) {
      logger.error('Error fetching favorite stats', { error: error.message });
      throw error;
    }
  }
}

const favoriteService = new FavoriteService();
export default favoriteService;
