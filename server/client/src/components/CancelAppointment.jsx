import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CancelAppointment.css';

const CancelAppointment = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [token]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/cancel/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Termin nije pronađen');
        setLoading(false);
        return;
      }

      // Za GET preview endpoint (trebamo ga dodati)
      setAppointment(data);
      setLoading(false);
    } catch (err) {
      setError('Greška pri učitavanju termina');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Da li ste sigurni da želite otkazati termin?')) {
      return;
    }

    try {
      setCancelling(true);
      const response = await fetch(`/api/appointments/cancel/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Greška pri otkazivanju termina');
        setCancelling(false);
        return;
      }

      setCancelled(true);
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      setError('Greška pri otkazivanju termina');
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="cancel-container">
        <div className="cancel-card">
          <div className="loading-spinner"></div>
          <p>Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cancel-container">
        <div className="cancel-card error-card">
          <div className="error-icon">❌</div>
          <h2>Greška</h2>
          <p>{error}</p>
          <button 
            className="btn-back"
            onClick={() => navigate('/')}
          >
            Nazad na početnu
          </button>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="cancel-container">
        <div className="cancel-card success-card">
          <div className="success-icon">✅</div>
          <h2>Termin uspješno otkazan</h2>
          <p>Email potvrda je poslana na vašu adresu.</p>
          <p className="redirect-text">Preusmjeravanje na početnu za 5 sekundi...</p>
          <button 
            className="btn-back"
            onClick={() => navigate('/')}
          >
            Nazad na početnu
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="cancel-container">
        <div className="cancel-card error-card">
          <div className="error-icon">❌</div>
          <h2>Termin nije pronađen</h2>
          <button 
            className="btn-back"
            onClick={() => navigate('/')}
          >
            Nazad na početnu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cancel-container">
      <div className="cancel-card">
        <div className="cancel-header">
          <h1>💈 Frizerski Salon Jimmy</h1>
          <h2>Otkazivanje termina</h2>
        </div>

        <div className="appointment-details">
          <h3>Detalji vašeg termina:</h3>
          <div className="detail-row">
            <span className="detail-label">👤 Ime:</span>
            <span className="detail-value">{appointment.customerName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">📅 Datum:</span>
            <span className="detail-value">
              {new Date(appointment.date).toLocaleDateString('hr-HR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">🕒 Vrijeme:</span>
            <span className="detail-value">
              {new Date(appointment.date).toLocaleTimeString('hr-HR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">✂️ Usluga:</span>
            <span className="detail-value">{appointment.service?.name || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">💰 Cijena:</span>
            <span className="detail-value">{appointment.service?.price || 'N/A'}€</span>
          </div>
        </div>

        <div className="cancel-warning">
          <p>
            ⚠️ <strong>Napomena:</strong> Otkazivanje termina je moguće najmanje 2 sata prije
            zakazanog vremena. Nakon otkazivanja, primićete email potvrdu.
          </p>
        </div>

        <div className="reason-section">
          <label htmlFor="reason">Razlog otkazivanja (opcionalno):</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Unesite razlog otkazivanja..."
            rows="3"
          />
        </div>

        <div className="action-buttons">
          <button
            className="btn-cancel-appointment"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Otkazivanje...' : '❌ Otkaži termin'}
          </button>
          <button
            className="btn-keep"
            onClick={() => navigate('/')}
            disabled={cancelling}
          >
            ← Zadrži termin
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointment;
