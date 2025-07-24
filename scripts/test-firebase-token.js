#!/usr/bin/env node

/**
 * Test script to validate Firebase token authentication
 * This script helps debug Firebase Auth token validation issues
 */

import dotenv from 'dotenv';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

async function testFirebaseConfig() {
  try {
    console.log('🔥 Testing Firebase Configuration...\n');

    // Check environment variables
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];

    console.log('📋 Checking environment variables:');
    let allVarsPresent = true;

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        console.log(`  ✅ ${varName}: ${varName === 'FIREBASE_PRIVATE_KEY' ? '[REDACTED]' : value.substring(0, 50)}...`);
      } else {
        console.log(`  ❌ ${varName}: Missing`);
        allVarsPresent = false;
      }
    }

    if (!allVarsPresent) {
      console.log('\n❌ Missing required environment variables');
      process.exit(1);
    }

    // Initialize Firebase Admin SDK
    console.log('\n🚀 Initializing Firebase Admin SDK...');

    if (admin.apps.length === 0) {
      const firebaseConfig = {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      };

      admin.initializeApp(firebaseConfig);
      console.log('  ✅ Firebase Admin SDK initialized successfully');
    } else {
      console.log('  ✅ Firebase Admin SDK already initialized');
    }

    // Test token verification with a dummy token
    console.log('\n🔑 Testing token verification...');
    try {
      await admin.auth().verifyIdToken('dummy-token');
    } catch (error) {
      if (error.message.includes('Firebase ID token has invalid signature') ||
        error.message.includes('Decoding Firebase ID token failed')) {
        console.log('  ✅ Token verification is working (expected error for invalid token)');
      } else {
        console.log(`  ❌ Unexpected error: ${error.message}`);
      }
    }

    console.log('\n🎉 Firebase configuration appears to be working correctly!');
    console.log('\n💡 Next steps:');
    console.log('   1. Get a real Firebase ID token from the client');
    console.log('   2. Test it against this configuration');
    console.log('   3. Ensure the same configuration is deployed to Railway');

  } catch (error) {
    console.error('❌ Firebase configuration test failed:', error.message);
    process.exit(1);
  }
}

testFirebaseConfig();
