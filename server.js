// ══════════════════════════════════════════
//  QuantumGuard — Backend Server
// ══════════════════════════════════════════
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const app = express();

// ── MIDDLEWARE ──
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── SERVE FRONTEND (your dashboard files) ──
// Put your QuantumGuard-Dashboard folder next to this server
// and it will be served at http://localhost:5000
app.use(express.static(path.join(__dirname, 'QuantumGuard-Dashboard', 'QuantumGuard-Dashboard')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'QuantumGuard-Dashboard', 'QuantumGuard-Dashboard', 'index.html'));
});

// ── ROUTES ──
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/farmer',     require('./routes/farmer'));
app.use('/api/documents',  require('./routes/documents'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/contact',    require('./routes/contact'));

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'QuantumGuard backend is running' });
});

// ── CONNECT MONGODB + START SERVER ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(5000, () => {
      console.log('🚀 QuantumGuard server running at http://localhost:5000');
      console.log('📋 API endpoints available at http://localhost:5000/api');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
