// ── JWT Auth Middleware ──
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.farmer = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token. Please login again.' });
  }
};
