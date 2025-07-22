import { verifyIdToken, getUserById } from '../config/firebase.js';
import { logger } from './logger.js';

/**
 * Middleware to authenticate Firebase ID tokens.
 *
 * @async
 * @function authenticateToken
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers.authorization - Authorization header with Bearer token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>} Calls next() on success, sends error response on failure
 *
 * @example
 * // Usage in routes
 * import { authenticateToken } from '../middleware/auth.js';
 * router.get('/protected', authenticateToken, (req, res) => {
 *   // req.user will be available here with Firebase user data
 *   res.json({ message: `Hello ${req.user.email}` });
 * });
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header required',
        message: 'Please provide Authorization header with Bearer token'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid authorization format',
        message: 'Authorization header must start with "Bearer "'
      });
    }

    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!idToken) {
      return res.status(401).json({
        error: 'Token required',
        message: 'Bearer token is required'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(idToken);

    // Get additional user data from Firebase Auth
    const userRecord = await getUserById(decodedToken.uid);

    // Attach user data to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userRecord.email,
      emailVerified: decodedToken.email_verified || userRecord.emailVerified,
      displayName: decodedToken.name || userRecord.displayName,
      photoURL: decodedToken.picture || userRecord.photoURL,
      role: decodedToken.role || 'user', // From custom claims
      customClaims: decodedToken,
      firebaseUser: userRecord
    };

    logger.info('User authenticated successfully', {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role
    });

    next();
    return null;
  } catch (error) {
    logger.error('Authentication failed', {
      error: error.message,
      authHeader: req.headers.authorization ? 'present' : 'missing'
    });

    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Optional authentication middleware - does not fail if no token is provided.
 *
 * @async
 * @function optionalAuth
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>} Always calls next(), sets req.user if token is valid
 *
 * @example
 * // Usage for endpoints that work with or without authentication
 * router.get('/public-or-private', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     res.json({ message: `Hello ${req.user.email}`, isAuthenticated: true });
 *   } else {
 *     res.json({ message: 'Hello anonymous user', isAuthenticated: false });
 *   }
 * });
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const idToken = authHeader.substring(7);

    if (!idToken) {
      return next();
    }

    // Try to verify the token
    const decodedToken = await verifyIdToken(idToken);
    const userRecord = await getUserById(decodedToken.uid);

    // Attach user data to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userRecord.email,
      emailVerified: decodedToken.email_verified || userRecord.emailVerified,
      displayName: decodedToken.name || userRecord.displayName,
      photoURL: decodedToken.picture || userRecord.photoURL,
      role: decodedToken.role || 'user',
      customClaims: decodedToken,
      firebaseUser: userRecord
    };

    logger.info('Optional auth successful', {
      uid: req.user.uid,
      email: req.user.email
    });

  } catch (error) {
    logger.warn('Optional auth failed, continuing without user', {
      error: error.message
    });
    // Don't set req.user, but continue
  }

  next();
  return null;
}

/**
 * Middleware to require admin role.
 * Must be used after authenticateToken.
 *
 * @function requireAdmin
 * @param {Object} req - Express request object with req.user set
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() if user is admin, sends error response otherwise
 *
 * @example
 * // Usage for admin-only endpoints
 * router.delete('/admin/users/:id',
 *   authenticateToken,
 *   requireAdmin,
 *   adminController.deleteUser
 * );
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate first'
    });
  }

  if (req.user.role !== 'admin') {
    logger.warn('Admin access denied', {
      uid: req.user.uid,
      role: req.user.role
    });

    return res.status(403).json({
      error: 'Admin access required',
      message: 'You do not have administrator privileges'
    });
  }

  logger.info('Admin access granted', {
    uid: req.user.uid,
    email: req.user.email
  });

  next();
  return null;
}

/**
 * Middleware to require user role (any authenticated user).
 * Must be used after authenticateToken.
 *
 * @function requireUser
 * @param {Object} req - Express request object with req.user set
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() if user is authenticated, sends error response otherwise
 *
 * @example
 * // Usage for authenticated user endpoints
 * router.get('/profile',
 *   authenticateToken,
 *   requireUser,
 *   userController.getProfile
 * );
 */
export function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate to access this resource'
    });
  }

  next();
  return null;
}
