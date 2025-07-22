import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom log format for console output.
 * 
 * @type {winston.Logform.Format}
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return log + metaStr;
  })
);

/**
 * File log format - structured JSON for production parsing.
 * 
 * @type {winston.Logform.Format}
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create transports based on environment.
 * 
 * @function createTransports
 * @returns {winston.transport[]} Array of winston transports
 */
function createTransports() {
  const transports = [];
  
  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );
  
  // File transports for production
  if (process.env.NODE_ENV === 'production') {
    const logDir = path.join(__dirname, '../../logs');
    
    // Combined log file (all levels)
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        level: 'info',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true
      })
    );
    
    // Error log file (errors only)
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }
  
  return transports;
}

/**
 * Winston logger instance.
 * 
 * @type {winston.Logger}
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports: createTransports(),
  exitOnError: false
});

/**
 * Stream interface for Morgan HTTP logger.
 * 
 * @type {Object}
 */
export const morganStream = {
  /**
   * Write method for Morgan stream interface.
   * 
   * @function write
   * @param {string} message - Log message from Morgan
   * @returns {void}
   */
  write(message) {
    // Remove trailing newline and log as info
    logger.info(message.trim(), { source: 'http' });
  }
};

/**
 * Enhanced logging functions with additional context.
 */
export const log = {
  /**
   * Log info level message with optional metadata.
   * 
   * @function info
   * @param {string} message - Log message
   * @param {Object} [meta={}] - Additional metadata
   * @param {string} [meta.userId] - User ID associated with action
   * @param {string} [meta.requestId] - Request ID for tracing
   * @param {string} [meta.module] - Module/component name
   * @returns {void}
   * 
   * @example
   * log.info('User logged in successfully', { 
   *   userId: 'abc123', 
   *   module: 'auth' 
   * });
   */
  info(message, meta = {}) {
    logger.info(message, {
      ...meta,
      timestamp: new Date().toISOString(),
      pid: process.pid
    });
  },

  /**
   * Log error with stack trace and context.
   * 
   * @function error
   * @param {string|Error} error - Error message or Error object
   * @param {Object} [meta={}] - Additional metadata
   * @param {string} [meta.userId] - User ID associated with error
   * @param {string} [meta.requestId] - Request ID for tracing
   * @param {string} [meta.module] - Module/component name
   * @param {string} [meta.action] - Action being performed when error occurred
   * @returns {void}
   * 
   * @example
   * log.error(new Error('Database connection failed'), {
   *   module: 'database',
   *   action: 'connect',
   *   userId: 'abc123'
   * });
   */
  error(error, meta = {}) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(errorMessage, {
      ...meta,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      pid: process.pid
    });
  },

  /**
   * Log warning message.
   * 
   * @function warn
   * @param {string} message - Warning message
   * @param {Object} [meta={}] - Additional metadata
   * @returns {void}
   * 
   * @example
   * log.warn('API rate limit approaching', { 
   *   userId: 'abc123', 
   *   currentRate: 95 
   * });
   */
  warn(message, meta = {}) {
    logger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString(),
      pid: process.pid
    });
  },

  /**
   * Log debug information (only in development).
   * 
   * @function debug
   * @param {string} message - Debug message
   * @param {Object} [meta={}] - Additional metadata
   * @returns {void}
   * 
   * @example
   * log.debug('Cache hit for user data', { 
   *   userId: 'abc123', 
   *   cacheKey: 'user:abc123' 
   * });
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(message, {
        ...meta,
        timestamp: new Date().toISOString(),
        pid: process.pid
      });
    }
  },

  /**
   * Log HTTP request information.
   * 
   * @function http
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} [action] - Action description
   * @returns {void}
   * 
   * @example
   * log.http(req, res, 'User profile updated');
   */
  http(req, res, action = '') {
    const duration = res.locals.startTime ? Date.now() - res.locals.startTime : 0;
    
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.uid,
      duration: `${duration}ms`,
      action,
      source: 'http'
    });
  },

  /**
   * Log authentication events.
   * 
   * @function auth
   * @param {string} event - Authentication event type
   * @param {Object} [meta={}] - Additional metadata
   * @param {string} [meta.userId] - User ID
   * @param {string} [meta.email] - User email
   * @param {string} [meta.ip] - IP address
   * @returns {void}
   * 
   * @example
   * log.auth('login_success', { 
   *   userId: 'abc123', 
   *   email: 'user@example.com',
   *   ip: '192.168.1.1'
   * });
   */
  auth(event, meta = {}) {
    logger.info(`Auth: ${event}`, {
      ...meta,
      event,
      category: 'authentication',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log database operations.
   * 
   * @function db
   * @param {string} operation - Database operation
   * @param {Object} [meta={}] - Additional metadata
   * @param {string} [meta.collection] - Database collection
   * @param {string} [meta.query] - Query information
   * @param {number} [meta.duration] - Operation duration in ms
   * @returns {void}
   * 
   * @example
   * log.db('find', { 
   *   collection: 'documents', 
   *   query: 'findById',
   *   duration: 45
   * });
   */
  db(operation, meta = {}) {
    logger.info(`DB: ${operation}`, {
      ...meta,
      operation,
      category: 'database',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create request-scoped logger with consistent metadata.
 * 
 * @function createRequestLogger
 * @param {Object} req - Express request object
 * @returns {Object} Request-scoped logger
 * 
 * @example
 * // In middleware or route handler
 * const reqLogger = createRequestLogger(req);
 * reqLogger.info('Processing user request');
 */
export function createRequestLogger(req) {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const baseMetadata = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.uid,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };

  return {
    info: (message, meta = {}) => log.info(message, { ...baseMetadata, ...meta }),
    error: (error, meta = {}) => log.error(error, { ...baseMetadata, ...meta }),
    warn: (message, meta = {}) => log.warn(message, { ...baseMetadata, ...meta }),
    debug: (message, meta = {}) => log.debug(message, { ...baseMetadata, ...meta }),
    http: (action) => log.http(req, req.res, action)
  };
}

/**
 * Middleware to add request timing and logging.
 * 
 * @function requestLogger
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 * 
 * @example
 * app.use(requestLogger);
 */
export function requestLogger(req, res, next) {
  // Set start time for duration calculation
  res.locals.startTime = Date.now();
  
  // Create request-scoped logger
  req.logger = createRequestLogger(req);
  
  // Log request start
  req.logger.debug('Request started');
  
  // Override res.end to log completion
  const originalEnd = res.end;
  res.end = function(...args) {
    req.logger.http('Request completed');
    originalEnd.apply(this, args);
  };
  
  next();
}

// Create logs directory in production
if (process.env.NODE_ENV === 'production') {
  import('fs').then(fs => {
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  });
}

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.Console({
    format: consoleFormat
  })
);

logger.rejections.handle(
  new winston.transports.Console({
    format: consoleFormat
  })
);

export default logger;
