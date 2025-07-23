import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index to ensure a user can only favorite a document once
favoriteSchema.index({ userId: 1, documentId: 1 }, { unique: true });

// Index for efficient queries
favoriteSchema.index({ userId: 1, createdAt: -1 });
favoriteSchema.index({ documentId: 1 });

export default mongoose.model('Favorite', favoriteSchema);
