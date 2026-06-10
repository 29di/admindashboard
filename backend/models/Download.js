const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema(
  {
    downloadDate: {
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
    country: String,
  },
  {
    // Enable native MongoDB Time-Series configuration
    timeseries: {
      timeField: 'downloadDate',
      metaField: 'platform',
      granularity: 'seconds',
    },
    autoCreate: true,
  }
);

// Compound indexes for fast aggregations
downloadSchema.index({ downloadDate: -1, platform: 1 });

module.exports = mongoose.model('Download', downloadSchema);
