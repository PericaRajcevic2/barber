import React, { useState, useEffect } from 'react';
import './ManagementStyles.clean.css';

const BlockedDatesManagement = () => {
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    // mode: 'single' | 'range'
    mode: 'single',
    date: '',
    startDate: '',
    endDate: '',
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
      // Validate and build payload
      const payload = {
        reason: formData.reason,
        allDay: !!formData.allDay
      };

      if (formData.mode === 'single') {
        if (!formData.date) return alert('Odaberite datum');
        payload.date = formData.date;
      } else {
        if (!formData.startDate || !formData.endDate) return alert('Odaberite početak i kraj perioda');
        const s = new Date(formData.startDate);
        const e = new Date(formData.endDate);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return alert('Neispravan format datuma');
        if (e < s) return alert('Kraj perioda ne može biti prije početka');
        payload.startDate = formData.startDate;
        payload.endDate = formData.endDate;
      }

      if (!payload.allDay) {
        if (!formData.startTime || !formData.endTime) return alert('Navedite početak i kraj vremena za segment');
        payload.startTime = formData.startTime;
        payload.endTime = formData.endTime;
      }

      const response = await fetch('/api/admin/blocked-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchBlockedDates();
        resetForm();
      } else {
        const err = await response.json().catch(() => null);
        alert('Greška pri kreiranju blokiranog datuma: ' + (err && err.message ? err.message : response.statusText));
      }
    } catch (error) {
      console.error('Error creating blocked date:', error);
      alert('Greška pri kreiranju blokiranog datuma');
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
                <label>Tip blokade:</label>
                <select
                  className="form-group input mode-select"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                >
                  <option value="single">Jedan dan</option>
                  <option value="range">Period (više dana)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Datum:</label>
                {formData.mode === 'single' ? (
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                ) : (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Početak:</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Kraj:</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}
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
        {blockedDates.map((block) => (
          <div key={block._id} className="blocked-date-card">
            <div className="blocked-date-header">
              <div className="date-range">
                <h3>
                  {block.startDate === block.endDate 
                    ? new Date(block.startDate).toLocaleDateString('hr-HR')
                    : `${new Date(block.startDate).toLocaleDateString('hr-HR')} - ${new Date(block.endDate).toLocaleDateString('hr-HR')}`
                  }
                </h3>
                {block.dates?.length > 1 && (
                  <span className="days-count">
                    ({block.dates.length} {block.dates.length === 1 ? 'dan' : 'dana'})
                  </span>
                )}
              </div>
              <span className="reason-badge">{block.reason}</span>
            </div>
            
            <div className="blocked-date-details">
              <p>
                <strong>Vrijeme:</strong>{' '}
                {block.allDay 
                  ? 'Cijeli dan' 
                  : `${block.startTime} - ${block.endTime}`
                }
              </p>
              <p>
                <strong>Dodano:</strong>{' '}
                {new Date(block.createdAt).toLocaleDateString('hr-HR')}
              </p>
            </div>

            <div className="blocked-date-actions">
              <button
                onClick={() => handleDelete(block.dates[0]._id)}
                className="btn-delete"
              >
                Ukloni{block.dates?.length > 1 ? ' period' : ''}
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