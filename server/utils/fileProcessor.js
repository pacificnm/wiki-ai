import fs from 'fs';
import path from 'path';

/**
 * File processing utilities for extracting text content from various file types.
 *
 * @author WikiAI Team
 * @description Handles text extraction from uploaded documents for AI processing.
 */

/**
 * Supported file types for document upload.
 */
export const SUPPORTED_FILE_TYPES = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.xml': 'application/xml',
  '.js': 'application/javascript',
  '.jsx': 'application/javascript',
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.py': 'text/x-python',
  '.java': 'text/x-java',
  '.cpp': 'text/x-c++src',
  '.c': 'text/x-csrc',
  '.css': 'text/css',
  '.scss': 'text/x-scss',
  '.sql': 'application/sql',
  '.yaml': 'application/x-yaml',
  '.yml': 'application/x-yaml',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.pdf': 'application/pdf'
};

/**
 * Maximum file size allowed (5MB).
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Check if a file type is supported.
 *
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether the file type is supported
 */
export const isSupportedFileType = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  return extension in SUPPORTED_FILE_TYPES;
};

/**
 * Get the MIME type for a file extension.
 *
 * @param {string} filename - The filename
 * @returns {string} The MIME type
 */
export const getMimeType = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  return SUPPORTED_FILE_TYPES[extension] || 'application/octet-stream';
};

/**
 * Extract text content from a file.
 *
 * @param {string} filePath - Path to the file
 * @param {string} originalName - Original filename
 * @returns {Promise<{content: string, metadata: object}>} Extracted content and metadata
 */
export const extractTextContent = async (filePath, originalName) => {
  try {
    const stats = fs.statSync(filePath);
    const extension = path.extname(originalName).toLowerCase();

    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check if file type is supported
    if (!isSupportedFileType(originalName)) {
      throw new Error(`File type ${extension} is not supported`);
    }

    let content = '';
    let processedContent = '';

    // PDF support
    if (extension === '.pdf') {
      // Lazy import pdf-parse to avoid unnecessary dependency if not needed
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      content = pdfData.text;
      processedContent = `PDF Document (${pdfData.numpages} pages):\n${content}`;
    }
    // XLSX/XLS support
    else if (extension === '.xlsx' || extension === '.xls') {
      // Lazy import xlsx to avoid unnecessary dependency if not needed
      const XLSX = (await import('xlsx')).default;
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      let allText = '';
      sheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        allText += `\n--- Sheet: ${sheetName} ---\n` + csv;
      });
      content = allText;
      processedContent = `Excel Data (${sheetNames.length} sheets):\n${allText}`;
    } else {
      // Read file content as text
      content = fs.readFileSync(filePath, 'utf8');
      processedContent = content;
    }

    // Create metadata
    const metadata = {
      originalName,
      extension,
      mimeType: getMimeType(originalName),
      size: stats.size,
      extractedAt: new Date().toISOString(),
      contentLength: content.length
    };

    // Process content based on file type
    switch (extension) {
      case '.json':
        try {
          // Pretty print JSON for better readability
          const jsonData = JSON.parse(content);
          processedContent = JSON.stringify(jsonData, null, 2);
        } catch (e) {
          // If JSON parsing fails, use raw content
          processedContent = content;
        }
        break;

      case '.html':
      case '.xml':
        // Remove excessive whitespace and format for readability
        processedContent = content
          .replace(/>\s+</g, '><')
          .replace(/\s+/g, ' ')
          .trim();
        break;

      case '.csv': {
        // Add some structure information for CSV
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          processedContent = `CSV Data (${lines.length} rows):\n${content}`;
        }
        break;
      }

      // Excel already handled above
    }

    return {
      content: processedContent,
      metadata
    };

  } catch (error) {
    throw new Error(`Failed to extract content from file: ${error.message}`);
  }
};

/**
 * Clean up uploaded file.
 *
 * @param {string} filePath - Path to the file to delete
 */
export const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
};

/**
 * Validate file upload.
 *
 * @param {object} file - Multer file object
 * @returns {object} Validation result
 */
export const validateFileUpload = (file) => {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  if (!isSupportedFileType(file.originalname)) {
    const extension = path.extname(file.originalname).toLowerCase();
    errors.push(`File type ${extension} is not supported`);
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
