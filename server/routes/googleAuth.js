const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const calendarService = require('../utils/calendarService');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/auth/google/callback'
);

// Spremi tokene globalno (u produkciji koristi bazu)
let storedTokens = null;

// Generiraj URL za Google OAuth
router.get('/google', (req, res) => {
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
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Postavi tokene za OAuth klijenta
    oauth2Client.setCredentials(tokens);
    
    // Postavi autentifikaciju za calendar service
    calendarService.setAuthClient(oauth2Client);
    
    // Spremi tokene (u produkciji spremi u bazu)
    storedTokens = tokens;

    console.log('✅ Google OAuth uspješan! Kalendar je povezan.');

    // Preusmjeri na frontend sa uspješnom porukom
    res.redirect('http://localhost:3000/admin?googleAuth=success');
  } catch (error) {
    console.error('❌ Greška pri Google OAuth:', error);
    res.redirect('http://localhost:3000/admin?googleAuth=error');
  }
});

// Provjeri status autentifikacije
router.get('/google/status', (req, res) => {
  const isAuthenticated = calendarService.isAuthenticated() && storedTokens !== null;
  res.json({ 
    authenticated: isAuthenticated,
    hasTokens: storedTokens !== null
  });
});

// Odspoji Google Calendar
router.post('/google/disconnect', (req, res) => {
  storedTokens = null;
  calendarService.setAuthClient(null);
  console.log('✅ Google Calendar odspojen');
  res.json({ success: true, message: 'Google Calendar je uspješno odspojen' });
});

module.exports = router;