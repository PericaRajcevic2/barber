const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const calendarService = require('../utils/calendarService');
const GoogleToken = require('../models/GoogleToken');
const Settings = require('../models/Settings');

// Debug log za provjeru env varijabli
console.log('Google OAuth Environment Variables:');
console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
console.log('REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
);

// Tokens are stored in MongoDB via GoogleToken model

// Generiraj URL za Google OAuth
router.get('/', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    prompt: 'consent'
  });
  
  res.json({ authUrl });
});

// OAuth callback ruta
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Postavi tokene za OAuth klijenta
    oauth2Client.setCredentials(tokens);
    
    // Postavi autentifikaciju za calendar service
    calendarService.setAuthClient(oauth2Client);
    // Spremi tokene u bazu (upsert)
    await GoogleToken.setToken(tokens);

    console.log('✅ Google OAuth uspješan! Kalendar je povezan.');

    // Preusmjeri na frontend sa uspješnom porukom
    const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
    // Redirectaj na root sa query param da Admin panel može očitati status
    res.redirect(`${frontendUrl}/?googleAuth=success`);
  } catch (error) {
    console.error('❌ Greška pri Google OAuth:', error);
    const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
    res.redirect(`${frontendUrl}/?googleAuth=error`);
  }
});

// Provjeri status autentifikacije
router.get('/status', async (req, res) => {
  try {
    const tokenDoc = await GoogleToken.getToken();
    const settings = await Settings.getSettings();
    const hasTokens = !!tokenDoc;
    const enabled = !!settings.googleCalendarEnabled;
    const authenticated = calendarService.isAuthenticated();
    res.json({ 
      authenticated,
      hasTokens,
      enabled
    });
  } catch (e) {
    console.error('Status error:', e);
    res.json({ authenticated: false, hasTokens: false, enabled: false });
  }
});

// Odspoji Google Calendar
// Toggle integration on/off without deleting tokens
router.post('/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    const settings = await Settings.getSettings();
    settings.googleCalendarEnabled = !!enabled;
    await settings.save();
    res.json({ success: true, enabled: settings.googleCalendarEnabled });
  } catch (error) {
    console.error('Toggle error:', error);
    res.status(500).json({ success: false, message: 'Greška pri promjeni statusa' });
  }
});

// Optionally wipe tokens from DB
router.post('/disconnect', async (req, res) => {
  try {
    const wipe = req.query.wipe === 'true';
    if (wipe) {
      await GoogleToken.deleteMany({});
      console.log('🧹 Google tokens obrisani iz baze');
    }
    // Always clear in-memory auth client
    calendarService.setAuthClient(null);
    res.json({ success: true, message: wipe ? 'Tokeni obrisani i odspojeno' : 'Odspojeno (tokeni ostaju spremljeni)' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ success: false, message: 'Greška pri odspajanju' });
  }
});

// Google webhook endpoint for two-way sync (push notifications)
router.post('/webhook', async (req, res) => {
  // Acknowledge immediately
  res.status(200).end();
  try {
    const settings = await Settings.getSettings();
    if (!settings.googleCalendarEnabled) return;
    if (!calendarService.isAuthenticated() || !calendarService.calendar) return;

    const now = new Date();
    const updatedMin = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      console.warn('GOOGLE_CALENDAR_ID nije postavljen');
      return;
    }
    const resp = await calendarService.calendar.events.list({
      calendarId,
      updatedMin,
      showDeleted: true,
      maxResults: 50,
      singleEvents: false
    });
    const events = resp.data.items || [];
    if (events.length === 0) return;
    const Appointment = require('../models/Appointment');
    for (const evt of events) {
      const appt = await Appointment.findOne({ googleCalendarEventId: evt.id }).populate('service');
      if (!appt) continue;
      if (evt.status === 'cancelled') {
        if (appt.status !== 'cancelled') {
          appt.status = 'cancelled';
          await appt.save();
          console.log(`🔄 Webhook: Otkazan termin sync: ${appt._id}`);
        }
      } else if (evt.start && evt.start.dateTime) {
        const newDate = new Date(evt.start.dateTime);
        if (new Date(appt.date).getTime() !== newDate.getTime()) {
          appt.date = new Date(newDate.toISOString());
          await appt.save();
          console.log(`🔄 Webhook: Ažuriran termin vrijeme: ${appt._id}`);
        }
      }
    }
  } catch (error) {
    console.error('Webhook sync error:', error);
  }
});

module.exports = router;