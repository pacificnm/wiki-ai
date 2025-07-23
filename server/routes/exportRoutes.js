import { Router } from 'express';
import { exportToPDF, exportToWord } from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all export routes
router.use(authenticateToken);

/**
 * @route   GET /api/export/:id/pdf
 * @desc    Export document as PDF
 * @access  Private (author or admin, or published documents)
 */
router.get('/:id/pdf', exportToPDF);

/**
 * @route   GET /api/export/:id/word
 * @desc    Export document as Word document
 * @access  Private (author or admin, or published documents)
 */
router.get('/:id/word', exportToWord);

export default router;
