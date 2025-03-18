const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  entries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entry',
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Middleware to update lastUpdated when collection is modified
collectionSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Collection', collectionSchema); 