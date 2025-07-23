import express from 'express';
import {
  createComment,
  deleteComment,
  getDocumentComments,
  updateComment
} from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/comments/document/:documentId
 * @desc Get all comments for a document
 * @access Private
 */
router.get('/document/:documentId', authenticateToken, getDocumentComments);

/**
 * @route POST /api/comments/document/:documentId
 * @desc Create a new comment on a document
 * @access Private
 */
router.post('/document/:documentId', authenticateToken, createComment);

/**
 * @route PUT /api/comments/:commentId
 * @desc Update a comment
 * @access Private (Owner or Admin)
 */
router.put('/:commentId', authenticateToken, updateComment);

/**
 * @route DELETE /api/comments/:commentId
 * @desc Delete a comment
 * @access Private (Owner or Admin)
 */
router.delete('/:commentId', authenticateToken, deleteComment);

export default router;
