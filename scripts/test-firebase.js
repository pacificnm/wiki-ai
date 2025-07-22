#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Script to test Firebase authentication setup.
 *
 * Usage: node scripts/test-firebase.js
 */

import dotenv from 'dotenv';
import { initializeFirebase, getAuth, verifyIdToken } from '../server/config/firebase.js';

// Load environment variables
dotenv.config();

/**
 * Test Firebase initialization and configuration.
 *
 * @async
 * @function testFirebaseSetup
 * @returns {Promise<boolean>} True if all tests pass
 */
async function testFirebaseSetup() {
  let allTestsPassed = true;

  try {
    // Test 1: Environment Variables


    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
      allTestsPassed = false;
    } else {
      console.log('✅ All required environment variables are set');
      console.log(`   📋 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
      console.log(`   📧 Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
      console.log(`   🔑 Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? 'Set (hidden)' : 'Not set'}`);
    }

    // Test 2: Firebase Initialization
    console.log('\n2️⃣ Testing Firebase initialization...');

    await initializeFirebase();
    console.log('✅ Firebase Admin SDK initialized successfully');

    // Test 3: Auth Service
    console.log('\n3️⃣ Testing Auth service...');

    const auth = getAuth();
    console.log('✅ Firebase Auth service is accessible');

    // Test 4: List first few users (if any)
    console.log('\n4️⃣ Checking for existing users...');

    try {
      const listUsersResult = await auth.listUsers(3); // Get first 3 users
      console.log(`✅ Found ${listUsersResult.users.length} users in the project`);

      if (listUsersResult.users.length > 0) {
        console.log('   👥 Sample users:');
        listUsersResult.users.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.email || 'No email'} (${user.uid})`);
          if (user.customClaims && user.customClaims.role) {
            console.log(`         Role: ${user.customClaims.role}`);
          }
        });
      } else {
        console.log('   💡 No users found. Create users through your frontend app.');
      }
    } catch (error) {
      console.log(`⚠️  Could not list users: ${error.message}`);
    }

    // Test 5: Optional services
    console.log('\n5️⃣ Checking optional services...');

    if (process.env.FIREBASE_DATABASE_URL) {
      console.log(`✅ Realtime Database URL configured: ${process.env.FIREBASE_DATABASE_URL}`);
    } else {
      console.log('ℹ️  Realtime Database URL not configured (optional)');
    }

    if (process.env.FIREBASE_STORAGE_BUCKET) {
      console.log(`✅ Storage Bucket configured: ${process.env.FIREBASE_STORAGE_BUCKET}`);
    } else {
      console.log('ℹ️  Storage Bucket not configured (optional)');
    }

  } catch (error) {
    console.log(`❌ Error during testing: ${error.message}`);
    allTestsPassed = false;

    // Provide specific troubleshooting advice
    if (error.message.includes('private_key')) {
      console.log('\n🔍 Troubleshooting private key issues:');
      console.log('1. Make sure the private key includes the BEGIN/END lines');
      console.log('2. Ensure \\n characters are preserved in the environment variable');
      console.log('3. The private key should be wrapped in double quotes in .env');
    } else if (error.message.includes('project_id')) {
      console.log('\n🔍 Troubleshooting project ID issues:');
      console.log('1. Check the project ID matches your Firebase project');
      console.log('2. Make sure there are no extra spaces or characters');
    } else if (error.message.includes('client_email')) {
      console.log('\n🔍 Troubleshooting client email issues:');
      console.log('1. Use the service account email from the downloaded JSON');
      console.log('2. It should end with @your-project.iam.gserviceaccount.com');
    }
  }

  // Final results
  console.log('\n📋 Test Results:');
  if (allTestsPassed) {
    console.log('🎉 All tests passed! Firebase is configured correctly.');
    console.log('\n🚀 Next steps:');
    console.log('1. Create users through your frontend app');
    console.log('2. Use scripts/make-admin.js to make users admins');
    console.log('3. Test authentication in your app');
  } else {
    console.log('❌ Some tests failed. Please check the issues above.');
    console.log('\n📚 Resources:');
    console.log('- Firebase Setup Guide: wiki-ai.wiki/Firebase-Setup.md');
    console.log('- Environment Variables: wiki-ai.wiki/Env.md');
    console.log('- Firebase Console: https://console.firebase.google.com/');
  }

  return allTestsPassed;
}

/**
 * Test token verification (if token is provided).
 *
 * @async
 * @function testTokenVerification
 * @param {string} token - Firebase ID token
 * @returns {Promise<void>}
 */
async function testTokenVerification(token) {
  console.log('\n🔐 Testing token verification...');

  try {
    const decodedToken = await verifyIdToken(token);
    console.log('✅ Token verification successful!');
    console.log(`   👤 User ID: ${decodedToken.uid}`);
    console.log(`   📧 Email: ${decodedToken.email}`);
    console.log(`   ✉️ Email Verified: ${decodedToken.email_verified}`);
    console.log(`   👑 Role: ${decodedToken.role || 'user'}`);
    console.log(`   ⏰ Expires: ${new Date(decodedToken.exp * 1000)}`);
  } catch (error) {
    console.log(`❌ Token verification failed: ${error.message}`);
    console.log('\n💡 To get a valid token:');
    console.log('1. Sign in to your frontend app');
    console.log('2. In browser console: await firebase.auth().currentUser.getIdToken()');
    console.log('3. Run: node scripts/test-firebase.js <token>');
  }
}

/**
 * Main function.
 *
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
  const token = process.argv[2]; // Optional token argument

  try {
    const setupPassed = await testFirebaseSetup();

    if (setupPassed && token) {
      await testTokenVerification(token);
    }

    process.exit(setupPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Run the script
main();
