#!/usr/bin/env node

import dotenv from 'dotenv';
import { initializeFirebase, verifyIdToken } from './server/config/firebase.js';

dotenv.config();

async function testFirebaseToken(token) {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    await initializeFirebase();
    console.log('✅ Firebase Admin SDK initialized successfully');

    console.log('🔍 Testing token verification...');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

    const decodedToken = await verifyIdToken(token);
    console.log('✅ Token verification successful!');
    console.log('Decoded token:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      email_verified: decodedToken.email_verified,
      iss: decodedToken.iss,
      aud: decodedToken.aud
    });

  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    console.error('Error details:', error);
  }
}

// Check if token was provided as command line argument
const token = process.argv[2];
if (!token) {
  console.log('Usage: node test-firebase-token.js <firebase-id-token>');
  console.log('');
  console.log('To get a token:');
  console.log('1. Sign in to your client app');
  console.log('2. Open browser dev tools');
  console.log('3. In console, run: firebase.auth().currentUser.getIdToken().then(console.log)');
  console.log('4. Copy the token and run this script');
  process.exit(1);
}

testFirebaseToken(token);
