const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const { ServerApiVersion } = require('mongodb');
const User = require('../models/User');
const Download = require('../models/Download');
const Uninstall = require('../models/Uninstall');
const UserActivity = require('../models/UserActivity');

// Programmatically set DNS to bypass local ISP blocks for SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {}

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/analytics_dashboard';

const platforms = ['android', 'ios'];
const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0'];
const countries = ['IN', 'US', 'GB', 'DE', 'FR', 'CA', 'AU', 'SG'];
const uninstallReasons = ['app_crash', 'bad_ui', 'storage_full', 'no_longer_needed', 'other'];
const actions = ['page_view', 'click_button', 'share', 'purchase', 'search'];

// Helper to generate a random date in the last N days
const getRandomDateInPast = (days) => {
  const date = new Date();
  const randomMinutes = Math.floor(Math.random() * days * 24 * 60);
  date.setMinutes(date.getMinutes() - randomMinutes);
  return date;
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(MONGO_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    console.log(`[Seed] Connected to ${MONGO_URI}`);

    // Clean existing database
    console.log('[Seed] Cleaning old records...');
    await User.deleteMany({});
    await Download.deleteMany({});
    await Uninstall.deleteMany({});
    await UserActivity.deleteMany({});
    console.log('[Seed] Database cleared.');

    // 1. Seed Admin User
    console.log('[Seed] Seeding Admin user...');
    const admin = new User({
      username: 'admin',
      password: 'admin123', // Will be hashed automatically by schema middleware
      email: 'admin@alphathoughts.com',
      role: 'admin',
    });
    await admin.save();
    console.log('[Seed] Admin user created. Username: "admin", Password: "admin123"');

    // 2. Generate DIDs (Users) - 5,000 records
    console.log('[Seed] Seeding 5,000 DID registrations...');
    const usersBatch = [];
    for (let i = 0; i < 5000; i++) {
      const cryptoId = `did:key:z6MkpTHR8VNs${Math.random().toString(36).substring(2, 15)}`;
      usersBatch.push({
        did: cryptoId,
        role: 'user',
        createdAt: getRandomDateInPast(90),
      });
    }
    await User.insertMany(usersBatch);
    console.log('[Seed] DIDs seeded.');

    // Fetch created user DIDs for linking activities
    const seededUsers = await User.find({ role: 'user' }).select('did');
    const userDids = seededUsers.map(u => u.did);

    // 3. Generate Downloads - 50,000 records
    console.log('[Seed] Seeding 50,000 Download logs...');
    const downloadsBatch = [];
    for (let i = 0; i < 50000; i++) {
      downloadsBatch.push({
        downloadDate: getRandomDateInPast(90),
        platform: platforms[Math.floor(Math.random() * 2)],
        version: versions[Math.floor(Math.random() * versions.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
      });
    }
    await Download.insertMany(downloadsBatch);
    console.log('[Seed] Downloads seeded.');

    // 4. Generate Uninstalls - 25,000 records
    console.log('[Seed] Seeding 25,000 Uninstall logs...');
    const uninstallsBatch = [];
    for (let i = 0; i < 25000; i++) {
      uninstallsBatch.push({
        uninstallDate: getRandomDateInPast(90),
        platform: platforms[Math.floor(Math.random() * 2)],
        version: versions[Math.floor(Math.random() * versions.length)],
        reason: uninstallReasons[Math.floor(Math.random() * uninstallReasons.length)],
      });
    }
    await Uninstall.insertMany(uninstallsBatch);
    console.log('[Seed] Uninstalls seeded.');

    // 5. Generate User Activity - 20,000 records
    console.log('[Seed] Seeding 20,000 User Activity logs...');
    const activityBatch = [];
    for (let i = 0; i < 20000; i++) {
      const randomDid = userDids[Math.floor(Math.random() * userDids.length)];
      activityBatch.push({
        lastSeen: getRandomDateInPast(90),
        userId: randomDid,
        action: actions[Math.floor(Math.random() * actions.length)],
      });
    }
    await UserActivity.insertMany(activityBatch);
    console.log('[Seed] User Activity seeded.');

    console.log('\n[Seed Success] Successfully seeded exactly 100,000 records into the database!');
    process.exit(0);
  } catch (err) {
    console.error(`[Seed Failure] Error: ${err.message}`);
    process.exit(1);
  }
};

seedDatabase();
