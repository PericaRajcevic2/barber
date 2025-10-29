import React, { useState, useEffect } from 'react';
import './PublicReviews.css';

const PublicReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews?public_only=true');
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  if (loading) {
    return null;
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="public-reviews-section">
      <h2>⭐ Što kažu naši klijenti</h2>
      <div className="reviews-grid">
        {reviews.slice(0, 6).map(review => (
          <div key={review._id} className="review-card">
            <div className="review-stars">{getStars(review.rating)}</div>
            <p className="review-comment">"{review.comment}"</p>
            <p className="review-author">- {review.customerName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicReviews;
