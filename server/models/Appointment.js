const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  googleCalendarEventId: {
    type: String,
    trim: true
  },
  cancellationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  cancellationReason: {
    type: String,
    enum: ['illness', 'emergency', 'mistake', 'schedule_conflict', 'other', ''],
    default: ''
  },
  cancellationNote: {
    type: String,
    trim: true
  },
  cancelledAt: {
    type: Date
  },
  rescheduledFrom: {
    type: Date
  },
  // Email tracking
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },
  followUpSent: {
    type: Boolean,
    default: false
  },
  followUpSentAt: {
    type: Date
  },
  emailTracking: {
    reminderOpened: { type: Boolean, default: false },
    reminderOpenedAt: { type: Date },
    followUpOpened: { type: Boolean, default: false },
    followUpOpenedAt: { type: Date },
    reviewLinkClicked: { type: Boolean, default: false },
    reviewLinkClickedAt: { type: Date }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);