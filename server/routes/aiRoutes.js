import express from 'express';
import { generateDocument, improveDocument, processUploadedDocument } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';
import { handleUploadError, uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/ai/generate-document
 * @desc Generate document content using AI
 * @access Private
 */
router.post('/generate-document', generateDocument);

/**
 * @route POST /api/ai/improve-document
 * @desc Improve existing document content using AI
 * @access Private
 */
router.post('/improve-document', improveDocument);

/**
 * @route POST /api/ai/process-upload
 * @desc Process uploaded document and create Markdown based on user instructions
 * @access Private
 */
router.post('/process-upload', uploadSingle, handleUploadError, processUploadedDocument);

export default router;
