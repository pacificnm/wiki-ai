import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  markdown: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String },
  wordCount: { type: Number },
  charCount: { type: Number },
  isMinor: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Add indexes for version queries
versionSchema.index({ documentId: 1, createdAt: -1 });
versionSchema.index({ createdBy: 1 });
versionSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate word and character counts
versionSchema.pre('save', function(next) {
  if (this.markdown) {
    this.charCount = this.markdown.length;
    this.wordCount = this.markdown.split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

export default mongoose.model('Version', versionSchema);
