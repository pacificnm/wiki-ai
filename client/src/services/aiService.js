import { logger } from '../utils/logger';

/**
 * Service for handling AI-related API calls
 */
class AIService {
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
   * Generate document content using AI
   * @param {string} prompt - The prompt/instructions for content generation
   * @param {string} model - The AI model to use (gpt-4, gpt-3.5-turbo, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Generated content
   */
  async generateDocument(prompt, model = 'gpt-4', options = {}) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/ai/generate-document`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt,
          model,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`AI generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to generate document');
      }

      logger.info('Document generated successfully', {
        model,
        promptLength: prompt.length,
        contentLength: data.data?.content?.length || 0
      });

      return data.data;
    } catch (error) {
      logger.error('Error generating document', { prompt, model, error: error.message });
      throw error;
    }
  }

  /**
   * Improve existing document content using AI
   * @param {string} content - The current document content
   * @param {string} instructions - Instructions for improvement
   * @param {string} model - The AI model to use
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Improved content
   */
  async improveDocument(content, instructions, model = 'gpt-4', options = {}) {
    try {
      const headers = await this._getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/ai/improve-document`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content,
          instructions,
          model,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`AI improvement failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to improve document');
      }

      logger.info('Document improved successfully', {
        model,
        instructionsLength: instructions.length,
        originalLength: content.length,
        improvedLength: data.data?.content?.length || 0
      });

      return data.data;
    } catch (error) {
      logger.error('Error improving document', { instructions, model, error: error.message });
      throw error;
    }
  }

  /**
   * Process uploaded document and create Markdown based on user instructions
   * @param {File} file - The uploaded file
   * @param {string} instructions - Instructions for processing the document
   * @param {string} model - The AI model to use
   * @returns {Promise<Object>} Processed content
   */
  async processUploadedDocument(file, instructions, model = 'gpt-4') {
    try {
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const token = await currentUser.getIdToken();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document', file);
      formData.append('instructions', instructions);
      formData.append('model', model);

      const response = await fetch(`${this.baseURL}/api/ai/process-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData, let the browser set it
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Document processing failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to process uploaded document');
      }

      logger.info('Document processed successfully', {
        filename: file.name,
        fileSize: file.size,
        model,
        instructionsLength: instructions.length,
        processedLength: data.data?.content?.length || 0
      });

      return data.data;
    } catch (error) {
      logger.error('Error processing uploaded document', {
        filename: file?.name,
        model,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get supported file types for document upload
   * @returns {Object} Supported file types information
   */
  getSupportedFileTypes() {
    return {
      extensions: ['.txt', '.md', '.json', '.csv', '.html', '.xml', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.css', '.scss', '.sql', '.yaml', '.yml', '.xlsx', '.xls', '.pdf'],
      maxSizeMB: 5,
      description: 'Supported formats: Text, Markdown, JSON, CSV, HTML, XML, JavaScript, TypeScript, Python, Java, C/C++, CSS, SQL, YAML, Excel (.xlsx, .xls), PDF'
    };
  }

  /**
   * Get available AI models
   * @returns {Array} List of available models
   */
  getAvailableModels() {
    return [
      { value: 'gpt-4', label: 'GPT-4 (Most Capable)', description: 'Best for complex tasks and high-quality content' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Faster)', description: 'Fast and capable for most tasks' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast)', description: 'Quick and efficient for simple tasks' }
    ];
  }
}

const aiService = new AIService();
export default aiService;
