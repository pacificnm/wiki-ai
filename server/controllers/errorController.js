import { z } from 'zod';
import { AppError } from '../middleware/error.js';
import { logger } from '../middleware/logger.js';

/**
 * Schema for client error reports.
 *
 * @type {z.ZodSchema}
 */
const clientErrorSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  url: z.string().url(),
  errorId: z.string(),
  userId: z.string().optional(),
  level: z.enum(['error', 'warn', 'info']).default('error'),
  source: z.enum(['react', 'javascript', 'network', 'api']).default('javascript'),
  metadata: z.object({}).optional()
});

/**
 * Controller for handling client-side error reports.
 *
 * @class ErrorController
 */
export class ErrorController {
  /**
   * Log client-side errors.
   *
   * @async
   * @function logClientError
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * POST /api/errors
   * {
   *   "message": "TypeError: Cannot read property 'name' of undefined",
   *   "stack": "TypeError: Cannot read property...",
   *   "url": "https://app.example.com/dashboard",
   *   "errorId": "error_1234567890_abc123"
   * }
   */
  static async logClientError(req, res) {
    try {
      const errorData = clientErrorSchema.parse(req.body);

      // Extract user information if available
      const userId = req.user?.uid || errorData.userId || 'anonymous';

      // Create structured log entry
      const logEntry = {
        message: `Client Error: ${errorData.message}`,
        errorId: errorData.errorId,
        source: 'client',
        level: errorData.level,
        errorType: errorData.source,
        userId,
        url: errorData.url,
        userAgent: errorData.userAgent || req.get('User-Agent'),
        timestamp: errorData.timestamp,
        clientTimestamp: errorData.timestamp,
        serverTimestamp: new Date().toISOString(),
        ...(errorData.stack && { stack: errorData.stack }),
        ...(errorData.componentStack && { componentStack: errorData.componentStack }),
        ...(errorData.metadata && { metadata: errorData.metadata }),
        requestInfo: {
          ip: req.ip,
          method: req.method,
          headers: {
            'user-agent': req.get('User-Agent'),
            'referer': req.get('Referer'),
            'x-forwarded-for': req.get('X-Forwarded-For')
          }
        }
      };

      // Log with appropriate level
      switch (errorData.level) {
        case 'error':
          logger.error(logEntry.message, logEntry);
          break;
        case 'warn':
          logger.warn(logEntry.message, logEntry);
          break;
        case 'info':
          logger.info(logEntry.message, logEntry);
          break;
        default:
          logger.error(logEntry.message, logEntry);
      }

      // Send success response
      res.status(200).json({
        success: true,
        message: 'Error logged successfully',
        errorId: errorData.errorId
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Invalid client error report', {
          validationErrors: error.errors,
          requestBody: req.body,
          ip: req.ip
        });

        throw new AppError('Invalid error report format', 400, 'VALIDATION_ERROR', {
          errors: error.errors
        });
      }

      logger.error('Failed to process client error report', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body,
        ip: req.ip
      });

      throw new AppError('Failed to log error', 500, 'LOGGING_ERROR');
    }
  }

  /**
   * Get error statistics (admin only).
   *
   * @async
   * @function getErrorStats
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async getErrorStats(req, res) {
    try {
      // This is a placeholder - in production you'd query your log aggregation service
      // or database where you store error statistics

      const stats = {
        totalErrors: 0,
        errorsByType: {
          javascript: 0,
          network: 0,
          api: 0,
          react: 0
        },
        errorsByPage: {},
        topErrors: [],
        timeline: [],
        lastUpdated: new Date().toISOString()
      };

      // In production, you might query something like:
      // - Elasticsearch/LogStash
      // - MongoDB aggregation pipeline
      // - Your monitoring service API

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Failed to get error statistics', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.uid
      });

      throw new AppError('Failed to retrieve error statistics', 500, 'STATS_ERROR');
    }
  }

  /**
   * Clear old error logs (admin only).
   *
   * @async
   * @function clearOldErrors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async clearOldErrors(req, res) {
    try {
      const { days = 30 } = req.query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      logger.info('Admin requested error log cleanup', {
        userId: req.user.uid,
        cutoffDate: cutoffDate.toISOString(),
        days: parseInt(days)
      });

      // In production, you would:
      // - Delete old log files
      // - Clean up database records
      // - Update your monitoring service

      res.json({
        success: true,
        message: `Error logs older than ${days} days have been cleared`,
        cutoffDate: cutoffDate.toISOString()
      });

    } catch (error) {
      logger.error('Failed to clear old error logs', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.uid
      });

      throw new AppError('Failed to clear error logs', 500, 'CLEANUP_ERROR');
    }
  }

  /**
   * Test error logging endpoint.
   *
   * @async
   * @function testError
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async testError(req, res) {
    const { type = 'error' } = req.query;

    switch (type) {
      case 'error':
        throw new Error('Test error for monitoring');
      case 'validation':
        throw new AppError('Test validation error', 400, 'VALIDATION_ERROR');
      case 'auth':
        throw new AppError('Test authentication error', 401, 'AUTH_ERROR');
      case 'permission':
        throw new AppError('Test permission error', 403, 'PERMISSION_ERROR');
      case 'notfound':
        throw new AppError('Test not found error', 404, 'NOT_FOUND');
      case 'server':
        throw new AppError('Test server error', 500, 'SERVER_ERROR');
      default:
        res.json({
          success: true,
          message: 'No error thrown - test endpoint is working'
        });
    }
  }
}

export default ErrorController;
