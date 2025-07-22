import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Version' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  location: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Add indexes for comment queries
commentSchema.index({ documentId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ versionId: 1 });

export default mongoose.model('Comment', commentSchema);
