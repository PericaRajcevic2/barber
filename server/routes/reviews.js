const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET /api/reviews - Dohvati sve recenzije (javne)
router.get('/', async (req, res) => {
  try {
    const { public_only } = req.query;
    
    let filter = {};
    if (public_only === 'true') {
      filter = { isPublic: true, status: 'approved' };
    }
    
    const reviews = await Review.find(filter)
      .populate('service', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reviews/stats - Statistika recenzija
router.get('/stats', async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments({ status: 'approved' });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    
    const avgRatingResult = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    
    const avgRating = avgRatingResult.length > 0 
      ? parseFloat(avgRatingResult[0].avgRating.toFixed(1)) 
      : 0;
    
    const ratingDistribution = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);
    
    res.json({
      totalReviews,
      pendingReviews,
      avgRating,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reviews - Kreiraj novu recenziju
router.post('/', async (req, res) => {
  try {
    const { customerName, customerEmail, appointmentId, serviceId, rating, comment } = req.body;
    
    if (!customerName || !customerEmail || !rating) {
      return res.status(400).json({ message: 'Ime, email i ocjena su obavezni' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Ocjena mora biti između 1 i 5' });
    }
    
    const review = new Review({
      customerName,
      customerEmail,
      appointment: appointmentId || undefined,
      service: serviceId || undefined,
      rating,
      comment,
      status: 'pending'
    });
    
    await review.save();
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/reviews/:id - Ažuriraj recenziju (approve/reject/edit)
router.put('/:id', async (req, res) => {
  try {
    const { status, isPublic, comment } = req.body;
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Recenzija nije pronađena' });
    }
    
    if (status !== undefined) {
      review.status = status;
      if (status === 'approved') {
        review.approvedAt = new Date();
      }
    }
    
    if (isPublic !== undefined) {
      review.isPublic = isPublic;
    }
    
    if (comment !== undefined) {
      review.comment = comment;
    }
    
    await review.save();
    
    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/reviews/:id - Obriši recenziju
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Recenzija nije pronađena' });
    }
    
    res.json({ message: 'Recenzija obrisana' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
