import { logger } from '../utils/logger';

/**
 * Service for handling document-related API calls
 */
class DocumentService {
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
   * Get all documents with optional filtering
   * @param {Object} options - Filter options
   * @param {string} options.search - Search term
   * @param {string} options.category - Category filter
   * @param {string} options.author - Author filter
   * @param {number} options.limit - Limit number of results
   * @param {number} options.skip - Skip number of results
   * @param {boolean} options.isPublished - Filter for published documents only
   * @param {boolean} options.userOwned - Filter for user-owned documents only
   * @returns {Promise<Object>} Documents data
   */
  async getAllDocuments(options = {}) {
    try {
      const headers = await this._getAuthHeaders();
      logger.info('Fetching documents with options:', options);
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (options.search) queryParams.append('search', options.search);
      if (options.category) queryParams.append('category', options.category);
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.skip) queryParams.append('skip', options.skip.toString());
      if (options.isPublished) queryParams.append('isPublished', options.isPublished.toString());
      if (options.userOwned) queryParams.append('userOwned', options.userOwned.toString());

      const url = `${this.baseURL}/api/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch documents');
      }

      logger.info('Documents fetched successfully', {
        count: data.data?.documents?.length || 0,
        total: data.data?.pagination?.total || 0
      });

      return {
        documents: data.data.documents || [],
        total: data.data.pagination?.total || 0,
        pagination: data.data.pagination || {}
      };
    } catch (error) {
      logger.error('Error fetching documents', { error: error.message });
      throw error;
    }
  }

  /**
   * Get a single document by ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Document data
   */
  async getDocumentById(documentId) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/documents/${documentId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        }
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch document');
      }

      logger.info('Document fetched successfully', { documentId });
      return data.data;
    } catch (error) {
      logger.error('Error fetching document', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {Object} documentData - Document data
   * @returns {Promise<Object>} Created document
   */
  async createDocument(documentData) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/documents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(documentData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create document: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create document');
      }

      logger.info('Document created successfully', { documentId: data.data.id });
      return data.data;
    } catch (error) {
      logger.error('Error creating document', { error: error.message });
      throw error;
    }
  }

  /**
   * Update an existing document
   * @param {string} documentId - Document ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated document
   */
  async updateDocument(documentId, updateData) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/documents/${documentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update document: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update document');
      }

      logger.info('Document updated successfully', { documentId });
      return data.data;
    } catch (error) {
      logger.error('Error updating document', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @returns {Promise<void>}
   */
  async deleteDocument(documentId) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete document');
      }

      logger.info('Document deleted successfully', { documentId });
    } catch (error) {
      logger.error('Error deleting document', { documentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get document statistics
   * @returns {Promise<Object>} Document statistics
   */
  async getDocumentStats() {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/documents/stats`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch document stats');
      }

      logger.info('Document stats fetched successfully');
      return data.data;
    } catch (error) {
      logger.error('Error fetching document stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Search documents
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchDocuments(searchTerm, options = {}) {
    try {
      const searchOptions = {
        search: searchTerm,
        ...options
      };

      return await this.getAllDocuments(searchOptions);
    } catch (error) {
      logger.error('Error searching documents', { searchTerm, error: error.message });
      throw error;
    }
  }

  /**
   * Get document statistics
   * @returns {Promise<Object>} Document statistics
   */
  async getStats() {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/documents/stats`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch document stats');
      }

      logger.info('Document stats fetched successfully', {
        stats: data.data
      });

      return data.data;
    } catch (error) {
      logger.error('Error fetching document stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a comment on a document
   * @param {string} documentId - Document ID
   * @param {Object} commentData - Comment data
   * @param {string} commentData.text - Comment text
   * @param {string} [commentData.location] - Comment location (optional)
   * @param {string} [commentData.versionId] - Version ID (optional)
   * @returns {Promise<Object>} Created comment
   */
  async createComment(documentId, commentData) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/comments/document/${documentId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create comment: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create comment');
      }

      logger.info('Comment created successfully', {
        documentId,
        commentId: data.data._id
      });

      return data.data;
    } catch (error) {
      logger.error('Error creating comment', {
        error: error.message,
        documentId,
        commentData: { ...commentData, text: commentData.text?.substring(0, 50) + '...' }
      });
      throw error;
    }
  }

  /**
   * Get comments for a document
   * @param {string} documentId - Document ID
   * @param {Object} options - Query options
   * @param {number} [options.limit] - Limit number of results
   * @param {number} [options.skip] - Skip number of results
   * @param {string} [options.sortOrder] - Sort order ('asc' or 'desc')
   * @returns {Promise<Object>} Comments data
   */
  async getDocumentComments(documentId, options = {}) {
    try {
      const headers = await this._getAuthHeaders();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.skip) queryParams.append('skip', options.skip);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const queryString = queryParams.toString();
      const url = `${this.baseURL}/api/comments/document/${documentId}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch comments: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      logger.info('Comments fetched successfully', {
        documentId,
        count: data.data.comments.length,
        total: data.data.total
      });

      return data.data;
    } catch (error) {
      logger.error('Error fetching document comments', {
        error: error.message,
        documentId,
        options
      });
      throw error;
    }
  }

  /**
   * Update a comment
   * @param {string} commentId - Comment ID
   * @param {Object} updateData - Update data
   * @param {string} updateData.text - Updated comment text
   * @returns {Promise<Object>} Updated comment
   */
  async updateComment(commentId, updateData) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update comment: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update comment');
      }

      logger.info('Comment updated successfully', {
        commentId
      });

      return data.data;
    } catch (error) {
      logger.error('Error updating comment', {
        error: error.message,
        commentId,
        updateData: { ...updateData, text: updateData.text?.substring(0, 50) + '...' }
      });
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete comment: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      logger.info('Comment deleted successfully', {
        commentId
      });

      return data;
    } catch (error) {
      logger.error('Error deleting comment', {
        error: error.message,
        commentId
      });
      throw error;
    }
  }
}

const documentService = new DocumentService();
export default documentService;
