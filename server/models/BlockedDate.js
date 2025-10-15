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
  },
  // Za grupiranje datuma koji su dio istog perioda
  periodId: {
    type: String,
    index: true
  },
  // Prvi i zadnji datum u periodu (za prikaz raspona)
  isRangeStart: Boolean,
  isRangeEnd: Boolean
});

module.exports = mongoose.model('BlockedDate', blockedDateSchema);