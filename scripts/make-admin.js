#!/usr/bin/env node

/**
 * Script to make a user an admin in the Firebase project.
 * 
 * Usage: node scripts/make-admin.js <user-uid>
 * 
 * @example
 * node scripts/make-admin.js abc123def456ghi789
 */

import { setCustomClaims, getUserById, initializeFirebase } from '../server/config/firebase.js';
import { logger } from '../server/middleware/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main function to set admin role for a user.
 * 
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // Get user UID from command line arguments
    const userUID = process.argv[2];
    
    if (!userUID) {
      console.error('❌ Error: Please provide a user UID');
      console.log('📖 Usage: node scripts/make-admin.js <user-uid>');
      console.log('💡 You can find the UID in Firebase Console → Authentication → Users');
      process.exit(1);
    }

    console.log('🔥 Initializing Firebase...');
    
    // Initialize Firebase
    await initializeFirebase();
    
    console.log('👤 Checking if user exists...');
    
    // Verify user exists
    const user = await getUserById(userUID);
    
    console.log(`✅ Found user: ${user.email || user.displayName || 'Unknown'}`);
    console.log(`📧 Email: ${user.email || 'Not set'}`);
    console.log(`📱 Display Name: ${user.displayName || 'Not set'}`);
    console.log(`✉️ Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    
    // Set admin role
    console.log('🔧 Setting admin role...');
    
    await setCustomClaims(userUID, { 
      role: 'admin',
      isAdmin: true,
      permissions: ['read', 'write', 'delete', 'admin']
    });
    
    console.log('🎉 Success! User is now an admin.');
    console.log('📝 Custom claims set:');
    console.log('   - role: admin');
    console.log('   - isAdmin: true');
    console.log('   - permissions: [read, write, delete, admin]');
    console.log('');
    console.log('⚠️  Note: The user may need to sign out and sign back in for changes to take effect.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('User not found')) {
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('1. Make sure the UID is correct');
      console.log('2. Check that the user exists in Firebase Console → Authentication');
      console.log('3. User must have signed up through your app first');
    } else if (error.message.includes('Firebase Admin SDK not initialized')) {
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('1. Check your .env file has FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      console.log('2. Make sure the Firebase service account credentials are correct');
      console.log('3. Verify the private key format includes \\n characters');
    }
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Run the script
main();
