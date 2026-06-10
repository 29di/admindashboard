const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Download = require('../models/Download');
const Uninstall = require('../models/Uninstall');
const UserActivity = require('../models/UserActivity');
const User = require('../models/User');

// Helper to compute date filter boundaries
const getDateRange = (query) => {
  const { filterType, startDate, endDate } = query;
  const now = new Date();
  let start = null;
  let end = now;

  switch (filterType) {
    case 'today':
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case '7d':
      start = new Date();
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start = new Date();
      start.setDate(now.getDate() - 30);
      break;
    case '90d':
      start = new Date();
      start.setDate(now.getDate() - 90);
      break;
    case 'custom':
      if (startDate) start = new Date(startDate);
      if (endDate) end = new Date(endDate);
      break;
    default:
      // Lifetime - start remains null
      break;
  }

  return { start, end };
};

// 1. Downloads Analytics
// GET /api/dashboard/downloads
router.get('/downloads', authenticateToken, async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);

    // Lifetime totals
    const lifetimeAgg = await Download.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
        },
      },
    ]);

    const totals = { android: 0, ios: 0, total: 0 };
    lifetimeAgg.forEach((item) => {
      if (item._id === 'android') totals.android = item.count;
      if (item._id === 'ios') totals.ios = item.count;
    });
    totals.total = totals.android + totals.ios;

    // Filtered totals (if range is defined)
    let filtered = null;
    if (start) {
      const matchStage = {
        downloadDate: { $gte: start, $lte: end },
      };

      const filteredAgg = await Download.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 },
          },
        },
      ]);

      filtered = { android: 0, ios: 0, total: 0 };
      filteredAgg.forEach((item) => {
        if (item._id === 'android') filtered.android = item.count;
        if (item._id === 'ios') filtered.ios = item.count;
      });
      filtered.total = filtered.android + filtered.ios;
    }

    res.json({
      totalDownloads: totals.total,
      androidDownloads: totals.android,
      iosDownloads: totals.ios,
      filtered: filtered || totals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. DID Creation Analytics
// GET /api/dashboard/dids
router.get('/dids', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    
    // Total DIDs Created
    const totalDids = await User.countDocuments({ role: 'user' });

    // DIDs Created Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const todayDids = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    // DIDs Created This Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyDids = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth },
    });

    res.json({
      totalDids,
      todayDids,
      monthlyDids,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Uninstall Analytics
// GET /api/dashboard/uninstalls
router.get('/uninstalls', authenticateToken, async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);

    // Lifetime uninstalls
    const lifetimeAgg = await Uninstall.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
        },
      },
    ]);

    const totals = { android: 0, ios: 0, total: 0 };
    lifetimeAgg.forEach((item) => {
      if (item._id === 'android') totals.android = item.count;
      if (item._id === 'ios') totals.ios = item.count;
    });
    totals.total = totals.android + totals.ios;

    // Filtered uninstalls
    let filtered = null;
    if (start) {
      const filteredAgg = await Uninstall.aggregate([
        {
          $match: {
            uninstallDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 },
          },
        },
      ]);

      filtered = { android: 0, ios: 0, total: 0 };
      filteredAgg.forEach((item) => {
        if (item._id === 'android') filtered.android = item.count;
        if (item._id === 'ios') filtered.ios = item.count;
      });
      filtered.total = filtered.android + filtered.ios;
    }

    res.json({
      totalUninstalls: totals.total,
      androidUninstalls: totals.android,
      iosUninstalls: totals.ios,
      filtered: filtered || totals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Daily Active Users (DAU) Trend
// GET /api/dashboard/dau
router.get('/dau', authenticateToken, async (req, res) => {
  try {
    // Default to last 30 days if no filter specified
    let { start, end } = getDateRange(req.query);
    if (!start) {
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    const dauAgg = await UserActivity.aggregate([
      {
        $match: {
          lastSeen: { $gte: start, $lte: end },
        },
      },
      {
        // Extract date format YYYY-MM-DD
        $project: {
          dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$lastSeen' } },
          userId: 1,
        },
      },
      {
        // Group by day and user to make unique
        $group: {
          _id: { dateStr: '$dateStr', userId: '$userId' },
        },
      },
      {
        // Group by day and count unique active users
        $group: {
          _id: '$_id.dateStr',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format output for charts
    const trendData = dauAgg.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    res.json(trendData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Weekly Active Users (WAU) Trend
// GET /api/dashboard/wau
router.get('/wau', authenticateToken, async (req, res) => {
  try {
    let { start, end } = getDateRange(req.query);
    if (!start) {
      start = new Date();
      start.setDate(start.getDate() - 90); // Default to last 90 days for weekly/monthly contexts
    }

    const wauAgg = await UserActivity.aggregate([
      {
        $match: {
          lastSeen: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          // Format as Year-WeekNumber
          weekStr: {
            $concat: [
              { $dateToString: { format: '%Y', date: '$lastSeen' } },
              '-W',
              { $dateToString: { format: '%U', date: '$lastSeen' } },
            ],
          },
          userId: 1,
        },
      },
      {
        $group: {
          _id: { weekStr: '$weekStr', userId: '$userId' },
        },
      },
      {
        $group: {
          _id: '$_id.weekStr',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trendData = wauAgg.map((item) => ({
      week: item._id,
      count: item.count,
    }));

    res.json(trendData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Monthly Active Users (MAU) Trend
// GET /api/dashboard/mau
router.get('/mau', authenticateToken, async (req, res) => {
  try {
    let { start, end } = getDateRange(req.query);
    if (!start) {
      start = new Date();
      start.setDate(start.getDate() - 365); // Default to last 12 months for MAU
    }

    const mauAgg = await UserActivity.aggregate([
      {
        $match: {
          lastSeen: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          // Format as YYYY-MM
          monthStr: { $dateToString: { format: '%Y-%m', date: '$lastSeen' } },
          userId: 1,
        },
      },
      {
        $group: {
          _id: { monthStr: '$monthStr', userId: '$userId' },
        },
      },
      {
        $group: {
          _id: '$_id.monthStr',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trendData = mauAgg.map((item) => ({
      month: item._id,
      count: item.count,
    }));

    res.json(trendData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
