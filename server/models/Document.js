import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  tags: [String],
  autoTags: [String],
  summary: { type: String },
  currentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Version' },
  versionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Version' }],
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  commentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  attachmentPaths: [String],
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for efficient queries
documentSchema.index({ userId: 1 });
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ updatedAt: -1 });
documentSchema.index({ isPublished: 1, publishedAt: -1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ categoryIds: 1 });

// Compound indexes for common queries
documentSchema.index({ userId: 1, isPublished: 1, updatedAt: -1 });
documentSchema.index({ userId: 1, createdAt: -1 });

// Update the updatedAt field on save
documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Document', documentSchema);
