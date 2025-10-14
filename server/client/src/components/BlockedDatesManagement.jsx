import React, { useState, useEffect } from 'react';
import './ManagementStyles.css';

const BlockedDatesManagement = () => {
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    reason: '',
    allDay: true,
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    try {
      const response = await fetch('/api/admin/blocked-dates');
      const data = await response.json();
      setBlockedDates(data);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/blocked-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchBlockedDates();
        resetForm();
      } else {
        alert('Greška pri kreiranju blokiranog datuma');
      }
    } catch (error) {
      console.error('Error creating blocked date:', error);
    }
  };

  const handleDelete = async (blockedDateId) => {
    if (window.confirm('Jeste li sigurni da želite ukloniti ovaj blokirani datum?')) {
      try {
        const response = await fetch(`/api/admin/blocked-dates/${blockedDateId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchBlockedDates();
        } else {
          alert('Greška pri brisanju blokiranog datuma');
        }
      } catch (error) {
        console.error('Error deleting blocked date:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      reason: '',
      allDay: true,
      startTime: '',
      endTime: ''
    });
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Učitavanje...</div>;
  }

  return (
    <div className="management-container">
      <div className="section-header">
        <h2>Upravljanje Blokiranim Danima</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Dodaj Blokirani Datum
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>Dodaj blokirani datum (godišnji odmor, praznik)</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Datum:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Razlog:</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="npr. Godišnji odmor, Božić..."
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.allDay}
                    onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  />
                  Cijeli dan
                </label>
              </div>

              {!formData.allDay && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Početak:</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Kraj:</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Spremi
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Odustani
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="blocked-dates-list">
        {blockedDates.map((blockedDate) => (
          <div key={blockedDate._id} className="blocked-date-card">
            <div className="blocked-date-header">
              <h3>{new Date(blockedDate.date).toLocaleDateString('hr-HR')}</h3>
              <span className="reason-badge">{blockedDate.reason}</span>
            </div>
            
            <div className="blocked-date-details">
              <p>
                <strong>Vrijeme:</strong>{' '}
                {blockedDate.allDay 
                  ? 'Cijeli dan' 
                  : `${blockedDate.startTime} - ${blockedDate.endTime}`
                }
              </p>
              <p>
                <strong>Dodano:</strong>{' '}
                {new Date(blockedDate.createdAt).toLocaleDateString('hr-HR')}
              </p>
            </div>

            <div className="blocked-date-actions">
              <button
                onClick={() => handleDelete(blockedDate._id)}
                className="btn-delete"
              >
                Ukloni
              </button>
            </div>
          </div>
        ))}
      </div>

      {blockedDates.length === 0 && (
        <div className="no-data">
          Nema blokiranih datuma. Dodajte godišnji odmor ili praznike.
        </div>
      )}
    </div>
  );
};

export default BlockedDatesManagement;