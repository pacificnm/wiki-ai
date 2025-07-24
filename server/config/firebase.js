import admin from 'firebase-admin';
import { logger } from '../middleware/logger.js';

/**
 * Initialize Firebase Admin SDK with environment variables.
 *
 * @async
 * @function initializeFirebase
 * @throws {Error} When Firebase configuration is invalid
 * @returns {Promise<void>}
 *
 * @example
 * // In server/index.js
 * import { initializeFirebase } from './config/firebase.js';
 * await initializeFirebase();
 */
export async function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      logger.info('Firebase Admin SDK already initialized');
      return;
    }

    // Validate required environment variables
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
    }

    // Initialize Firebase Admin SDK
    // Clean the private key by removing surrounding quotes and fixing newlines
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\\n/g, '\n'); // Convert \\n to actual newlines

    const firebaseConfig = {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    };

    admin.initializeApp(firebaseConfig);

    logger.info('Firebase Admin SDK initialized successfully', {
      projectId: process.env.FIREBASE_PROJECT_ID,
      hasDatabase: !!process.env.FIREBASE_DATABASE_URL,
      hasStorage: !!process.env.FIREBASE_STORAGE_BUCKET
    });

  } catch (error) {
    logger.error('Firebase initialization failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Get Firebase Auth instance.
 *
 * @function getAuth
 * @returns {admin.auth.Auth} Firebase Auth instance
 * @throws {Error} When Firebase is not initialized
 *
 * @example
 * import { getAuth } from './config/firebase.js';
 * const auth = getAuth();
 * const user = await auth.getUser(uid);
 */
export function getAuth() {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin SDK not initialized. Call initializeFirebase() first.');
  }
  return admin.auth();
}

/**
 * Get Firebase Firestore instance.
 *
 * @function getFirestore
 * @returns {admin.firestore.Firestore} Firestore instance
 * @throws {Error} When Firebase is not initialized
 *
 * @example
 * import { getFirestore } from './config/firebase.js';
 * const db = getFirestore();
 * const doc = await db.collection('users').doc(uid).get();
 */
export function getFirestore() {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin SDK not initialized. Call initializeFirebase() first.');
  }
  return admin.firestore();
}

/**
 * Get Firebase Storage instance.
 *
 * @function getStorage
 * @returns {admin.storage.Storage} Storage instance
 * @throws {Error} When Firebase is not initialized
 *
 * @example
 * import { getStorage } from './config/firebase.js';
 * const storage = getStorage();
 * const bucket = storage.bucket();
 */
export function getStorage() {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin SDK not initialized. Call initializeFirebase() first.');
  }
  return admin.storage();
}

/**
 * Verify Firebase ID token and return decoded token.
 *
 * @async
 * @function verifyIdToken
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token with user information
 * @throws {Error} When token is invalid or expired
 *
 * @example
 * import { verifyIdToken } from './config/firebase.js';
 *
 * try {
 *   const decodedToken = await verifyIdToken(clientToken);
 *   console.log('User ID:', decodedToken.uid);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 */
export async function verifyIdToken(idToken) {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Firebase token verification failed', {
      error: error.message
    });
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user data from Firebase Auth by UID.
 *
 * @async
 * @function getUserById
 * @param {string} uid - User UID
 * @returns {Promise<admin.auth.UserRecord>} User record
 * @throws {Error} When user is not found
 *
 * @example
 * import { getUserById } from './config/firebase.js';
 *
 * const user = await getUserById('user-uid-here');
 * console.log('User email:', user.email);
 */
export async function getUserById(uid) {
  try {
    const auth = getAuth();
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    logger.error('Failed to get user by ID', {
      uid,
      error: error.message
    });
    throw new Error(`User not found: ${uid}`);
  }
}

/**
 * Set custom claims for a user (for role-based access).
 *
 * @async
 * @function setCustomClaims
 * @param {string} uid - User UID
 * @param {Object} claims - Custom claims object
 * @param {string} [claims.role] - User role (admin, user, etc.)
 * @returns {Promise<void>}
 * @throws {Error} When operation fails
 *
 * @example
 * import { setCustomClaims } from './config/firebase.js';
 *
 * // Make user an admin
 * await setCustomClaims('user-uid', { role: 'admin' });
 */
export async function setCustomClaims(uid, claims) {
  try {
    const auth = getAuth();
    await auth.setCustomUserClaims(uid, claims);
    logger.info('Custom claims set successfully', { uid, claims });
  } catch (error) {
    logger.error('Failed to set custom claims', {
      uid,
      claims,
      error: error.message
    });
    throw error;
  }
}

/**
 * Create a new user in the system.
 *
 * @async
 * @function createUser
 * @param {Object} userData - User data
 * @param {string} userData.firebaseUid - Firebase UID
 * @param {string} userData.email - User email
 * @param {string} userData.displayName - Display name
 * @param {string} [userData.profileImage] - Profile image URL
 * @param {string} [userData.role='user'] - User role
 * @returns {Promise<Object>} Created user data
 * @throws {Error} When creation fails
 */
export async function createUser(userData) {
  try {
    const { firebaseUid, email, displayName, profileImage, role = 'user' } = userData;

    // Set custom claims for role-based access
    await setCustomClaims(firebaseUid, { role });

    // For now, we'll return the user data since we don't have a database model
    // In a real app, you'd save this to MongoDB
    const user = {
      id: firebaseUid,
      firebaseUid,
      email,
      displayName,
      profileImage,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info('User created successfully', { userId: firebaseUid, email });
    return user;
  } catch (error) {
    logger.error('Failed to create user', {
      userData,
      error: error.message
    });
    throw error;
  }
}

/**
 * Update user data.
 *
 * @async
 * @function updateUser
 * @param {string} firebaseUid - Firebase UID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated user data
 * @throws {Error} When update fails
 */
export async function updateUser(firebaseUid, updates) {
  try {
    // Get current user
    const currentUser = await getUserById(firebaseUid);

    // For now, we'll return merged data since we don't have a database model
    // In a real app, you'd update this in MongoDB
    const updatedUser = {
      id: firebaseUid,
      firebaseUid,
      email: currentUser.email,
      displayName: updates.displayName || currentUser.displayName,
      profileImage: updates.profileImage || currentUser.photoURL,
      role: updates.role || 'user', // You'd get this from database
      createdAt: currentUser.metadata?.creationTime || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates
    };

    logger.info('User updated successfully', { userId: firebaseUid });
    return updatedUser;
  } catch (error) {
    logger.error('Failed to update user', {
      firebaseUid,
      updates,
      error: error.message
    });
    throw error;
  }
}

// Export admin instance for advanced usage
export { admin };
