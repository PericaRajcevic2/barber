import React, { useState, useEffect } from 'react';
import './ManagementStyles.css';

const AppointmentsManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Inicijaliziraj lokalni datum u formatu YYYY-MM-DD (izbjegava UTC pomak)
  const getLocalYYYYMMDD = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalYYYYMMDD());
  const [error, setError] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`/api/appointments?date=${selectedDate}`);
      const data = await response.json();
      if (!response.ok) {
        console.error('Server error fetching appointments:', data);
        setError(data.message || 'Greška pri dohvaćanju narudžbi');
        setAppointments([]);
        return;
      }
      console.log(`✅ Dohvaćene narudžbe: ${data.length}`);
      setAppointments(data);
      // initialize selectedStatuses for each appointment
      const initial = {};
      (data || []).forEach(a => {
        initial[a._id] = a.status || 'pending';
      });
      setSelectedStatuses(initial);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Greška pri dohvaćanju narudžbi');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      console.log(`🔄 Ažuriram ${appointmentId} -> ${newStatus}`);
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Server error updating appointment status:', data);
        setError(data.message || 'Greška pri ažuriranju statusa');
        return;
      }

      console.log('✅ Status uspješno ažuriran:', data);
      await fetchAppointments(); // Refresh the list
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err.message || 'Greška pri ažuriranju statusa');
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (window.confirm('Jeste li sigurni da želite obrisati ovu narudžbu?')) {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchAppointments(); // Refresh the list
        } else {
          alert('Greška pri brisanju narudžbe');
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Na čekanju', class: 'status-pending' },
      confirmed: { label: 'Potvrđeno', class: 'status-confirmed' },
      cancelled: { label: 'Otkazano', class: 'status-cancelled' },
      completed: { label: 'Završeno', class: 'status-completed' }
    };
    
    const config = statusConfig[status] || { label: status, class: 'status-unknown' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  if (loading) {
    return <div className="loading">Učitavanje narudžbi...</div>;
  }

  return (
    <div className="management-container">
      {error && (
        <div className="error-banner" style={{background: '#ffdede', padding: '10px', marginBottom: '10px'}}>
          ⚠️ {error}
          <button onClick={() => { setError(null); fetchAppointments(); }} style={{marginLeft: '12px'}}>Pokušaj ponovno</button>
        </div>
      )}
      <div className="section-header">
        <h2>Upravljanje Narudžbama</h2>
        <div className="date-filter">
          <label>Prikaži narudžbe za datum:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="appointments-list">
        {appointments.map((appointment) => (
          <div key={appointment._id} className="appointment-card">
            <div className="appointment-header">
              <div className="appointment-info">
                <h3>{appointment.customerName}</h3>
                <p className="appointment-time">
                  📅 {new Date(appointment.date).toLocaleDateString('hr-HR')}
                  <br />
                  🕒 {new Date(appointment.date).toLocaleTimeString('hr-HR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div className="appointment-status">
                {getStatusBadge(appointment.status)}
              </div>
            </div>

            <div className="appointment-details">
              <p><strong>Usluga:</strong> {appointment.service?.name || '(nepoznato)'}</p>
              <p><strong>Trajanje:</strong> {appointment.service?.duration ? `${appointment.service.duration} min` : '(nepoznato)'}</p>
              <p><strong>Cijena:</strong> {appointment.service?.price ? `${appointment.service.price}€` : '(nepoznato)'}</p>
              <p><strong>Kontakt:</strong> {appointment.customerEmail} | {appointment.customerPhone}</p>
              {appointment.notes && (
                <p><strong>Napomene:</strong> {appointment.notes}</p>
              )}
            </div>

            <div className="appointment-actions">
              <div className="status-actions">
                <label>Promijeni status:</label>
                <select
                  value={selectedStatuses[appointment._id] ?? appointment.status ?? 'pending'}
                  onChange={(e) => setSelectedStatuses(prev => ({ ...prev, [appointment._id]: e.target.value }))}
                >
                  <option value="pending">Na čekanju</option>
                  <option value="confirmed">Potvrdi</option>
                  <option value="cancelled">Otkaži</option>
                  <option value="completed">Završeno</option>
                </select>
                <button
                  className="btn-edit"
                  style={{marginLeft: '8px'}}
                  onClick={() => updateAppointmentStatus(appointment._id, selectedStatuses[appointment._id] ?? appointment.status ?? 'pending')}
                >
                  Ažuriraj
                </button>
              </div>
              
              <button
                onClick={() => deleteAppointment(appointment._id)}
                className="btn-delete"
              >
                Obriši
              </button>
            </div>
          </div>
        ))}
      </div>

      {appointments.length === 0 && (
        <div className="no-data">
          📭 Nema narudžbi za odabrani datum.
        </div>
      )}
    </div>
  );
};

export default AppointmentsManagement;