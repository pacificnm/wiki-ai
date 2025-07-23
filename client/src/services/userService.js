import { logger } from '../utils/logger';

/**
 * Service for handling user-related API calls
 */
class UserService {
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
   * Get all users with optional filtering
   * @param {Object} options - Filter options
   * @param {string} options.search - Search term
   * @param {string} options.role - Role filter
   * @param {string} options.status - Status filter
   * @param {number} options.limit - Limit number of results
   * @param {number} options.skip - Skip number of results
   * @returns {Promise<Object>} Users data
   */
  async getAllUsers(options = {}) {
    try {
      const headers = await this._getAuthHeaders();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (options.search) queryParams.append('search', options.search);
      if (options.role) queryParams.append('role', options.role);
      if (options.status) queryParams.append('status', options.status);
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.skip) queryParams.append('skip', options.skip.toString());

      const url = `${this.baseURL}/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      logger.info('Users fetched successfully', {
        count: data.data?.users?.length || 0,
        total: data.data?.total || 0
      });

      return data.data;
    } catch (error) {
      logger.error('Error fetching users', { error: error.message });
      throw error;
    }
  }

  /**
   * Get a single user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      logger.info('User fetched successfully', { userId });
      return data.data;
    } catch (error) {
      logger.error('Error fetching user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create user');
      }

      logger.info('User created successfully', { userId: data.data.id });
      return data.data;
    } catch (error) {
      logger.error('Error creating user', { error: error.message });
      throw error;
    }
  }

  /**
   * Update an existing user
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update user');
      }

      logger.info('User updated successfully', { userId });
      return data.data;
    } catch (error) {
      logger.error('Error updating user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete user');
      }

      logger.info('User deleted successfully', { userId });
    } catch (error) {
      logger.error('Error deleting user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Toggle user status (active/inactive)
   * @param {string} userId - User ID
   * @param {string} status - New status ('active' or 'inactive')
   * @returns {Promise<Object>} Updated user
   */
  async toggleUserStatus(userId, status) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Failed to update user status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update user status');
      }

      logger.info('User status updated successfully', { userId, status });
      return data.data;
    } catch (error) {
      logger.error('Error updating user status', { userId, status, error: error.message });
      throw error;
    }
  }

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise<Object>} Updated user
   */
  async updateUserRole(userId, role) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        throw new Error(`Failed to update user role: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update user role');
      }

      logger.info('User role updated successfully', { userId, role });
      return data.data;
    } catch (error) {
      logger.error('Error updating user role', { userId, role, error: error.message });
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/users/stats`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch user stats');
      }

      logger.info('User stats fetched successfully');
      return data.data;
    } catch (error) {
      logger.error('Error fetching user stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Search users
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchUsers(searchTerm, options = {}) {
    try {
      const searchOptions = {
        search: searchTerm,
        ...options
      };

      return await this.getAllUsers(searchOptions);
    } catch (error) {
      logger.error('Error searching users', { searchTerm, error: error.message });
      throw error;
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getCurrentUserProfile() {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/auth/profile`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      logger.info('User profile fetched successfully');
      return data.data;
    } catch (error) {
      logger.error('Error fetching user profile', { error: error.message });
      throw error;
    }
  }

  /**
   * Update current user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  async updateCurrentUserProfile(profileData) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/auth/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      logger.info('User profile updated successfully', {
        updatedFields: Object.keys(profileData)
      });

      return data.data;
    } catch (error) {
      logger.error('Error updating user profile', {
        error: error.message,
        profileData: Object.keys(profileData)
      });
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;
