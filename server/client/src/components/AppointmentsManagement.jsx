import React, { useState, useEffect } from 'react';
import './ManagementStyles.clean.css';

const AppointmentsManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'status' | 'price'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [pageSize, setPageSize] = useState(10); // 10 | 20 | 50
  const [currentPage, setCurrentPage] = useState(1);
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
      setSelectedIds(new Set());
      setCurrentPage(1);
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

  const sendFollowUpEmail = async (appointmentId) => {
    if (window.confirm('Poslati follow-up email korisniku?')) {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/send-followup`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        if (response.ok) {
          alert('✅ Follow-up email uspješno poslan!');
          await fetchAppointments(); // Refresh to show updated tracking
        } else {
          alert('❌ ' + (data.message || 'Greška pri slanju emaila'));
        }
      } catch (error) {
        console.error('Error sending follow-up:', error);
        alert('❌ Greška pri slanju follow-up emaila');
      }
    }
  };

  // Helpers
  const matchesSearch = (a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.customerName || '').toLowerCase().includes(q) ||
      (a.customerEmail || '').toLowerCase().includes(q) ||
      (a.customerPhone || '').toLowerCase().includes(q)
    );
  };

  const statusOrder = { pending: 0, confirmed: 1, cancelled: 2, completed: 3 };
  const getPrice = (a) => Number(a.service?.price || 0);

  const sortedAppointments = [...(appointments || [])]
    .filter(matchesSearch)
    .sort((a, b) => {
      let res = 0;
      if (sortBy === 'date') {
        res = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'status') {
        res = (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999);
      } else if (sortBy === 'price') {
        res = getPrice(a) - getPrice(b);
      }
      return sortDir === 'asc' ? res : -res;
    });

  const totalItems = sortedAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = sortedAppointments.slice(start, start + pageSize);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    const allSelected = pageItems.every(a => selectedIds.has(a._id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pageItems.forEach(a => next.delete(a._id));
      } else {
        pageItems.forEach(a => next.add(a._id));
      }
      return next;
    });
  };

  const bulkConfirm = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Potvrdi ${selectedIds.size} odabranih narudžbi?`)) return;
    for (const id of selectedIds) {
      await updateAppointmentStatus(id, 'confirmed');
    }
    setSelectedIds(new Set());
    await fetchAppointments();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Obriši ${selectedIds.size} odabranih narudžbi?`)) return;
    for (const id of selectedIds) {
      try {
        await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      } catch (e) { /* ignore single failure */ }
    }
    setSelectedIds(new Set());
    await fetchAppointments();
  };

  const exportCSV = () => {
    const rows = [['Datum','Vrijeme','Ime','Email','Telefon','Usluga','Trajanje','Cijena','Status','Napomene']];
    sortedAppointments.forEach(a => {
      const d = new Date(a.date);
      rows.push([
        d.toLocaleDateString('hr-HR'),
        d.toLocaleTimeString('hr-HR',{hour:'2-digit',minute:'2-digit'}),
        a.customerName || '',
        a.customerEmail || '',
        a.customerPhone || '',
        a.service?.name || '',
        a.service?.duration ? `${a.service.duration}` : '',
        a.service?.price ? `${a.service.price}` : '',
        a.status || '',
        a.notes ? a.notes.replace(/\n/g,' ') : ''
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `narudzbe_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="date-filter" style={{gap: '10px', display: 'flex', alignItems:'center', flexWrap:'wrap'}}>
          <label>Datum:</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <input
            type="text"
            placeholder="Pretraži ime, email ili telefon..."
            value={search}
            onChange={(e)=>{ setSearch(e.target.value); setCurrentPage(1); }}
            style={{padding:'10px 12px', borderRadius: '8px', border:'1px solid #ddd', minWidth:'260px'}}
          />
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="date">Sortiraj po datumu</option>
            <option value="status">Sortiraj po statusu</option>
            <option value="price">Sortiraj po cijeni</option>
          </select>
          <button className="btn-secondary" onClick={()=>setSortDir(d=> d==='asc'?'desc':'asc')}>
            {sortDir==='asc'? '⬆️' : '⬇️'}
          </button>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button className="btn-secondary" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {/* Bulk actions */}
      <div style={{display:'flex', alignItems:'center', gap:'12px', margin: '10px 0'}}>
        <label style={{display:'flex', alignItems:'center', gap:'6px'}}>
          <input type="checkbox" onChange={toggleSelectPage} checked={pageItems.length>0 && pageItems.every(a=>selectedIds.has(a._id))} />
          Odaberi sve na stranici
        </label>
        <button className="btn-primary" onClick={bulkConfirm} disabled={selectedIds.size===0}>Potvrdi odabrane</button>
        <button className="btn-delete" onClick={bulkDelete} disabled={selectedIds.size===0}>Obriši odabrane</button>
        <span style={{marginLeft:'auto', opacity:.8}}>Ukupno: {totalItems}</span>
      </div>

      <div className="appointments-list">
        {pageItems.map((appointment) => (
          <div key={appointment._id} className="appointment-card">
            <div className="appointment-header">
              <div className="appointment-info">
                <div style={{marginBottom:'6px'}}>
                  <input type="checkbox" checked={selectedIds.has(appointment._id)} onChange={()=>toggleSelect(appointment._id)} />
                </div>
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
              <p><strong>Cijena:</strong> {appointment.service?.price ? `${appointment.service.price} KM` : '(nepoznato)'}</p>
              <p><strong>Kontakt:</strong> {appointment.customerEmail} | {appointment.customerPhone}</p>
              {appointment.notes && (
                <p><strong>Napomene:</strong> {appointment.notes}</p>
              )}
              
              {/* Email Tracking Info */}
              {(appointment.reminderSent || appointment.followUpSent || appointment.emailTracking) && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: '#e7f3ff',
                  borderRadius: '8px',
                  borderLeft: '4px solid #667eea'
                }}>
                  <p style={{margin: '0 0 8px 0', fontWeight: 'bold', color: '#0056b3'}}>📧 Email Status</p>
                  {appointment.reminderSent && (
                    <p style={{margin: '4px 0', fontSize: '13px'}}>
                      ⏰ Reminder poslan: {new Date(appointment.reminderSentAt).toLocaleString('hr-HR')}
                      {appointment.emailTracking?.reminderOpened && (
                        <span style={{color: '#28a745', fontWeight: 'bold'}}> ✓ Otvoren</span>
                      )}
                    </p>
                  )}
                  {appointment.followUpSent && (
                    <p style={{margin: '4px 0', fontSize: '13px'}}>
                      ⭐ Follow-up poslan: {new Date(appointment.followUpSentAt).toLocaleString('hr-HR')}
                      {appointment.emailTracking?.followUpOpened && (
                        <span style={{color: '#28a745', fontWeight: 'bold'}}> ✓ Otvoren</span>
                      )}
                      {appointment.emailTracking?.reviewLinkClicked && (
                        <span style={{color: '#ffc107', fontWeight: 'bold'}}> ⭐ Review kliknut</span>
                      )}
                    </p>
                  )}
                </div>
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
              </div>
              
              <div className="action-buttons-row">
                <button
                  className="btn-edit"
                  onClick={() => updateAppointmentStatus(appointment._id, selectedStatuses[appointment._id] ?? appointment.status ?? 'pending')}
                >
                  Ažuriraj
                </button>
                <button
                  onClick={() => deleteAppointment(appointment._id)}
                  className="btn-delete"
                >
                  Obriši
                </button>
                {appointment.status === 'completed' && (
                  <button
                    onClick={() => sendFollowUpEmail(appointment._id)}
                    className="btn-email"
                    style={{
                      background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    📧 Pošalji Follow-Up
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', marginTop:'12px'}}>
        <button className="btn-secondary" onClick={()=> setCurrentPage(p=> Math.max(1, p-1))} disabled={safePage===1}>Prev</button>
        <span>Stranica {safePage} / {totalPages}</span>
        <button className="btn-secondary" onClick={()=> setCurrentPage(p=> Math.min(totalPages, p+1))} disabled={safePage===totalPages}>Next</button>
      </div>

      {totalItems === 0 && (
        <div className="no-data">
          📭 Nema narudžbi za odabrani datum.
        </div>
      )}
    </div>
  );
};

export default AppointmentsManagement;