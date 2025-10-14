const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0-6 (nedjelja-subota)
    required: true,
    min: 0,
    max: 6
  },
  dayName: {
    type: String,
    required: true
  },
  startTime: {
    type: String, // format "HH:MM"
    required: true
  },
  endTime: {
    type: String, // format "HH:MM"
    required: true
  },
  isWorking: {
    type: Boolean,
    default: true
  }
});

// Spriječi duplikate za isti dan
workingHoursSchema.index({ dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('WorkingHours', workingHoursSchema);