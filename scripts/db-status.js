#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToDatabase } from '../server/config/database.js';
import { logger } from '../server/middleware/logger.js';
import { User, Document, Version, Category, Comment } from '../server/models/index.js';

dotenv.config();

/**
 * Show database status and collection counts
 */
async function checkDatabase() {
  try {
    console.log('📊 Checking database status...\n');

    await connectToDatabase();

    const collections = [
      { name: 'Users', model: User, icon: '👤' },
      { name: 'Documents', model: Document, icon: '📄' },
      { name: 'Versions', model: Version, icon: '🔄' },
      { name: 'Categories', model: Category, icon: '📁' },
      { name: 'Comments', model: Comment, icon: '💬' }
    ];

    console.log('📈 Collection Counts:');
    console.log('─'.repeat(40));

    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      console.log(`${collection.icon} ${collection.name}: ${count}`);
    }

    console.log('\n📋 Sample Categories:');
    console.log('─'.repeat(40));
    const categories = await Category.find().select('name description').limit(5);
    
    if (categories.length > 0) {
      categories.forEach(cat => {
        console.log(`📁 ${cat.name}: ${cat.description}`);
      });
    } else {
      console.log('No categories found');
    }

    console.log('\n📋 Sample Users:');
    console.log('─'.repeat(40));
    const users = await User.find().select('email displayName role createdAt').limit(5);
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`👤 ${user.displayName || user.email} (${user.role}) - ${user.createdAt.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('No users found');
    }

    console.log('\n✅ Database connection healthy!');
    process.exit(0);

  } catch (error) {
    logger.error('Failed to check database status', { error: error.message });
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  }
}

checkDatabase();
