import express from 'express';
import {
  createDocument,
  deleteDocument,
  getAllDocuments,
  getDocumentById,
  getDocumentStats,
  updateDocument
} from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/documents
 * @desc Get all documents with filtering and pagination
 * @access Private
 */
router.get('/', authenticateToken, getAllDocuments);

/**
 * @route GET /api/documents/stats
 * @desc Get document statistics
 * @access Private
 */
router.get('/stats', authenticateToken, getDocumentStats);

/**
 * @route GET /api/documents/:id
 * @desc Get a single document by ID
 * @access Private
 */
router.get('/:id', authenticateToken, getDocumentById);

/**
 * @route POST /api/documents
 * @desc Create a new document
 * @access Private
 */
router.post('/', authenticateToken, createDocument);

/**
 * @route PUT /api/documents/:id
 * @desc Update an existing document
 * @access Private
 */
router.put('/:id', authenticateToken, updateDocument);

/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document
 * @access Private
 */
router.delete('/:id', authenticateToken, deleteDocument);

export default router;
