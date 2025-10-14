const express = require('express');
const router = express.Router();
const WorkingHours = require('../models/WorkingHours');
const Appointment = require('../models/Appointment');
const BlockedDate = require('../models/BlockedDate');

// GET /api/available-slots?date=YYYY-MM-DD - Dohvati dostupne termine za određeni dan
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Datum je obavezan' });
    }

    // Koristi UTC datume za konzistentnost
    const selectedDate = new Date(date + 'T00:00:00.000Z'); // Postavi na početak dana u UTC
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Provjeri je li datum u prošlosti
    if (selectedDate < today) {
      return res.json([]);
    }

    // Provjeri je li datum blokiran
    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1); // Sljedeći dan u UTC

    const blockedDate = await BlockedDate.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    if (blockedDate) {
      return res.json([]);
    }

    // Pronađi radno vrijeme za taj dan (dan u tjednu je isti u svim zonama)
    const dayOfWeek = selectedDate.getUTCDay();
    const workingHours = await WorkingHours.findOne({ dayOfWeek });

    if (!workingHours || !workingHours.isWorking) {
      return res.json([]);
    }

    // Generiraj sve moguće termine
    const timeSlots = generateTimeSlots(workingHours.startTime, workingHours.endTime, 30);
    
    // ⭐⭐ ISPRAVNO: Pronađi ZAUZETE termine za TAJ DAN u UTC ⭐⭐
    const appointments = await Appointment.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] }
    }).populate('service');

    console.log(`🔍 Tražim termine za: ${selectedDate.toISOString()}`);
    console.log(`📅 Raspon: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
    console.log(`📋 Pronađeno ${appointments.length} zauzetih termina:`);
    
    appointments.forEach(apt => {
      console.log(`   - ${apt.date.toISOString()} | ${apt.customerName} | ${apt.service.name}`);
    });

    // Filtriraj zauzete termine - koristi UTC vrijeme za usporedbu
    const bookedSlots = appointments.map(appointment => {
      const appointmentTime = new Date(appointment.date);
      // Vrati vrijeme u formatu HH:MM iz UTC vremena
      return appointmentTime.getUTCHours().toString().padStart(2, '0') + ':' + 
             appointmentTime.getUTCMinutes().toString().padStart(2, '0');
    });

    console.log(`🕒 Zauzeti termini:`, bookedSlots);
    console.log(`✅ Dostupni termini:`, timeSlots.filter(slot => !bookedSlots.includes(slot)));

    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));
    
    res.json(availableSlots);
  } catch (error) {
    console.error('❌ Error fetching available slots:', error);
    res.status(500).json({ message: error.message });
  }
});

// Pomocna funkcija za generiranje vremenskih slotova
function generateTimeSlots(start, end, interval) {
  const slots = [];
  let currentTime = new Date(`1970-01-01T${start}:00Z`); // Koristi UTC
  const endTime = new Date(`1970-01-01T${end}:00Z`);
  
  while (currentTime < endTime) {
    const timeString = currentTime.getUTCHours().toString().padStart(2, '0') + ':' + 
                       currentTime.getUTCMinutes().toString().padStart(2, '0');
    slots.push(timeString);
    currentTime = new Date(currentTime.getTime() + interval * 60000);
  }
  
  return slots;
}

module.exports = router;