const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// GET /api/services - Dohvati sve usluge
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/services - Kreiraj novu uslugu (samo admin)
router.post('/', async (req, res) => {
  try {
    const service = new Service(req.body);
    const savedService = await service.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/services/:id - Ažuriraj uslugu
router.put('/:id', async (req, res) => {
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

// DELETE /api/services/:id - Soft delete usluge
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!service) {
      return res.status(404).json({ message: 'Usluga nije pronađena' });
    }
    res.json({ message: 'Usluga deaktivirana' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/services/reorder - Ažuriraj redoslijed usluga
router.put('/reorder', async (req, res) => {
  try {
    const { services } = req.body; // [{ _id, displayOrder }, ...]
    
    const updates = services.map(({ _id, displayOrder }) =>
      Service.findByIdAndUpdate(_id, { displayOrder }, { new: true })
    );
    
    await Promise.all(updates);
    
    const updatedServices = await Service.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    res.json(updatedServices);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;