import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES, validateFileUpload } from '../utils/fileProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Multer configuration for file uploads.
 *
 * @author WikiAI Team
 * @description Configures multer for handling document uploads for AI processing.
 */

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in uploads directory
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${extension}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const validation = validateFileUpload(file);

  if (validation.isValid) {
    cb(null, true);
  } else {
    cb(new Error(validation.errors.join(', ')), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only allow one file at a time
  },
  fileFilter: fileFilter
});

/**
 * Middleware for single file upload.
 */
export const uploadSingle = upload.single('document');

/**
 * Error handler for multer errors.
 */
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Only one file is allowed'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  return next();
};

/**
 * Get supported file types for client information.
 */
export const getSupportedFileTypes = () => {
  return {
    extensions: Object.keys(SUPPORTED_FILE_TYPES),
    mimeTypes: Object.values(SUPPORTED_FILE_TYPES),
    maxSize: MAX_FILE_SIZE,
    maxSizeMB: MAX_FILE_SIZE / (1024 * 1024)
  };
};
