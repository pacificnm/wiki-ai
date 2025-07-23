import { logger } from '../utils/logger';

/**
 * Service for handling activity-related API calls
 */
class ActivityService {
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
   * Get recent activities
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of activities to return (default: 10)
   * @param {boolean} options.global - Get global activities or user-specific (default: false)
   * @param {Array} options.types - Activity types to filter by
   * @param {Date} options.since - Only return activities since this date
   * @returns {Promise<Array>} Array of activities
   */
  async getRecentActivities({
    limit = 10,
    global = false,
    types = null,
    since = null
  } = {}) {
    try {
      const headers = await this._getAuthHeaders();

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('global', global.toString());

      if (types && types.length > 0) {
        queryParams.append('types', types.join(','));
      }

      if (since) {
        queryParams.append('since', since.toISOString());
      }

      const response = await fetch(`${this.baseURL}/api/activities?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch activities');
      }

      logger.info('Activities fetched successfully', {
        count: data.data?.activities?.length || 0
      });

      return data.data.activities || [];
    } catch (error) {
      logger.error('Error fetching activities', { error: error.message });
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @param {Object} options - Query options
   * @param {boolean} options.global - Get global stats or user-specific (default: false)
   * @param {Date} options.since - Only count activities since this date
   * @returns {Promise<Object>} Activity statistics
   */
  async getActivityStats({
    global = false,
    since = null
  } = {}) {
    try {
      const headers = await this._getAuthHeaders();

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('global', global.toString());

      if (since) {
        queryParams.append('since', since.toISOString());
      }

      const response = await fetch(`${this.baseURL}/api/activities/stats?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activity stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch activity stats');
      }

      logger.info('Activity stats fetched successfully', {
        stats: data.data
      });

      return data.data;
    } catch (error) {
      logger.error('Error fetching activity stats', { error: error.message });
      throw error;
    }
  }
}

const activityService = new ActivityService();
export default activityService;
