const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Cancellation settings
  cancellationTimeLimit: {
    type: Number,
    default: 2, // hours before appointment
    min: 0,
    max: 72
  },
  allowReschedule: {
    type: Boolean,
    default: true
  },
  rescheduleTimeLimit: {
    type: Number,
    default: 2, // hours before appointment
    min: 0,
    max: 72
  },
  // Business info
  businessName: {
    type: String,
    default: 'Barber Shop'
  },
  businessPhone: {
    type: String,
    default: '+385 99 123 4567'
  },
  businessAddress: {
    type: String,
    default: 'Primjer ulica 123, Zagreb'
  },
  // Email settings
  googleReviewUrl: {
    type: String,
    default: 'https://g.page/r/YOUR_BUSINESS_ID/review'
  },
  // Integrations
  googleCalendarEnabled: {
    type: Boolean,
    default: false
  },
  // Break times
  breakSlots: [{
    startTime: { type: String, required: true }, // HH:MM format
    endTime: { type: String, required: true },   // HH:MM format
    description: { type: String, default: 'Pauza' }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Singleton pattern - samo jedan settings dokument
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
