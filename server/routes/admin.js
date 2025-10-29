const express = require('express');
const mongoose = require('mongoose');
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
    
    // Izračunaj prihod, ali samo za appointment-e koji imaju validnu service referencu
    const revenue = appointments.reduce((total, apt) => {
      if (apt.service && typeof apt.service.price === 'number') {
        return total + apt.service.price;
      }
      return total;
    }, 0);

    // Popularne usluge (samo one koje imaju validnu service)
    const serviceCounts = {};
    appointments.forEach(apt => {
      if (!apt.service) return; // preskoči ako nema service

      const serviceId = apt.service._id.toString();
      if (!serviceCounts[serviceId]) {
        serviceCounts[serviceId] = {
          _id: serviceId,
          name: apt.service.name || '(unknown)',
          count: 0,
          revenue: 0
        };
      }
      serviceCounts[serviceId].count++;
      serviceCounts[serviceId].revenue += (typeof apt.service.price === 'number' ? apt.service.price : 0);
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

// GET /api/admin/statistics/charts - Dohvati podatke za chartove
router.get('/statistics/charts', async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    
    let startDate = new Date();
    let groupBy = 'day';
    
    switch (range) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        groupBy = 'day';
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        groupBy = 'day';
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = 'month';
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
        groupBy = 'day';
    }

    // Dohvati sve narudžbe u periodu
    const appointments = await Appointment.find({
      date: { $gte: startDate },
      status: { $in: ['pending', 'confirmed', 'completed'] }
    }).populate('service').sort({ date: 1 });

    // Revenue i appointments over time
    const timeSeriesData = {};
    appointments.forEach(apt => {
      const dateKey = groupBy === 'day' 
        ? apt.date.toISOString().split('T')[0]
        : `${apt.date.getFullYear()}-${String(apt.date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!timeSeriesData[dateKey]) {
        timeSeriesData[dateKey] = {
          date: dateKey,
          appointments: 0,
          revenue: 0
        };
      }
      
      timeSeriesData[dateKey].appointments++;
      if (apt.service && typeof apt.service.price === 'number') {
        timeSeriesData[dateKey].revenue += apt.service.price;
      }
    });

    const revenueOverTime = Object.values(timeSeriesData).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Top 5 services
    const serviceCounts = {};
    appointments.forEach(apt => {
      if (!apt.service) return;
      const serviceId = apt.service._id.toString();
      if (!serviceCounts[serviceId]) {
        serviceCounts[serviceId] = {
          name: apt.service.name || '(unknown)',
          count: 0,
          revenue: 0
        };
      }
      serviceCounts[serviceId].count++;
      serviceCounts[serviceId].revenue += (typeof apt.service.price === 'number' ? apt.service.price : 0);
    });

    const topServices = Object.values(serviceCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Customer stats: new vs returning
    const customerEmails = new Set();
    const customerPhones = new Set();
    let newCustomers = 0;
    let returningCustomers = 0;

    // Get all appointments before startDate to identify returning customers
    const allPreviousAppointments = await Appointment.find({
      date: { $lt: startDate }
    });

    const previousEmails = new Set(allPreviousAppointments.map(a => a.customerEmail));
    const previousPhones = new Set(allPreviousAppointments.map(a => a.customerPhone));

    appointments.forEach(apt => {
      const email = apt.customerEmail;
      const phone = apt.customerPhone;
      const identifier = email || phone;
      
      if (!customerEmails.has(identifier)) {
        customerEmails.add(identifier);
        
        // Check if this customer had appointments before the current period
        if (previousEmails.has(email) || previousPhones.has(phone)) {
          returningCustomers++;
        } else {
          newCustomers++;
        }
      }
    });

    // Total revenue stats
    const totalRevenue = appointments.reduce((sum, apt) => 
      sum + (apt.service && typeof apt.service.price === 'number' ? apt.service.price : 0), 0
    );

    const confirmedRevenue = appointments
      .filter(apt => apt.status === 'confirmed' || apt.status === 'completed')
      .reduce((sum, apt) => 
        sum + (apt.service && typeof apt.service.price === 'number' ? apt.service.price : 0), 0
      );

    res.json({
      revenueOverTime,
      topServices,
      customerStats: {
        new: newCustomers,
        returning: returningCustomers,
        total: newCustomers + returningCustomers
      },
      revenueStats: {
        total: totalRevenue,
        confirmed: confirmedRevenue,
        pending: totalRevenue - confirmedRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching chart statistics:', error);
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

// POST /api/admin/working-hours/reset - Postavi zadano radno vrijeme ako nema podataka
router.post('/working-hours/reset', async (req, res) => {
  try {
    const count = await WorkingHours.countDocuments();
    if (count > 0) {
      const existing = await WorkingHours.find().sort({ dayOfWeek: 1 });
      return res.json(existing);
    }

    const defaults = [
      { dayOfWeek: 1, dayName: 'Ponedjeljak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 2, dayName: 'Utorak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 3, dayName: 'Srijeda', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 4, dayName: 'Četvrtak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 5, dayName: 'Petak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 6, dayName: 'Subota', startTime: '10:00', endTime: '15:00', isWorking: true },
      { dayOfWeek: 0, dayName: 'Nedjelja', startTime: '00:00', endTime: '00:00', isWorking: false }
    ];

    const created = await WorkingHours.insertMany(defaults);
    res.status(201).json(created);
  } catch (error) {
    console.error('❌ Greška pri resetiranju radnog vremena:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/blocked-dates - Dohvati blokirane datume
router.get('/blocked-dates', async (req, res) => {
  try {
    const blockedDates = await BlockedDate.find().sort({ date: 1 });
    
    // Grupiraj datume po periodId ako postoji
    const groupedDates = blockedDates.reduce((acc, date) => {
      if (date.periodId) {
        if (!acc[date.periodId]) {
          acc[date.periodId] = {
            _id: date.periodId,
            startDate: date.date,
            endDate: date.date,
            reason: date.reason,
            allDay: date.allDay,
            startTime: date.startTime,
            endTime: date.endTime,
            createdAt: date.createdAt,
            dates: [date]
          };
        } else {
          acc[date.periodId].dates.push(date);
          if (date.date < acc[date.periodId].startDate) {
            acc[date.periodId].startDate = date.date;
          }
          if (date.date > acc[date.periodId].endDate) {
            acc[date.periodId].endDate = date.date;
          }
        }
      } else {
        // Pojedinačni datumi idu direktno u rezultat
        acc[date._id] = {
          _id: date._id,
          startDate: date.date,
          endDate: date.date,
          reason: date.reason,
          allDay: date.allDay,
          startTime: date.startTime,
          endTime: date.endTime,
          createdAt: date.createdAt,
          dates: [date]
        };
      }
      return acc;
    }, {});

    res.json(Object.values(groupedDates));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/blocked-dates - Kreiraj blokirani datum
router.post('/blocked-dates', async (req, res) => {
  try {
    const { date, startDate, endDate, reason, allDay = true, startTime, endTime } = req.body;

    if (!reason || (typeof reason !== 'string')) {
      return res.status(400).json({ message: 'Razlog je obavezan' });
    }

    // Validate time fields if not allDay
    if (!allDay) {
      if (!startTime || !endTime) {
        return res.status(400).json({ message: 'Za vremenski period potrebno je navesti početak i kraj' });
      }
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return res.status(400).json({ message: 'Format vremena mora biti HH:MM' });
      }
    }

    // Helper to create a BlockedDate doc
    const createForDate = async (d, periodData = {}) => {
      const doc = new BlockedDate({
        date: d,
        reason,
        allDay: !!allDay,
        startTime: allDay ? undefined : startTime,
        endTime: allDay ? undefined : endTime,
        ...periodData
      });
      return await doc.save();
    };

    if (startDate && endDate) {
      // Range mode
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return res.status(400).json({ message: 'Neispravan format datuma u rasponu' });
      }
      if (e < s) {
        return res.status(400).json({ message: 'Kraj perioda ne može biti prije početka' });
      }

      const periodId = new mongoose.Types.ObjectId().toString();
      const created = [];
      const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());

      while (cur <= e) {
        const isFirst = cur.getTime() === s.getTime();
        const isLast = cur.getTime() === e.getTime();
        
        const saved = await createForDate(new Date(cur), {
          periodId,
          isRangeStart: isFirst,
          isRangeEnd: isLast
        });
        created.push(saved);
        cur.setDate(cur.getDate() + 1);
      }

      return res.status(201).json(created);
    }

    if (date) {
      // Single date mode
      const single = new Date(date);
      if (isNaN(single.getTime())) {
        return res.status(400).json({ message: 'Neispravan datum' });
      }
      const saved = await createForDate(single);
      return res.status(201).json(saved);
    }

    return res.status(400).json({ message: 'Treba navesti date ili startDate i endDate' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/admin/blocked-dates/:id - Obriši blokirani datum ili period
router.delete('/blocked-dates/:id', async (req, res) => {
  try {
    const blockedDate = await BlockedDate.findById(req.params.id);
    if (!blockedDate) {
      return res.status(404).json({ message: 'Blokirani datum nije pronađen' });
    }

    if (blockedDate.periodId) {
      // Ako je dio perioda, obriši sve datume s istim periodId
      await BlockedDate.deleteMany({ periodId: blockedDate.periodId });
      res.json({ message: 'Period je obrisan' });
    } else {
      // Obriši samo pojedinačni datum
      await BlockedDate.findByIdAndDelete(req.params.id);
      res.json({ message: 'Blokirani datum obrisan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;