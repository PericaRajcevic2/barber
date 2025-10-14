import React, { useState, useEffect } from 'react';
import './ManagementStyles.css';

const AppointmentsManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments?date=${selectedDate}`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAppointments(); // Refresh the list
      } else {
        alert('Greška pri ažuriranju statusa');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
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
              <p><strong>Usluga:</strong> {appointment.service?.name}</p>
              <p><strong>Trajanje:</strong> {appointment.service?.duration} min</p>
              <p><strong>Cijena:</strong> {appointment.service?.price}€</p>
              <p><strong>Kontakt:</strong> {appointment.customerEmail} | {appointment.customerPhone}</p>
              {appointment.notes && (
                <p><strong>Napomene:</strong> {appointment.notes}</p>
              )}
            </div>

            <div className="appointment-actions">
              <div className="status-actions">
                <label>Promijeni status:</label>
                <select
                  value={appointment.status}
                  onChange={(e) => updateAppointmentStatus(appointment._id, e.target.value)}
                >
                  <option value="pending">Na čekanju</option>
                  <option value="confirmed">Potvrdi</option>
                  <option value="cancelled">Otkaži</option>
                  <option value="completed">Završeno</option>
                </select>
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