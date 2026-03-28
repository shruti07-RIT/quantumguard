// ══════════════════════════════════════════
//  QuantumGuard — Contact Route
//  Handles: Contact form submission
//  Matches: submitContact() in app.js
// ══════════════════════════════════════════
const express = require('express');
const router  = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, phone, subject, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Name, phone and message are required' });
  }
  if (phone.length < 10) {
    return res.status(400).json({ error: 'Enter a valid phone number' });
  }

  // In production you'd send an email here using Nodemailer
  // For now just log it and confirm
  console.log('📬 Contact form submission:', { name, phone, subject, message });

  res.json({
    success: true,
    message: "Message received! We'll respond within 24 hours.",
  });
});

module.exports = router;
