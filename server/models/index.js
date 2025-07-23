// Import all models to register them with Mongoose
// Order matters for models with circular references
import Category from './Category.js';
import Comment from './Comment.js';
import Document from './Document.js';
import User from './User.js';
import Version from './Version.js';

// Export all models
export {
  Category, Comment,
  Document, User, Version
};

// Re-export default models for easier importing
export default {
  User,
  Category,
  Version,
  Comment,
  Document
};

// You can add other models as you create them:
// import Attachment from './Attachment.js';
// import Log from './Log.js';
// import AiSuggestion from './AiSuggestion.js';
// import AccessControl from './AccessControl.js';
// import Session from './Session.js';
// import Analytics from './Analytics.js';
