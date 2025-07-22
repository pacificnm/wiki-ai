import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  displayName: { type: String },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Add indexes for authentication and queries
userSchema.index({ firebaseUid: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    displayName: this.displayName,
    email: this.email,
    role: this.role,
    profileImage: this.profileImage
  };
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });

export default mongoose.model('User', userSchema);
