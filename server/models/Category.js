import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  path: [{ type: String }],
  depth: { type: Number, default: 0 },
  icon: { type: String, default: '📁' }, // Category icon (emoji)
  color: { type: String, default: '#1976d2' } // Category color (hex)
});

// Add indexes for category queries
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1 });
categorySchema.index({ depth: 1 });
categorySchema.index({ path: 1 });

// Virtual for full path string
categorySchema.virtual('fullPath').get(function () {
  return this.path.join('/');
});

// Ensure virtuals are included when converting to JSON
categorySchema.set('toJSON', { virtuals: true });

export default mongoose.model('Category', categorySchema);
