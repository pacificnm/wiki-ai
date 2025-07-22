import express from 'express';
import { ErrorController } from '../controllers/errorController.js';
import { asyncHandler } from '../middleware/error.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Error handling routes.
 * 
 * @namespace ErrorRoutes
 */

/**
 * POST /api/errors
 * Log client-side errors.
 * 
 * @route POST /errors
 * @access Public (but should be from your app)
 * @body {Object} errorData - Client error information
 * 
 * @example
 * POST /api/errors
 * Content-Type: application/json
 * 
 * {
 *   "message": "TypeError: Cannot read property 'name' of undefined",
 *   "stack": "TypeError: Cannot read property 'name' of undefined\n    at Component.render (/app/src/Component.js:15:23)",
 *   "componentStack": "    in Component (at App.js:10:5)",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
 *   "url": "https://app.example.com/dashboard",
 *   "errorId": "error_1234567890_abc123",
 *   "userId": "user123",
 *   "level": "error",
 *   "source": "react",
 *   "metadata": {
 *     "feature": "dashboard",
 *     "action": "load_user_data"
 *   }
 * }
 */
router.post('/', asyncHandler(ErrorController.logClientError));

/**
 * GET /api/errors/stats
 * Get error statistics (admin only).
 * 
 * @route GET /errors/stats
 * @access Private (Admin)
 * @query {string} [timeframe] - Time period for stats (1d, 7d, 30d)
 * @query {string} [source] - Filter by error source (react, javascript, network, api)
 * 
 * @example
 * GET /api/errors/stats?timeframe=7d&source=react
 * Authorization: Bearer <admin_token>
 */
router.get('/stats', 
  authenticateToken, 
  // requireRole('admin'), // Uncomment when role middleware is implemented
  asyncHandler(ErrorController.getErrorStats)
);

/**
 * DELETE /api/errors/cleanup
 * Clear old error logs (admin only).
 * 
 * @route DELETE /errors/cleanup
 * @access Private (Admin)
 * @query {number} [days=30] - Number of days to keep logs
 * 
 * @example
 * DELETE /api/errors/cleanup?days=60
 * Authorization: Bearer <admin_token>
 */
router.delete('/cleanup', 
  authenticateToken,
  // requireRole('admin'), // Uncomment when role middleware is implemented
  asyncHandler(ErrorController.clearOldErrors)
);

/**
 * GET /api/errors/test
 * Test error logging endpoint (development only).
 * 
 * @route GET /errors/test
 * @access Private
 * @query {string} [type] - Type of error to simulate (error, validation, auth, permission, notfound, server)
 * 
 * @example
 * GET /api/errors/test?type=validation
 * Authorization: Bearer <token>
 */
if (process.env.NODE_ENV !== 'production') {
  router.get('/test', 
    authenticateToken,
    asyncHandler(ErrorController.testError)
  );
}

export default router;
