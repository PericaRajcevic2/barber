import React, { useState, useEffect } from 'react';
import './ManagementStyles.clean.css';

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews');
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Greška pri dohvaćanju recenzija');
        return;
      }
      
      setReviews(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Greška pri dohvaćanju recenzija');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reviews/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const updateReviewStatus = async (reviewId, newStatus) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || 'Greška pri ažuriranju statusa');
        return;
      }

      await fetchReviews();
      await fetchStats();
    } catch (err) {
      console.error('Error updating review:', err);
      alert('Greška pri ažuriranju recenzije');
    }
  };

  const togglePublic = async (reviewId, currentPublic) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentPublic })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || 'Greška pri ažuriranju');
        return;
      }

      await fetchReviews();
    } catch (err) {
      console.error('Error toggling public:', err);
      alert('Greška pri ažuriranju recenzije');
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovu recenziju?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || 'Greška pri brisanju');
        return;
      }

      await fetchReviews();
      await fetchStats();
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Greška pri brisanju recenzije');
    }
  };

  const getStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Na čekanju', color: '#ffc107', bg: '#fff8e1' },
      approved: { text: 'Odobreno', color: '#28a745', bg: '#e8f5e9' },
      rejected: { text: 'Odbijeno', color: '#dc3545', bg: '#ffebee' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span style={{
        background: badge.bg,
        color: badge.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 'bold'
      }}>
        {badge.text}
      </span>
    );
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.status === filter;
  });

  if (loading && reviews.length === 0) {
    return <div className="loading">Učitavam recenzije...</div>;
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>📝 Upravljanje Recenzijama</h2>
        <button onClick={fetchReviews} className="btn-refresh">
          🔄 Osvježi
        </button>
      </div>

      {error && (
        <div className="error-message" style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Statistika */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalReviews}</div>
            <div style={{ opacity: 0.9, marginTop: '5px' }}>Ukupno Recenzija</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.avgRating.toFixed(1)} ⭐
            </div>
            <div style={{ opacity: 0.9, marginTop: '5px' }}>Prosječna Ocjena</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.pendingReviews}</div>
            <div style={{ opacity: 0.9, marginTop: '5px' }}>Na Čekanju</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
              Distribucija
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {stats.ratingDistribution.map(d => (
                <div key={d._id}>{d._id}⭐: {d.count}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'all' ? '#667eea' : '#f0f0f0',
            color: filter === 'all' ? 'white' : '#333',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Sve ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'pending' ? '#ffc107' : '#f0f0f0',
            color: filter === 'pending' ? 'white' : '#333',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Na čekanju ({reviews.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'approved' ? '#28a745' : '#f0f0f0',
            color: filter === 'approved' ? 'white' : '#333',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Odobreno ({reviews.filter(r => r.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'rejected' ? '#dc3545' : '#f0f0f0',
            color: filter === 'rejected' ? 'white' : '#333',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Odbijeno ({reviews.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {/* Lista recenzija */}
      <div className="items-list">
        {filteredReviews.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#999'
          }}>
            Nema recenzija za prikaz
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review._id} className="item-card" style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '15px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{review.customerName}</h3>
                  <div style={{ fontSize: '24px', margin: '5px 0' }}>
                    {getStars(review.rating)}
                  </div>
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                    {new Date(review.createdAt).toLocaleString('hr-HR')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {getStatusBadge(review.status)}
                  {review.isPublic && (
                    <div style={{
                      marginTop: '8px',
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      👁️ Javno
                    </div>
                  )}
                </div>
              </div>

              {review.comment && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  fontStyle: 'italic',
                  borderLeft: '4px solid #667eea'
                }}>
                  "{review.comment}"
                </div>
              )}

              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Email:</strong> {review.customerEmail}
                </p>
                {review.service && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>Usluga:</strong> {review.service.name}
                  </p>
                )}
              </div>

              {/* Akcije */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateReviewStatus(review._id, 'approved')}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✅ Odobri
                    </button>
                    <button
                      onClick={() => updateReviewStatus(review._id, 'rejected')}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ❌ Odbij
                    </button>
                  </>
                )}

                {review.status === 'approved' && (
                  <button
                    onClick={() => togglePublic(review._id, review.isPublic)}
                    style={{
                      background: review.isPublic ? '#ff9800' : '#2196f3',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {review.isPublic ? '🔒 Sakrij' : '👁️ Objavi'}
                  </button>
                )}

                {review.status !== 'pending' && (
                  <button
                    onClick={() => updateReviewStatus(review._id, 'pending')}
                    style={{
                      background: '#ffc107',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ⏸️ Vrati na čekanje
                  </button>
                )}

                <button
                  onClick={() => deleteReview(review._id)}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🗑️ Obriši
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsManagement;
