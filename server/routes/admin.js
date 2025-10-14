const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const WorkingHours = require('../models/WorkingHours');
const BlockedDate = require('../models/BlockedDate');
const Appointment = require('../models/Appointment');

// GET /api/admin/statistics - Dohvati statistiku
router.get('/statistics', async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    
    // Izračunaj datum početka na temelju range-a
    const startDate = new Date();
    switch (range) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'quarter':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Dohvati sve narudžbe u periodu
    const appointments = await Appointment.find({
      date: { $gte: startDate },
      status: { $in: ['pending', 'confirmed', 'completed'] }
    }).populate('service');

    // Izračunaj statistike
    const totalAppointments = appointments.length;
    const confirmedAppointments = appointments.filter(apt => 
      apt.status === 'confirmed' || apt.status === 'completed'
    ).length;
    
    const revenue = appointments.reduce((total, apt) => total + apt.service.price, 0);
    
    // Popularne usluge
    const serviceCounts = {};
    appointments.forEach(apt => {
      const serviceId = apt.service._id.toString();
      if (!serviceCounts[serviceId]) {
        serviceCounts[serviceId] = {
          _id: serviceId,
          name: apt.service.name,
          count: 0,
          revenue: 0
        };
      }
      serviceCounts[serviceId].count++;
      serviceCounts[serviceId].revenue += apt.service.price;
    });

    const popularServices = Object.values(serviceCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      totalAppointments,
      confirmedAppointments,
      revenue,
      popularServices
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/services - Dohvati sve usluge (i neaktivne)
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/services - Kreiraj novu uslugu
router.post('/services', async (req, res) => {
  try {
    const service = new Service(req.body);
    const savedService = await service.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/admin/services/:id - Ažuriraj uslugu
router.put('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!service) {
      return res.status(404).json({ message: 'Usluga nije pronađena' });
    }
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/admin/services/:id - Obriši uslugu
router.delete('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Usluga nije pronađena' });
    }
    res.json({ message: 'Usluga obrisana' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/working-hours - Dohvati radno vrijeme
router.get('/working-hours', async (req, res) => {
  try {
    const workingHours = await WorkingHours.find().sort({ dayOfWeek: 1 });
    res.json(workingHours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/working-hours - Postavi radno vrijeme
router.post('/working-hours', async (req, res) => {
  try {
    await WorkingHours.deleteMany({});
    const workingHours = await WorkingHours.insertMany(req.body);
    res.status(201).json(workingHours);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/admin/blocked-dates - Dohvati blokirane datume
router.get('/blocked-dates', async (req, res) => {
  try {
    const blockedDates = await BlockedDate.find().sort({ date: 1 });
    res.json(blockedDates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/blocked-dates - Kreiraj blokirani datum
router.post('/blocked-dates', async (req, res) => {
  try {
    const blockedDate = new BlockedDate(req.body);
    const savedBlockedDate = await blockedDate.save();
    res.status(201).json(savedBlockedDate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/admin/blocked-dates/:id - Obriši blokirani datum
router.delete('/blocked-dates/:id', async (req, res) => {
  try {
    const blockedDate = await BlockedDate.findByIdAndDelete(req.params.id);
    if (!blockedDate) {
      return res.status(404).json({ message: 'Blokirani datum nije pronađen' });
    }
    res.json({ message: 'Blokirani datum obrisan' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;