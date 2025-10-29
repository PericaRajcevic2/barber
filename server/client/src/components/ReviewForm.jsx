import React, { useState } from 'react';
import './ReviewForm.css';

const ReviewForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    rating: 0,
    comment: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerEmail || !formData.rating) {
      alert('Molimo popunite ime, email i ocjenu');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) onSuccess();
        alert('✅ Hvala na recenziji! Vaša recenzija će biti vidljiva nakon odobrenja.');
        setFormData({
          customerName: '',
          customerEmail: '',
          rating: 0,
          comment: ''
        });
        if (onClose) onClose();
      } else {
        alert('❌ ' + (data.message || 'Greška pri slanju recenzije'));
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('❌ Greška pri slanju recenzije');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
  };

  return (
    <div className="review-form-overlay" onClick={onClose}>
      <div className="review-form-container" onClick={(e) => e.stopPropagation()}>
        <button className="review-form-close" onClick={onClose}>✕</button>
        
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>⭐ Ostavite Recenziju</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Vaše mišljenje nam je važno!
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ime i Prezime *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="Vaše ime"
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="vas.email@primjer.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Ocjena *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= (hoveredRating || formData.rating) ? 'filled' : ''}`}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => handleRatingClick(star)}
                >
                  ⭐
                </span>
              ))}
            </div>
            {formData.rating > 0 && (
              <p style={{ marginTop: '10px', color: '#667eea', fontWeight: 'bold' }}>
                {formData.rating === 5 && '🌟 Odlično!'}
                {formData.rating === 4 && '😊 Vrlo dobro!'}
                {formData.rating === 3 && '👍 Dobro'}
                {formData.rating === 2 && '😐 Može bolje'}
                {formData.rating === 1 && '😞 Razočarani ste?'}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Komentar (opciono)</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Podijelite svoje iskustvo..."
              rows="4"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Odustani
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Šaljem...' : '✅ Pošalji Recenziju'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
