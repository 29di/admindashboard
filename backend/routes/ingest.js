const express = require('express');
const router = express.Router();
const Download = require('../models/Download');
const Uninstall = require('../models/Uninstall');
const UserActivity = require('../models/UserActivity');
const User = require('../models/User');
const { broadcast } = require('../services/socket');

// Ingest Download Event
router.post('/download', async (req, res) => {
  try {
    const { platform, version, country } = req.body;
    if (!platform || !['android', 'ios'].includes(platform)) {
      return res.status(400).json({ error: 'Valid platform (android/ios) is required' });
    }

    const newDownload = new Download({
      platform,
      version: version || '1.0.0',
      country: country || 'US',
      downloadDate: new Date(),
    });

    await newDownload.save();

    // Broadcast live update to WebSockets
    broadcast('download_event', {
      platform,
      downloadDate: newDownload.downloadDate,
    });

    res.status(202).json({ message: 'Download event logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest Uninstall Event
router.post('/uninstall', async (req, res) => {
  try {
    const { platform, version, reason } = req.body;
    if (!platform || !['android', 'ios'].includes(platform)) {
      return res.status(400).json({ error: 'Valid platform (android/ios) is required' });
    }

    const newUninstall = new Uninstall({
      platform,
      version: version || '1.0.0',
      reason: reason || 'not_specified',
      uninstallDate: new Date(),
    });

    await newUninstall.save();

    // Broadcast live update to WebSockets
    broadcast('uninstall_event', {
      platform,
      uninstallDate: newUninstall.uninstallDate,
    });

    res.status(202).json({ message: 'Uninstall event logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest User Activity Event
router.post('/activity', async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const newActivity = new UserActivity({
      userId,
      action: action || 'page_view',
      lastSeen: new Date(),
    });

    await newActivity.save();

    // Broadcast live update to WebSockets
    broadcast('activity_event', {
      userId,
      lastSeen: newActivity.lastSeen,
    });

    res.status(202).json({ message: 'Activity event logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest DID Registration Event (User sign-up)
router.post('/did', async (req, res) => {
  try {
    const { did } = req.body;
    if (!did) {
      return res.status(400).json({ error: 'did string is required' });
    }

    // Check if DID already exists to prevent duplicates
    const existing = await User.findOne({ did, role: 'user' });
    if (existing) {
      return res.status(200).json({ message: 'DID already registered', exists: true });
    }

    const newUser = new User({
      did,
      role: 'user',
      createdAt: new Date(),
    });

    await newUser.save();

    // Broadcast live update to WebSockets
    broadcast('did_event', {
      did,
      createdAt: newUser.createdAt,
    });

    res.status(202).json({ message: 'DID created/registered successfully', exists: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
