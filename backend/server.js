require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const socketService = require('./services/socket');

// Route Imports
const authRoutes = require('./routes/auth');
const ingestRoutes = require('./routes/ingest');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const server = http.createServer(app);

// Port Configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Socket.io WebSocket Server
socketService.init(server);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  next();
});

// Mounting Routes
app.use('/api/auth', authRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base / Health Route
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 API Endpoint: http://localhost:${PORT}`);
  console.log(`🔌 WebSockets: Enabled on same port`);
  console.log(`===============================================`);
});

// Error handling middleware to prevent app crash
app.use((err, req, res, next) => {
  console.error(`[Express Error Handler] Message: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});
