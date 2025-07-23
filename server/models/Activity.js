import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'document_created',
      'document_updated',
      'document_deleted',
      'document_published',
      'document_viewed',
      'favorite_added',
      'favorite_removed',
      'comment_added',
      'comment_updated',
      'comment_deleted',
      'category_created',
      'category_updated',
      'user_login',
      'user_logout'
    ]
  },
  entityType: {
    type: String,
    enum: ['Document', 'Comment', 'Category', 'User'],
    required: function () {
      return this.entityId != null;
    }
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  title: {
    type: String
  },
  description: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient queries
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ createdAt: -1 });

// Compound index for user activity timeline
activitySchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
