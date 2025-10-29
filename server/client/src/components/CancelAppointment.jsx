import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomCalendar from './CustomCalendar';
import './CancelAppointment.css';

const CancelAppointment = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('choice');
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [rescheduled, setRescheduled] = useState(false);
  const [newDate, setNewDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);

  useEffect(() => {
    fetchAppointment();
    fetchSettings();
    fetchBlockedDates();
  }, [token]);

  useEffect(() => {
    if (mode === 'reschedule' && newDate && appointment) {
      fetchAvailableSlots();
    }
  }, [newDate, mode]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (response.ok) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const response = await fetch('/api/working-hours/blocked-dates');
      const data = await response.json();
      if (response.ok) {
        setBlockedDates(data.map(d => new Date(d.date)));
      }
    } catch (err) {
      console.error('Error fetching blocked dates:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const dateStr = newDate.toISOString().split('T')[0];
      const serviceId = appointment.service?._id || appointment.service;
      const response = await fetch(`/api/available-slots?date=${dateStr}&serviceId=${serviceId}`);
      const data = await response.json();
      if (response.ok) {
        setAvailableSlots(data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/by-token/${token}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Termin nije pronađen');
        setLoading(false);
        return;
      }
      setAppointment(data);
      setLoading(false);
    } catch (err) {
      setError('Greška pri učitavanju termina');
      setLoading(false);
    }
  };

  const canCancelOrReschedule = () => {
    if (!appointment || !settings) return { can: false, reason: 'Loading...' };
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const hoursUntil = (appointmentDate - now) / (1000 * 60 * 60);
    const timeLimit = settings.cancellationTimeLimit || 2;
    if (hoursUntil < timeLimit) {
      return { can: false, reason: `Otkazivanje/Promjena termina moguća najkasnije ${timeLimit}h prije termina` };
    }
    if (appointment.status === 'cancelled') {
      return { can: false, reason: 'Ovaj termin je već otkazan' };
    }
    if (appointment.status === 'completed') {
      return { can: false, reason: 'Ovaj termin je već završen' };
    }
    return { can: true, reason: '' };
  };

  const handleCancel = async () => {
    if (!cancellationReason) {
      alert('Molimo odaberite razlog otkazivanja');
      return;
    }
    if (!window.confirm('Da li ste sigurni da želite otkazati termin?')) {
      return;
    }
    try {
      setCancelling(true);
      const response = await fetch(`/api/appointments/cancel/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancellationReason, note: cancellationNote })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Greška pri otkazivanju termina');
        setCancelling(false);
        return;
      }
      setCancelled(true);
      setTimeout(() => navigate('/'), 5000);
    } catch (err) {
      setError('Greška pri otkazivanju termina');
      setCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedTime) {
      alert('Molimo odaberite novo vrijeme');
      return;
    }
    if (!window.confirm('Da li ste sigurni da želite promijeniti termin?')) {
      return;
    }
    try {
      setCancelling(true);
      const [hours, minutes] = selectedTime.split(':');
      const newAppointmentDate = new Date(newDate);
      newAppointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const response = await fetch(`/api/appointments/reschedule/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: newAppointmentDate.toISOString() })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Greška pri promjeni termina');
        setCancelling(false);
        return;
      }
      setRescheduled(true);
      setTimeout(() => navigate('/'), 5000);
    } catch (err) {
      setError('Greška pri promjeni termina');
      setCancelling(false);
    }
  };

  const reasonOptions = [
    { value: '', label: 'Odaberite razlog...' },
    { value: 'illness', label: ' Bolest' },
    { value: 'emergency', label: ' Hitno / Nepredviđeno' },
    { value: 'schedule_conflict', label: ' Zauzet / Obaveze' },
    { value: 'mistake', label: ' Greška pri rezervaciji' },
    { value: 'other', label: ' Ostalo' }
  ];

  if (loading) {
    return <div className="cancel-container"><div className="cancel-card"><div className="loading-spinner"></div><p>Učitavanje...</p></div></div>;
  }

  if (error && !appointment) {
    return <div className="cancel-container"><div className="cancel-card error-card"><div className="error-icon"></div><h2>Greška</h2><p>{error}</p><button className="btn-back" onClick={() => navigate('/')}>Nazad na početnu</button></div></div>;
  }

  if (cancelled) {
    return <div className="cancel-container"><div className="cancel-card success-card"><div className="success-icon"></div><h2>Termin uspješno otkazan</h2><p>Email potvrda je poslana na vašu adresu.</p><p className="redirect-text">Preusmjeravanje na početnu za 5 sekundi...</p><button className="btn-back" onClick={() => navigate('/')}>Nazad na početnu</button></div></div>;
  }

  if (rescheduled) {
    return <div className="cancel-container"><div className="cancel-card success-card"><div className="success-icon"></div><h2>Termin uspješno promijenjen</h2><p>Email potvrda sa novim terminom je poslana na vašu adresu.</p><p className="redirect-text">Preusmjeravanje na početnu za 5 sekundi...</p><button className="btn-back" onClick={() => navigate('/')}>Nazad na početnu</button></div></div>;
  }

  if (!appointment) {
    return <div className="cancel-container"><div className="cancel-card error-card"><div className="error-icon"></div><h2>Termin nije pronađen</h2><button className="btn-back" onClick={() => navigate('/')}>Nazad na početnu</button></div></div>;
  }

  const { can, reason: cantReason } = canCancelOrReschedule();

  if (!can) {
    return <div className="cancel-container"><div className="cancel-card error-card"><div className="error-icon"></div><h2>Nije moguće promijeniti termin</h2><p>{cantReason}</p><p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>Za dodatne informacije kontaktirajte salon direktno.</p><button className="btn-back" onClick={() => navigate('/')}>Nazad na početnu</button></div></div>;
  }

  if (mode === 'choice') {
    return <div className="cancel-container"><div className="cancel-card"><div className="cancel-header"><h1> Frizerski Salon Jimmy</h1><h2>Upravljanje terminom</h2></div><div className="appointment-details"><h3>Vaš termin:</h3><div className="detail-row"><span className="detail-label"> Ime:</span><span className="detail-value">{appointment.customerName}</span></div><div className="detail-row"><span className="detail-label"> Datum:</span><span className="detail-value">{new Date(appointment.date).toLocaleDateString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div><div className="detail-row"><span className="detail-label"> Vrijeme:</span><span className="detail-value">{new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</span></div><div className="detail-row"><span className="detail-label"> Usluga:</span><span className="detail-value">{appointment.service?.name || 'N/A'}</span></div><div className="detail-row"><span className="detail-label"> Cijena:</span><span className="detail-value">{appointment.service?.price || 'N/A'}€</span></div></div><div className="choice-buttons">{settings?.allowReschedule && <button className="btn-reschedule" onClick={() => setMode('reschedule')}> Promijeni termin</button>}<button className="btn-cancel-choice" onClick={() => setMode('cancel')}> Otkaži termin</button><button className="btn-keep" onClick={() => navigate('/')}> Zadrži termin</button></div></div></div>;
  }

  if (mode === 'cancel') {
    return <div className="cancel-container"><div className="cancel-card"><div className="cancel-header"><h1> Frizerski Salon Jimmy</h1><h2>Otkazivanje termina</h2></div><div className="appointment-details"><h3>Detalji termina:</h3><div className="detail-row"><span className="detail-label"> Datum:</span><span className="detail-value">{new Date(appointment.date).toLocaleDateString('hr-HR')} u {new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</span></div><div className="detail-row"><span className="detail-label"> Usluga:</span><span className="detail-value">{appointment.service?.name || 'N/A'}</span></div></div><div className="cancel-warning"><p> <strong>Napomena:</strong> Nakon otkazivanja primićete email potvrdu.</p></div><div className="reason-section"><label htmlFor="reason">Razlog otkazivanja: *</label><select id="reason" value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} required>{reasonOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div><div className="reason-section"><label htmlFor="note">Dodatna napomena (opciono):</label><textarea id="note" value={cancellationNote} onChange={(e) => setCancellationNote(e.target.value)} placeholder="Unesite dodatne detalje..." rows="3" /></div><div className="action-buttons"><button className="btn-cancel-appointment" onClick={handleCancel} disabled={cancelling || !cancellationReason}>{cancelling ? 'Otkazivanje...' : ' Potvrdi otkazivanje'}</button><button className="btn-back-choice" onClick={() => setMode('choice')} disabled={cancelling}> Nazad</button></div></div></div>;
  }

  if (mode === 'reschedule') {
    return <div className="cancel-container reschedule-container"><div className="cancel-card reschedule-card"><div className="cancel-header"><h1> Frizerski Salon Jimmy</h1><h2>Promjena termina</h2></div><div className="current-appointment"><h3>Trenutni termin:</h3><p> {new Date(appointment.date).toLocaleDateString('hr-HR')} u {new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</p></div><div className="reschedule-form"><h3>Odaberite novi termin:</h3><div className="calendar-wrapper"><CustomCalendar value={newDate} onChange={setNewDate} blockedDates={blockedDates} /></div><div className="selected-date-info">Odabrani datum: <strong>{newDate.toLocaleDateString('hr-HR')}</strong></div>{loadingSlots ? <div className="loading-slots">Učitavanje slobodnih termina...</div> : <div className="time-slots"><h4>Dostupni termini:</h4>{availableSlots.length === 0 ? <p className="no-slots">Nema dostupnih termina za odabrani dan</p> : <div className="slots-grid">{availableSlots.map(slot => <button key={slot} className={`time-slot ${selectedTime === slot ? 'selected' : ''}`} onClick={() => setSelectedTime(slot)}>{slot}</button>)}</div>}</div>}</div><div className="action-buttons"><button className="btn-reschedule-confirm" onClick={handleReschedule} disabled={cancelling || !selectedTime}>{cancelling ? 'Promjena...' : ' Potvrdi novi termin'}</button><button className="btn-back-choice" onClick={() => setMode('choice')} disabled={cancelling}> Nazad</button></div></div></div>;
  }

  return null;
};

export default CancelAppointment;
