const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    lastSeen: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: String,
  },
  {
    // Enable native MongoDB Time-Series configuration
    timeseries: {
      timeField: 'lastSeen',
      metaField: 'userId',
      granularity: 'seconds',
    },
    autoCreate: true,
  }
);

// Compound index for range querying user activity
userActivitySchema.index({ lastSeen: -1, userId: 1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
