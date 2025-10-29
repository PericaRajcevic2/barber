import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './ManagementStyles.clean.css';

const BreakSlotsManagement = () => {
  const [breakSlots, setBreakSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBreak, setNewBreak] = useState({
    startTime: '12:00',
    endTime: '13:00',
    description: 'Ručak'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchBreakSlots();
  }, []);

  const fetchBreakSlots = async () => {
    try {
      setLoading(true);
  const { data } = await api.get('/api/settings');
      setBreakSlots(data.breakSlots || []);
    } catch (error) {
      console.error('Error fetching break slots:', error);
      alert('Greška pri učitavanju pauza');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBreak = async () => {
    if (!newBreak.startTime || !newBreak.endTime) {
      alert('Molimo unesite početno i krajnje vrijeme');
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newBreak.startTime) || !timeRegex.test(newBreak.endTime)) {
      alert('Neispravan format vremena. Koristite HH:MM format (npr. 12:00)');
      return;
    }

    // Validate start < end
    const [startH, startM] = newBreak.startTime.split(':').map(Number);
    const [endH, endM] = newBreak.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes >= endMinutes) {
      alert('Početno vrijeme mora biti prije krajnjeg vremena');
      return;
    }

    try {
      setSaving(true);
      const updatedBreaks = [...breakSlots, newBreak];
      
      const response = await api.put('/api/settings', { breakSlots: updatedBreaks });
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        setBreakSlots(data.breakSlots || []);
        setNewBreak({ startTime: '12:00', endTime: '13:00', description: 'Ručak' });
        setShowAddForm(false);
        alert('✅ Pauza dodana!');
      } else {
        alert('Greška pri dodavanju pauze');
      }
    } catch (error) {
      console.error('Error adding break:', error);
      alert('Greška pri dodavanju pauze');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBreak = async (index) => {
    if (!window.confirm('Da li ste sigurni da želite obrisati ovu pauzu?')) {
      return;
    }

    try {
      setSaving(true);
      const updatedBreaks = breakSlots.filter((_, i) => i !== index);
      
      const response = await api.put('/api/settings', { breakSlots: updatedBreaks });
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        setBreakSlots(data.breakSlots || []);
        alert('✅ Pauza obrisana!');
      } else {
        alert('Greška pri brisanju pauze');
      }
    } catch (error) {
      console.error('Error deleting break:', error);
      alert('Greška pri brisanju pauze');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="management-container">
        <div className="loading-spinner"></div>
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="section-header">
        <h2>☕ Pauze i Neradni Termini</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Zatvori' : '+ Dodaj Pauzu'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form-card">
          <h3>Dodaj Novu Pauzu</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Početno Vrijeme *</label>
              <input
                type="time"
                value={newBreak.startTime}
                onChange={(e) => setNewBreak({ ...newBreak, startTime: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Krajnje Vrijeme *</label>
              <input
                type="time"
                value={newBreak.endTime}
                onChange={(e) => setNewBreak({ ...newBreak, endTime: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Opis (opciono)</label>
              <input
                type="text"
                value={newBreak.description}
                onChange={(e) => setNewBreak({ ...newBreak, description: e.target.value })}
                placeholder="npr. Ručak, Pauza, Zatvoreno"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleAddBreak}
              disabled={saving}
            >
              {saving ? 'Spremanje...' : '✓ Spremi Pauzu'}
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowAddForm(false)}
            >
              Odustani
            </button>
          </div>
        </div>
      )}

      <div className="items-grid">
        {breakSlots.length === 0 ? (
          <div className="empty-state">
            <p>☕ Trenutno nema definiranih pauza</p>
            <p className="hint">Kliknite "Dodaj Pauzu" za kreiranje nove pauze (npr. ručak 12:00-13:00)</p>
          </div>
        ) : (
          breakSlots.map((breakSlot, index) => (
            <div key={index} className="item-card">
              <div className="item-header">
                <h3>⏸️ {breakSlot.description || 'Pauza'}</h3>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteBreak(index)}
                  disabled={saving}
                  title="Obriši pauzu"
                >
                  🗑️
                </button>
              </div>

              <div className="item-details">
                <div className="detail-row">
                  <span className="detail-label">⏰ Vrijeme:</span>
                  <span className="detail-value">
                    <strong>{breakSlot.startTime}</strong> - <strong>{breakSlot.endTime}</strong>
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">⏱️ Trajanje:</span>
                  <span className="detail-value">
                    {calculateDuration(breakSlot.startTime, breakSlot.endTime)}
                  </span>
                </div>
              </div>

              <div className="item-info">
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                  ℹ️ Termini u ovom periodu neće biti dostupni za rezervaciju
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="info-section" style={{ marginTop: '24px' }}>
        <h3>ℹ️ Kako funkcioniraju pauze?</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>🚫 Termini u definiranim pauzama neće biti prikazani klijentima</li>
          <li>📅 Pauze se primjenjuju na sve dane u tjednu</li>
          <li>⏰ Možete dodati više pauza (npr. jutarnja i popodnevna)</li>
          <li>✂️ Pauze se automatski primjenjuju na sve usluge</li>
          <li>🔄 Promjene su trenutne - klijenti odmah vide nove rasporede</li>
        </ul>
      </div>
    </div>
  );
};

// Helper function to calculate duration
function calculateDuration(startTime, endTime) {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const durationMinutes = endMinutes - startMinutes;
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}min`;
  }
}

export default BreakSlotsManagement;
