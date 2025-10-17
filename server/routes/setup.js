const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const WorkingHours = require('../models/WorkingHours');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// POST /api/setup/seed - Inicijalni seed podataka (samo jednom!)
router.post('/seed', async (req, res) => {
  try {
    // Provjeri da li već postoje podaci
    const servicesCount = await Service.countDocuments();
    const workingHoursCount = await WorkingHours.countDocuments();
    
    if (servicesCount > 0 || workingHoursCount > 0) {
      return res.status(400).json({ 
        message: 'Podaci već postoje u bazi!',
        services: servicesCount,
        workingHours: workingHoursCount
      });
    }

    // Dodaj usluge
    const services = await Service.insertMany([
      {
        name: 'Šišanje',
        duration: 30,
        price: 50,
        description: 'Osnovno šišanje'
      },
      {
        name: 'Brijanje',
        duration: 20,
        price: 30,
        description: 'Brijanje mašinicom ili žiletom'
      },
      {
        name: 'Šišanje i brijanje',
        duration: 50,
        price: 70,
        description: 'Komplet usluga'
      },
      {
        name: 'Pranje kose',
        duration: 15,
        price: 20,
        description: 'Pranje i masaža glave'
      }
    ]);

    // Dodaj radno vrijeme (Monday = 1, Sunday = 0)
    const workingHours = await WorkingHours.insertMany([
      { dayOfWeek: 1, dayName: 'Ponedjeljak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 2, dayName: 'Utorak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 3, dayName: 'Srijeda', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 4, dayName: 'Četvrtak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 5, dayName: 'Petak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 6, dayName: 'Subota', startTime: '10:00', endTime: '15:00', isWorking: true },
      { dayOfWeek: 0, dayName: 'Nedjelja', startTime: '00:00', endTime: '00:00', isWorking: false }
    ]);

    // Dodaj default admin usera ako ne postoji
    const adminExists = await User.findOne({ username: 'admin' });
    let adminCreated = false;
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      adminCreated = true;
    }

    res.json({
      success: true,
      message: 'Baza uspješno seedana!',
      data: {
        services: services.length,
        workingHours: workingHours.length,
        adminCreated: adminCreated
      }
    });

  } catch (error) {
    console.error('❌ Seed error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri seedanju baze',
      error: error.message 
    });
  }
});

// GET /api/setup/status - Provjeri status baze
router.get('/status', async (req, res) => {
  try {
    const servicesCount = await Service.countDocuments();
    const workingHoursCount = await WorkingHours.countDocuments();
    const usersCount = await User.countDocuments();
    
    const services = await Service.find();
    const workingHours = await WorkingHours.find().sort({ dayOfWeek: 1 });

    res.json({
      database: 'connected',
      counts: {
        services: servicesCount,
        workingHours: workingHoursCount,
        users: usersCount
      },
      needsSeeding: servicesCount === 0 || workingHoursCount === 0,
      data: {
        services,
        workingHours
      }
    });
  } catch (error) {
    res.status(500).json({ 
      database: 'error',
      message: error.message 
    });
  }
});

// POST /api/setup/reset - OPASNO! Reset cijele baze (samo za dev)
router.post('/reset', async (req, res) => {
  try {
    // Samo u development modu
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        message: 'Reset nije dozvoljen u production modu!' 
      });
    }

    await Service.deleteMany({});
    await WorkingHours.deleteMany({});
    await User.deleteMany({});

    res.json({
      success: true,
      message: 'Baza resetana! Pozovi /api/setup/seed da dodaš nove podatke.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;
