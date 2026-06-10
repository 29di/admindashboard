const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'alpha_thoughts_analytics_dashboard_secret_2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Expecting format: Bearer TOKEN_STRING
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is required. Access Denied.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
