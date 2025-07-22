#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase, initializeDatabase } from '../server/config/database.js';
import { logger } from '../server/middleware/logger.js';

// Import all models to ensure they're registered
import {
  User,
  Document,
  Version,
  Category,
  Comment
} from '../server/models/index.js';

dotenv.config();

/**
 * Initialize database with collections and seed data.
 */
async function initDatabase() {
  try {
    logger.info('Starting database initialization...');

    // Connect to database
    await connectToDatabase();

    // Initialize collections and indexes
    await initializeDatabase();

    // Create default categories
    await createDefaultCategories();

    // Create admin user (if doesn't exist)
    await createAdminUser();

    logger.info('Database initialization completed successfully!');
    process.exit(0);

  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    process.exit(1);
  }
}

/**
 * Create default categories.
 */
async function createDefaultCategories() {
  try {
    const defaultCategories = [
      {
        name: 'General',
        slug: 'general',
        description: 'General documents and notes',
        depth: 0,
        path: ['general']
      },
      {
        name: 'Technical',
        slug: 'technical',
        description: 'Technical documentation',
        depth: 0,
        path: ['technical']
      },
      {
        name: 'Tutorials',
        slug: 'tutorials',
        description: 'How-to guides and tutorials',
        depth: 0,
        path: ['tutorials']
      },
      {
        name: 'API Documentation',
        slug: 'api-docs',
        description: 'API reference and documentation',
        depth: 0,
        path: ['api-docs']
      }
    ];

    for (const categoryData of defaultCategories) {
      const existing = await Category.findOne({ slug: categoryData.slug });
      if (!existing) {
        const category = new Category(categoryData);
        await category.save();
        logger.info(`Created default category: ${category.name}`);
      }
    }
  } catch (error) {
    logger.warn('Failed to create default categories', { error: error.message });
  }
}

/**
 * Create default admin user.
 */
async function createAdminUser() {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      logger.info('Admin user already exists');
      return;
    }

    // Note: You'll need to create this user in Firebase first
    // then update this script with the actual Firebase UID
    logger.info('To create an admin user:');
    logger.info('1. Create a user in Firebase Console');
    logger.info('2. Get the Firebase UID');
    logger.info('3. Run: npm run make:admin <firebase-uid> <email>');

  } catch (error) {
    logger.warn('Failed to create admin user', { error: error.message });
  }
}

// Run initialization
initDatabase();
