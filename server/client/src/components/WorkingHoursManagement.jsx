import React, { useState, useEffect } from 'react';
import './ManagementStyles.css';

const WorkingHoursManagement = () => {
  const [workingHours, setWorkingHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      const response = await fetch('/api/admin/working-hours');
      const data = await response.json();
      setWorkingHours(data);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      const response = await fetch('/api/admin/working-hours/reset', {
        method: 'POST'
      });
      const data = await response.json();
      setWorkingHours(data);
    } catch (error) {
      console.error('Error resetting working hours:', error);
    }
  };

  const handleTimeChange = (index, field, value) => {
    const updatedHours = [...workingHours];
    updatedHours[index][field] = value;
    setWorkingHours(updatedHours);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/working-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workingHours),
      });

      if (response.ok) {
        alert('Radno vrijeme uspješno spremljeno!');
        fetchWorkingHours();
      } else {
        alert('Greška pri spremanju radnog vremena');
      }
    } catch (error) {
      console.error('Error saving working hours:', error);
    }
  };

  const dayNames = {
    0: 'Nedjelja',
    1: 'Ponedjeljak',
    2: 'Utorak',
    3: 'Srijeda',
    4: 'Četvrtak',
    5: 'Petak',
    6: 'Subota'
  };

  if (loading) {
    return <div className="loading">Učitavanje...</div>;
  }

  if (!loading && (!workingHours || workingHours.length === 0)) {
    return (
      <div className="management-container">
        <div className="section-header">
          <h2>Upravljanje Radnim Vremenom</h2>
        </div>
        <div style={{padding: '20px'}}>
          <p>Trenutno nema konfiguriranih radnih dana.</p>
          <button className="btn-primary" onClick={resetToDefaults}>Vraćanje zadane konfiguracije</button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="section-header">
        <h2>Upravljanje Radnim Vremenom</h2>
        <button onClick={handleSave} className="btn-primary">
          Spremi promjene
        </button>
      </div>

      <div className="working-hours-container">
        {workingHours.map((day, index) => (
          <div key={day._id} className="working-day-card">
            <div className="day-header">
              <h3>{dayNames[day.dayOfWeek]}</h3>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={day.isWorking}
                  onChange={(e) => handleTimeChange(index, 'isWorking', e.target.checked)}
                />
                Radi se
              </label>
            </div>

            {day.isWorking && (
              <div className="time-inputs">
                <div className="form-group">
                  <label>Početak radnog vremena:</label>
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Kraj radnog vremena:</label>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {!day.isWorking && (
              <div className="closed-message">
                🚫 Ne radi se
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkingHoursManagement;