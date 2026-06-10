const mongoose = require('mongoose');
const { ServerApiVersion } = require('mongodb');
const dns = require('dns');

// Programmatically set Node's internal resolver to Google DNS to bypass ISP blocking DNS SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log('[DNS] Programmatically set resolvers to Google/Cloudflare DNS to bypass local SRV blocks.');
} catch (dnsErr) {
  console.warn('[DNS Warning] Failed to override DNS resolvers: ', dnsErr.message);
}

const connectDB = async () => {
  try {
    console.log("Connecting to Mongo URI:", process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://db_admin:Dk5Ip7i1ICAD0jUT@admindashboard.lgxcntw.mongodb.net', {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 8000, // Slightly longer selection window
      socketTimeoutMS: 45000,
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[MongoDB Connection Error] Message: ${err.message}`);
    console.log('Ensure MongoDB Atlas config or check your MONGO_URI in .env');
  }
};

module.exports = connectDB;
