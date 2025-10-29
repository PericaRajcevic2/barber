const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// GET /api/settings - Get current settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings - Update settings
router.put('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Update allowed fields
    const allowedFields = [
      'cancellationTimeLimit',
      'allowReschedule',
      'rescheduleTimeLimit',
      'businessName',
      'businessPhone',
      'businessAddress',
      'googleReviewUrl',
      'googleCalendarEnabled',
      'breakSlots'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });
    
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
