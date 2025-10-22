const express = require('express');
const router = express.Router();

let emailService;
try {
  emailService = require('../utils/emailService');
} catch (e) {
  // ignore
}

function guard(req, res) {
  const token = req.query.token || req.headers['x-debug-token'];
  const expected = process.env.DEBUG_TOKEN;
  if (!expected || token !== expected) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return null;
}

// GET /api/debug/env?token=...
router.get('/env', (req, res) => {
  const denied = guard(req, res); if (denied) return;
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    APP_URL: process.env.APP_URL,
    has_MONGODB_URI: Boolean(process.env.MONGODB_URI),
    has_EMAIL_USER: Boolean(process.env.EMAIL_USER),
    has_EMAIL_PASS: Boolean(process.env.EMAIL_PASS),
    has_WHATSAPP_TOKEN: Boolean(process.env.WHATSAPP_TOKEN),
    has_WHATSAPP_PHONE_ID: Boolean(process.env.WHATSAPP_PHONE_ID)
  });
});

// POST /api/debug/email?to=...&token=...
router.post('/email', async (req, res) => {
  const denied = guard(req, res); if (denied) return;
  try {
    if (!emailService) return res.status(500).json({ message: 'emailService unavailable' });
    const to = (req.query.to || '').trim();
    if (!to) return res.status(400).json({ message: 'Missing to' });

    // Fake appointment sample
    const now = new Date();
    const appointment = {
      customerName: 'Test Korisnik',
      customerEmail: to,
      customerPhone: process.env.BARBER_PHONE || '000',
      service: { name: 'Test Usluga', price: 0, duration: 30 },
      date: now,
      notes: 'Test poruka iz /api/debug/email'
    };
    const ok = await emailService.sendAppointmentConfirmation(appointment);
    res.json({ success: ok === true, sent: ok === true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Simple ping
router.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

module.exports = router;
