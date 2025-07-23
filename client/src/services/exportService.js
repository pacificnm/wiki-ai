import { auth } from '../config/firebase';
import { logger } from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Export service for handling document exports
 */
class ExportService {
  /**
   * Get authentication headers
   */
  async getAuthHeaders() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Export document as PDF
   * @param {string} documentId - The document ID to export
   * @returns {Promise<Blob>} PDF blob
   */
  async exportToPDF(documentId) {
    try {
      logger.info('Exporting document to PDF', { documentId });

      const headers = await this.getAuthHeaders();
      delete headers['Content-Type']; // Remove content-type for binary response

      const response = await fetch(`${API_BASE_URL}/export/${documentId}/pdf`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Export failed: ${response.status}`);
      }

      const blob = await response.blob();

      logger.info('PDF export completed', {
        documentId,
        size: blob.size
      });

      return blob;
    } catch (error) {
      logger.error('PDF export failed', {
        error: error.message,
        documentId
      });
      throw error;
    }
  }

  /**
   * Export document as Word document
   * @param {string} documentId - The document ID to export
   * @returns {Promise<Blob>} Word document blob
   */
  async exportToWord(documentId) {
    try {
      logger.info('Exporting document to Word', { documentId });

      const headers = await this.getAuthHeaders();
      delete headers['Content-Type']; // Remove content-type for binary response

      const response = await fetch(`${API_BASE_URL}/export/${documentId}/word`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        let errorMessage = `Export failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      logger.info('Word export completed', {
        documentId,
        size: blob.size
      });

      return blob;
    } catch (error) {
      logger.error('Word export failed', {
        error: error.message,
        documentId
      });
      throw new Error('Failed to generate Word document');
    }
  }

  /**
   * Download blob with specified filename
   * @param {Blob} blob - The blob to download
   * @param {string} filename - The filename for download
   */
  downloadBlob(blob, filename) {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.info('File download initiated', { filename, size: blob.size });
    } catch (error) {
      logger.error('File download failed', {
        error: error.message,
        filename
      });
      throw error;
    }
  }

  /**
   * Export and download document as PDF
   * @param {string} documentId - The document ID to export
   * @param {string} title - The document title for filename
   */
  async exportAndDownloadPDF(documentId, title) {
    try {
      const blob = await this.exportToPDF(documentId);
      const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      this.downloadBlob(blob, filename);
    } catch (error) {
      logger.error('PDF export and download failed', {
        error: error.message,
        documentId,
        title
      });
      throw error;
    }
  }

  /**
   * Export and download document as Word document
   * @param {string} documentId - The document ID to export
   * @param {string} title - The document title for filename
   */
  async exportAndDownloadWord(documentId, title) {
    try {
      const blob = await this.exportToWord(documentId);
      const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
      this.downloadBlob(blob, filename);
    } catch (error) {
      logger.error('Word export and download failed', {
        error: error.message,
        documentId,
        title
      });
      throw error;
    }
  }
}

const exportService = new ExportService();
export default exportService;
