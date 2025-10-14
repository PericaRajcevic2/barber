const mongoose = require('mongoose');

const blockedDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  allDay: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: String // format "HH:MM" - samo ako allDay = false
  },
  endTime: {
    type: String // format "HH:MM" - samo ako allDay = false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BlockedDate', blockedDateSchema);