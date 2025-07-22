import { logger } from './logger.js';

/**
 * Custom error class for application errors.
 * 
 * @class AppError
 * @extends Error
 */
export class AppError extends Error {
  /**
   * Create an application error.
   * 
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Error code for client handling
   * @param {Object} [meta={}] - Additional error metadata
   */
  constructor(message, statusCode = 500, code = null, meta = {}) {
    super(message);
    
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class.
 * 
 * @class ValidationError
 * @extends AppError
 */
export class ValidationError extends AppError {
  /**
   * Create a validation error.
   * 
   * @param {string} message - Error message
   * @param {Object} [errors={}] - Validation errors object
   */
  constructor(message, errors = {}) {
    super(message, 400, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class.
 * 
 * @class AuthenticationError
 * @extends AppError
 */
export class AuthenticationError extends AppError {
  /**
   * Create an authentication error.
   * 
   * @param {string} [message='Authentication required'] - Error message
   */
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class.
 * 
 * @class AuthorizationError
 * @extends AppError
 */
export class AuthorizationError extends AppError {
  /**
   * Create an authorization error.
   * 
   * @param {string} [message='Insufficient permissions'] - Error message
   */
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class.
 * 
 * @class NotFoundError
 * @extends AppError
 */
export class NotFoundError extends AppError {
  /**
   * Create a not found error.
   * 
   * @param {string} [message='Resource not found'] - Error message
   * @param {string} [resource] - Resource type that wasn't found
   */
  constructor(message = 'Resource not found', resource = null) {
    super(message, 404, 'NOT_FOUND', { resource });
    this.name = 'NotFoundError';
  }
}

/**
 * Database error class.
 * 
 * @class DatabaseError
 * @extends AppError
 */
export class DatabaseError extends AppError {
  /**
   * Create a database error.
   * 
   * @param {string} message - Error message
   * @param {Object} [meta={}] - Additional metadata
   */
  constructor(message, meta = {}) {
    super(message, 500, 'DATABASE_ERROR', meta);
    this.name = 'DatabaseError';
  }
}

/**
 * Rate limit error class.
 * 
 * @class RateLimitError
 * @extends AppError
 */
export class RateLimitError extends AppError {
  /**
   * Create a rate limit error.
   * 
   * @param {string} [message='Too many requests'] - Error message
   * @param {number} [retryAfter=60] - Seconds to wait before retrying
   */
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_ERROR', { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Handle different types of errors and convert to AppError.
 * 
 * @function handleError
 * @param {Error} err - The error to handle
 * @returns {AppError} Standardized application error
 */
function handleError(err) {
  let error = { ...err };

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ValidationError(message, { 
      field: Object.keys(err.keyValue)[0],
      value: Object.values(err.keyValue)[0]
    });
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    error = new ValidationError('Invalid input data', { errors });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new ValidationError(message);
  }

  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    switch (err.code) {
      case 'auth/id-token-expired':
        error = new AuthenticationError('Token expired');
        break;
      case 'auth/id-token-revoked':
        error = new AuthenticationError('Token revoked');
        break;
      case 'auth/user-not-found':
        error = new NotFoundError('User not found');
        break;
      default:
        error = new AuthenticationError('Authentication failed');
    }
  }

  return error;
}

/**
 * Send error response in development mode.
 * 
 * @function sendErrorDev
 * @param {AppError} err - Application error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
function sendErrorDev(err, req, res) {
  // Log full error in development
  logger.error('Error in development:', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers
  });

  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
      meta: err.meta,
      timestamp: err.timestamp
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query
    }
  });
}

/**
 * Send error response in production mode.
 * 
 * @function sendErrorProd
 * @param {AppError} err - Application error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
function sendErrorProd(err, req, res) {
  // Log error for monitoring
  logger.error('Production error:', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    userId: req.user?.uid,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    meta: err.meta,
    ...(err.isOperational ? {} : { stack: err.stack })
  });

  // Only send error details if it's operational (trusted)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      error: {
        message: err.message,
        code: err.code,
        ...(err.meta && Object.keys(err.meta).length > 0 ? { details: err.meta } : {}),
        timestamp: err.timestamp || new Date().toISOString()
      }
    });
  } else {
    // Don't leak error details for programming errors
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Global error handling middleware.
 * 
 * @function errorHandler
 * @param {Error} err - The error that occurred
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 * 
 * @example
 * // Add to Express app (must be last middleware)
 * app.use(errorHandler);
 */
export function errorHandler(err, req, res, next) {
  // Convert error to AppError if needed
  let error = err instanceof AppError ? err : handleError(err);
  
  // Ensure error is an AppError instance
  if (!(error instanceof AppError)) {
    error = new AppError(
      error.message || 'Something went wrong',
      error.statusCode || 500,
      error.code || 'INTERNAL_ERROR',
      error.meta || {}
    );
  }

  // Add request context to error
  error.requestContext = {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.uid,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };

  // Send appropriate response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
}

/**
 * Handle 404 errors for undefined routes.
 * 
 * @function notFound
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 * 
 * @example
 * // Add before error handler
 * app.use(notFound);
 * app.use(errorHandler);
 */
export function notFound(req, res, next) {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`,
    'route'
  );
  next(error);
}

/**
 * Async error wrapper to catch promise rejections.
 * 
 * @function asyncHandler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Wrap async route handlers
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation middleware factory.
 * 
 * @function validate
 * @param {Function} schema - Validation schema function
 * @param {string} [source='body'] - Request source to validate (body, params, query)
 * @returns {Function} Express middleware function
 * 
 * @example
 * import { z } from 'zod';
 * 
 * const userSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(1)
 * });
 * 
 * app.post('/users', validate(userSchema), createUser);
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.parse(req[source]);
      req[source] = result;
      next();
    } catch (error) {
      if (error.errors) {
        // Zod validation error
        const validationErrors = error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {});
        
        next(new ValidationError('Validation failed', validationErrors));
      } else {
        next(new ValidationError(error.message));
      }
    }
  };
}

/**
 * Handle process-level errors.
 */
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise
  });
  
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('👋 SIGINT RECEIVED. Shutting down gracefully');
  process.exit(0);
});
