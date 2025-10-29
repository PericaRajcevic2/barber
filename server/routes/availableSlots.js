const express = require('express');
const router = express.Router();
const WorkingHours = require('../models/WorkingHours');
const Appointment = require('../models/Appointment');
const BlockedDate = require('../models/BlockedDate');
const Settings = require('../models/Settings');

// GET /api/available-slots?date=YYYY-MM-DD - Dohvati dostupne termine za određeni dan
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Datum je obavezan' });
    }

  // Tretiraj incoming YYYY-MM-DD kao LOKALNI datum (bez pomaka)
  const [y, m, d] = date.split('-').map(Number);
  const selectedDate = new Date(y, m - 1, d, 0, 0, 0, 0); // lokalni početak dana

  const today = new Date();
  today.setHours(0, 0, 0, 0);

    // Provjeri je li datum u prošlosti
    if (selectedDate < today) {
      return res.json([]);
    }

    // Provjeri je li datum blokiran
    // Koristi lokalne granice dana, ali za upit u bazi pretvori ih u ISO (UTC) stringove
    const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);

    const blockedDate = await BlockedDate.findOne({
      date: {
        $gte: startOfDay,
        $lt: new Date(endOfDay.getTime() + 1)
      }
    });

    if (blockedDate) {
      return res.json([]);
    }

  // Pronađi radno vrijeme za taj dan koristeći LOKALNI dan u tjednu
  const dayOfWeek = selectedDate.getDay(); // 0-6 local (nedjelja-subota)
  const workingHours = await WorkingHours.findOne({ dayOfWeek });

    if (!workingHours || !workingHours.isWorking) {
      return res.json([]);
    }

    // Generiraj sve moguće termine
    const timeSlots = generateTimeSlots(workingHours.startTime, workingHours.endTime, 30);
    
    // Dohvati break slots iz settings
    const settings = await Settings.getSettings();
    const breakSlots = settings.breakSlots || [];
    
    // Filtriraj break slots
    const breakTimes = [];
    breakSlots.forEach(breakSlot => {
      const breakSlotTimes = generateTimeSlots(breakSlot.startTime, breakSlot.endTime, 30);
      breakTimes.push(...breakSlotTimes);
    });
    
    // ⭐⭐ ISPRAVNO: Pronađi ZAUZETE termine za TAJ DAN u UTC ⭐⭐
    // Pripremi ISO granice za upit (DB pohranjuje u UTC)
    const startIso = startOfDay.toISOString();
    const endIso = new Date(endOfDay.getTime() + 1).toISOString();

    const appointments = await Appointment.find({
      date: {
        $gte: new Date(startIso),
        $lt: new Date(endIso)
      },
      status: { $in: ['pending', 'confirmed'] }
    }).populate('service');

  console.log(`🔍 Tražim termine za (lokalno): ${selectedDate.toString()}`);
  console.log(`📅 Lokalni raspon: ${startOfDay.toString()} - ${endOfDay.toString()}`);
  console.log(`📅 ISO raspon za DB upit: ${startIso} - ${endIso}`);
    console.log(`📋 Pronađeno ${appointments.length} zauzetih termina:`);
    
    appointments.forEach(apt => {
      // Guard against missing populated service (could be deleted)
      const serviceName = apt.service ? apt.service.name : '(unknown service)';
      try {
        console.log(`   - ${apt.date.toISOString()} | ${apt.customerName} | ${serviceName}`);
      } catch (err) {
        console.log('   - (invalid appointment object)', apt);
      }
    });

    // Filtriraj zauzete termine - pretvori appointment.date (UTC) u LOKALNO vrijeme
    const bookedSlots = appointments.map(appointment => {
      const appointmentTime = new Date(appointment.date);
      // Vrati vrijeme u formatu HH:MM iz LOKALNOG vremena
      return appointmentTime.getHours().toString().padStart(2, '0') + ':' + 
             appointmentTime.getMinutes().toString().padStart(2, '0');
    });

    console.log(`🕒 Zauzeti termini:`, bookedSlots);
    console.log(`✅ Dostupni termini:`, timeSlots.filter(slot => !bookedSlots.includes(slot)));

    // Provjeri koji termini su prošli ako je danas
    const now = new Date();
    const monthIndex = m - 1;
    const isToday = startOfDay.getFullYear() === now.getFullYear() &&
                    startOfDay.getMonth() === now.getMonth() &&
                    startOfDay.getDate() === now.getDate();

    // Kreiraj objekte sa svim slotovima i njihovim statusom
    const allSlotsWithStatus = timeSlots.map(slot => {
      const [hh, mm] = slot.split(':').map(Number);
      const slotDate = new Date(y, monthIndex, d, hh, mm, 0, 0);
      
      let status = 'available';
      
      // Provjeri je li termin u break slotu
      if (breakTimes.includes(slot)) {
        status = 'break';
      }
      // Provjeri je li termin prošao (samo za danas)
      else if (isToday && slotDate.getTime() <= now.getTime()) {
        status = 'past';
      }
      // Provjeri je li termin zauzet
      else if (bookedSlots.includes(slot)) {
        status = 'booked';
      }
      
      return {
        time: slot,
        status: status
      };
    });

    console.log(`⏱️ Svi termini sa statusom:`, allSlotsWithStatus);
    
    res.json(allSlotsWithStatus);
  } catch (error) {
    console.error('❌ Error fetching available slots:', error);
    res.status(500).json({ message: error.message });
  }
});

// Pomocna funkcija za generiranje vremenskih slotova
function generateTimeSlots(start, end, interval) {
  const slots = [];
  // Koristi lokalno vrijeme (HR) za generiranje slotova
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let currentTime = new Date(1970, 0, 1, startH, startM, 0, 0);
  const endTime = new Date(1970, 0, 1, endH, endM, 0, 0);

  while (currentTime < endTime) {
    const timeString = currentTime.getHours().toString().padStart(2, '0') + ':' +
                       currentTime.getMinutes().toString().padStart(2, '0');
    slots.push(timeString);
    currentTime = new Date(currentTime.getTime() + interval * 60000);
  }
  
  return slots;
}

module.exports = router;