const express = require('express');
const router = express.Router();
const WorkingHours = require('../models/WorkingHours');

// GET /api/working-hours - Dohvati radno vrijeme
router.get('/', async (req, res) => {
  try {
    const workingHours = await WorkingHours.find().sort({ dayOfWeek: 1 });
    res.json(workingHours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/working-hours - Postavi radno vrijeme
router.post('/', async (req, res) => {
  try {
    // Briši postojeće i kreiraj nove
    await WorkingHours.deleteMany({});
    
    const workingHoursData = req.body.map(day => ({
      dayOfWeek: day.dayOfWeek,
      dayName: day.dayName,
      startTime: day.startTime,
      endTime: day.endTime,
      isWorking: day.isWorking
    }));
    
    const workingHours = await WorkingHours.insertMany(workingHoursData);
    res.status(201).json(workingHours);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/working-hours/:id - Ažuriraj radno vrijeme za određeni dan
router.put('/:id', async (req, res) => {
  try {
    const workingHour = await WorkingHours.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!workingHour) {
      return res.status(404).json({ message: 'Radno vrijeme nije pronađeno' });
    }
    res.json(workingHour);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;