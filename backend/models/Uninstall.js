const mongoose = require('mongoose');

const uninstallSchema = new mongoose.Schema(
  {
    uninstallDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['android', 'ios'],
      index: true,
    },
    version: String,
    reason: String,
  },
  {
    // Enable native MongoDB Time-Series configuration
    timeseries: {
      timeField: 'uninstallDate',
      metaField: 'platform',
      granularity: 'seconds',
    },
    autoCreate: true,
  }
);

// Compound indexes for fast aggregations
uninstallSchema.index({ uninstallDate: -1, platform: 1 });

module.exports = mongoose.model('Uninstall', uninstallSchema);
