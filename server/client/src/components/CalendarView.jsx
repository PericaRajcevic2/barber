import React, { useState, useEffect } from 'react';
import './CalendarView.css';

const CalendarView = () => {
  const [appointments, setAppointments] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'day' ili 'week'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileStartDate, setMobileStartDate] = useState(new Date());
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, appointment: null });

  // Minimalna udaljenost za swipe
  const minSwipeDistance = 50;

  // Provjeri je li mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generiraj dane za mobile view (3 dana)
  const getMobileDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 3; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Generiraj dani u tjednu
  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ponedjeljak kao prvi dan
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // Generiraj jedan dan
  const getDayView = (date) => {
    return [new Date(date)];
  };

  const displayDays = isMobile 
    ? getMobileDays(mobileStartDate)
    : viewMode === 'week' 
      ? getWeekDays(currentWeek) 
      : getDayView(currentWeek);
  const dayNames = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
  const monthNames = [
    'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
    'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'
  ];

  // Generiraj vrijeme slotove (8:00 - 20:00) svakih 30 minuta
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 20) { // Ne dodaj 20:30 jer je to izvan radnog vremena
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  useEffect(() => {
    if (isMobile) {
      fetchMobileAppointments();
    } else if (viewMode === 'week') {
      fetchWeekAppointments();
    } else if (viewMode === 'day') {
      fetchDayAppointments();
    } else if (viewMode === 'month') {
      fetchMonthAppointments();
    }
  }, [currentWeek, viewMode, isMobile, mobileStartDate]);

  const fetchMobileAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const mobileDays = getMobileDays(mobileStartDate);
      const startDate = mobileDays[0].toISOString().split('T')[0];
      const endDate = mobileDays[2].toISOString().split('T')[0];
      
      const response = await fetch(`/api/appointments/week?start=${startDate}&end=${endDate}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Greška pri dohvaćanju narudžbi');
      }
      
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weekDays = getWeekDays(currentWeek);
      const startDate = weekDays[0].toISOString().split('T')[0];
      const endDate = weekDays[6].toISOString().split('T')[0];
      
      const response = await fetch(`/api/appointments/week?start=${startDate}&end=${endDate}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Greška pri dohvaćanju narudžbi');
      }
      
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const firstDay = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1);
      const lastDay = new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0);
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const response = await fetch(`/api/appointments/week?start=${startDate}&end=${endDate}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Greška pri dohvaćanju narudžbi');
      }

      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments (month):', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const selectedDate = currentWeek.toISOString().split('T')[0];
      
      const response = await fetch(`/api/appointments?date=${selectedDate}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Greška pri dohvaćanju narudžbi');
      }
      
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction) => {
    if (isMobile) {
      const newDate = new Date(mobileStartDate);
      newDate.setDate(newDate.getDate() + direction);
      setMobileStartDate(newDate);
    } else {
      const newDate = new Date(currentWeek);
      if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction * 7));
      } else if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + direction);
      } else if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + direction);
      }
      setCurrentWeek(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    setMobileStartDate(today);
  };

  // Touch handling za mobile swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigateWeek(1); // Sljedeći dan
    } else if (isRightSwipe) {
      navigateWeek(-1); // Prethodnji dan
    }
  };

  const getAppointmentsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(app => {
      const appDate = new Date(app.date).toISOString().split('T')[0];
      return appDate === dateStr;
    });
  };

  const getAppointmentPosition = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const hour = appointmentDate.getHours();
    const minutes = appointmentDate.getMinutes();
    
    // Pozicija u odnosu na početak radnog vremena (8:00)
    const startHour = 8;
    const totalMinutes = (hour - startHour) * 60 + minutes;
    
    // Različite visine za mobile i desktop
    const slotHeight = isMobile ? 50 : 40;
    const top = (totalMinutes / 30) * slotHeight;
    
    // Visina na temelju trajanja usluge
    const duration = appointment.service?.duration || 60;
    const height = Math.min((duration / 30) * slotHeight, slotHeight * 2); // Maksimalno 2 slota visine
    
    return { top, height };
  };

  const getServiceColor = (serviceName) => {
    const colors = {
      'Šišanje': '#E8F4FD',
      'Pranje i Šišanje': '#FFF2E8',
      'Brijanje': '#E8F8F0',
      'Oblikovanje Brade': '#F0E8FF',
      'default': '#F5F5F5'
    };
    return colors[serviceName] || colors.default;
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

      if (!response.ok) {
        throw new Error('Greška pri ažuriranju statusa');
      }

      // Ažuriraj lokalno stanje
      setAppointments(prev => prev.map(app => 
        app._id === appointmentId ? { ...app, status: newStatus } : app
      ));

      // Ažuriraj odabranu narudžbu ako je potrebno
      if (selectedAppointment && selectedAppointment._id === appointmentId) {
        setSelectedAppointment(prev => ({ ...prev, status: newStatus }));
      }

    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Greška pri ažuriranju statusa narudžbe');
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovu narudžbu?')) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Greška pri brisanju narudžbe');
      }

      // Ukloni iz lokalnog stanja
      setAppointments(prev => prev.filter(app => app._id !== appointmentId));
      
      // Zatvori bočni panel ako je ova narudžba bila odabrana
      if (selectedAppointment && selectedAppointment._id === appointmentId) {
        setSelectedAppointment(null);
      }

    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('Greška pri brisanju narudžbe');
    }
  };

  // Helpers for DnD and refresh
  const getSlotHeight = () => (isMobile ? 50 : 40);

  const refreshAppointments = async () => {
    if (isMobile) {
      await fetchMobileAppointments();
    } else if (viewMode === 'week') {
      await fetchWeekAppointments();
    } else if (viewMode === 'day') {
      await fetchDayAppointments();
    } else {
      await fetchWeekAppointments(); // fallback
    }
  };

  const handleDragStart = (e, appointment) => {
    try {
      e.dataTransfer.setData('text/plain', appointment._id);
      setDraggingId(appointment._id);
    } catch {}
  };

  const handleDropOnDay = async (e, date) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    if (!id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const slotH = getSlotHeight();
    const slotsFromStart = Math.max(0, Math.floor(relY / slotH));
    const minutesFromStart = slotsFromStart * 30; // 30-min increments

    const newDate = new Date(date);
    newDate.setHours(8, 0, 0, 0);
    newDate.setMinutes(newDate.getMinutes() + minutesFromStart);

    try {
      const res = await fetch(`/api/appointments/${id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate.toISOString() })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Greška pri promjeni termina');
        return;
      }
      // Update local state optimistically
      setAppointments(prev => prev.map(a => a._id === id ? data : a));
    } catch (err) {
      console.error('Reschedule error:', err);
      alert('Greška pri promjeni termina');
    }
  };

  const getMonthDaysMatrix = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay() === 0 ? 7 : firstOfMonth.getDay(); // Mon=1..Sun=7
    const startDate = new Date(year, month, 1 - (startDay - 1));
    const weeks = [];
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + w * 7 + d);
        week.push(day);
      }
      weeks.push(week);
    }
    return weeks;
  };

  const openContextMenu = (e, appointment) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, appointment });
  };

  const closeContextMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));

  return (
    <div className="calendar-view" onClick={closeContextMenu}>
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button className="nav-btn today-btn" onClick={goToToday}>
            DANAS
          </button>
          <button className="nav-btn" onClick={() => navigateWeek(-1)}>
            ‹
          </button>
          <button className="nav-btn" onClick={() => navigateWeek(1)}>
            ›
          </button>
          <div className="current-period">
            {isMobile 
              ? `${displayDays[0].getDate()}. - ${displayDays[2].getDate()}. ${monthNames[displayDays[0].getMonth()]} ${displayDays[0].getFullYear()}`
              : viewMode === 'week' 
                ? `${monthNames[currentWeek.getMonth()]} ${currentWeek.getFullYear()}`
                : viewMode === 'day'
                  ? `${currentWeek.getDate()}. ${monthNames[currentWeek.getMonth()]} ${currentWeek.getFullYear()}`
                  : `${monthNames[currentWeek.getMonth()]} ${currentWeek.getFullYear()}`
            }
          </div>
        </div>
        {!isMobile && (
          <div className="view-toggles">
            <button 
              className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              DAN
            </button>
            <button 
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              TJEDAN
            </button>
            <button 
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              MJESEC
            </button>
          </div>
        )}
        <div className="legend">
          <span><i className="legend-box pending"></i> Na čekanju</span>
          <span><i className="legend-box confirmed"></i> Potvrđeno</span>
          <span><i className="legend-box cancelled"></i> Otkazano</span>
          <span><i className="legend-box completed"></i> Završeno</span>
        </div>
      </div>

      <div className="calendar-container">
        {/* Kalendar */}
        <div className={`calendar-content ${selectedAppointment ? 'with-sidebar' : ''} ${(!isMobile && viewMode === 'month') ? 'month-mode' : ''}`}>
          {(!isMobile && viewMode === 'month') && (
            <div className="month-grid">
              {getMonthDaysMatrix(currentWeek).map((week, wi) => (
                <div key={wi} className="month-week">
                  {week.map((day, di) => {
                    const isCurrentMonth = day.getMonth() === currentWeek.getMonth();
                    const dayApps = getAppointmentsForDay(day);
                    return (
                      <div 
                        key={di} 
                        className={`month-day ${isCurrentMonth ? '' : 'muted'}`}
                        onClick={(e) => {
                          // Only switch view if clicking on empty space (not on event)
                          if (e.target.classList.contains('month-day') || 
                              e.target.classList.contains('month-day-header') || 
                              e.target.classList.contains('month-day-body') ||
                              e.target.classList.contains('more')) {
                            setCurrentWeek(new Date(day));
                            setViewMode('day');
                          }
                        }}
                      >
                        <div className="month-day-header">{day.getDate()}</div>
                        <div className="month-day-body">
                          {dayApps.slice(0, 3).map(app => (
                            <div
                              key={app._id}
                              className={`month-event status-${app.status}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); }}
                              onContextMenu={(e) => openContextMenu(e, app)}
                            >
                              {new Date(app.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })} {app.customerName}
                            </div>
                          ))}
                          {dayApps.length > 3 && <div className="more">+{dayApps.length - 3} više</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Header s datumima */}
          <div 
            className={`calendar-dates-header ${isMobile ? 'mobile-view' : viewMode === 'day' ? 'day-view' : ''}`}
            style={{
              gridTemplateColumns: `${isMobile ? '60px' : '80px'} repeat(${displayDays.length}, 1fr)`
            }}
          >
            <div className="time-column-header"></div>
            {displayDays.map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayName = isMobile || viewMode === 'week' 
                ? dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]
                : dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1];
              return (
                <div key={index} className={`date-column-header ${isToday ? 'today' : ''}`}>
                  <div className="day-name">{dayName}</div>
                  <div className="day-number">{date.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Kalendar grid */}
          <div 
            className={`calendar-grid ${isMobile ? 'mobile-view' : viewMode === 'day' ? 'day-view' : ''}`}
            style={{
              gridTemplateColumns: `${isMobile ? '60px' : '80px'} repeat(${displayDays.length}, 1fr)`
            }}
            onTouchStart={isMobile ? onTouchStart : undefined}
            onTouchMove={isMobile ? onTouchMove : undefined}
            onTouchEnd={isMobile ? onTouchEnd : undefined}
          >
            {/* Vremenska kolona */}
            <div className="time-column">
              {timeSlots.map((time, index) => (
                <div key={index} className="time-slot">
                  {time}
                </div>
              ))}
            </div>

            {/* Dani */}
            {displayDays.map((date, dayIndex) => (
              <div key={dayIndex} className="day-column" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>handleDropOnDay(e, date)}>
                {timeSlots.map((time, timeIndex) => (
                  <div key={timeIndex} className="hour-slot"></div>
                ))}
                
                {/* Narudžbe za ovaj dan */}
                {getAppointmentsForDay(date).map((appointment) => {
                  const position = getAppointmentPosition(appointment);
                  const serviceClass = appointment.service?.name?.toLowerCase().replace(/\s+/g, '-') || '';
                  return (
                    <div
                      key={appointment._id}
                      className={`appointment-block status-${appointment.status} service-${serviceClass} ${selectedAppointment?._id === appointment._id ? 'selected' : ''}`}
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appointment)}
                      onDragEnd={() => setDraggingId(null)}
                      onContextMenu={(e) => openContextMenu(e, appointment)}
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="appointment-content">
                        <div className="service-name">{appointment.service?.name} - {appointment.customerName}</div>
                        <div className="appointment-time">
                          {new Date(appointment.date).toLocaleTimeString('hr-HR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {new Date(new Date(appointment.date).getTime() + (appointment.service?.duration || 60) * 60000).toLocaleTimeString('hr-HR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {appointment.status === 'confirmed' && <div className="status-icon">★</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bočni panel za upravljanje narudžbom */}
        {selectedAppointment && (
          <div className="appointment-sidebar">
            <div className="sidebar-header">
              <h3>Upravljanje Narudžbom</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedAppointment(null)}
              >
                ×
              </button>
            </div>

            <div className="sidebar-content">
              <div className="appointment-details">
                <h4>{selectedAppointment.service?.name}</h4>
                <p className="customer-info">
                  <strong>{selectedAppointment.customerName}</strong>
                </p>
                <p className="appointment-datetime">
                  {new Date(selectedAppointment.date).toLocaleDateString('hr-HR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  <br />
                  {new Date(selectedAppointment.date).toLocaleTimeString('hr-HR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {new Date(new Date(selectedAppointment.date).getTime() + (selectedAppointment.service?.duration || 60) * 60000).toLocaleTimeString('hr-HR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>

                <div className="contact-info">
                  <p><strong>Email:</strong> {selectedAppointment.customerEmail}</p>
                  <p><strong>Telefon:</strong> {selectedAppointment.customerPhone}</p>
                </div>

                <div className="service-info">
                  <p><strong>Trajanje:</strong> {selectedAppointment.service?.duration} minuta</p>
                  <p><strong>Cijena:</strong> {selectedAppointment.service?.price} KM</p>
                </div>

                {selectedAppointment.notes && (
                  <div className="notes">
                    <strong>Napomene:</strong>
                    <p>{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              <div className="status-section">
                <label>Status narudžbe:</label>
                <select
                  value={selectedAppointment.status}
                  onChange={(e) => updateAppointmentStatus(selectedAppointment._id, e.target.value)}
                  className="calendar-view status-select"
                >
                  <option value="pending">Na čekanju</option>
                  <option value="confirmed">Potvrđeno</option>
                  <option value="cancelled">Otkazano</option>
                  <option value="completed">Završeno</option>
                </select>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn-primary"
                  onClick={() => updateAppointmentStatus(selectedAppointment._id, 'confirmed')}
                  disabled={selectedAppointment.status === 'confirmed'}
                >
                  Potvrdi narudžbu
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => updateAppointmentStatus(selectedAppointment._id, 'completed')}
                  disabled={selectedAppointment.status === 'completed'}
                >
                  Označi završeno
                </button>
                <div className="bottom-buttons">
                  <button 
                    className="btn-secondary btn-update"
                    onClick={() => updateAppointmentStatus(selectedAppointment._id, selectedAppointment.status)}
                  >
                    Ažuriraj
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => deleteAppointment(selectedAppointment._id)}
                  >
                    Obriši
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && <div className="loading-overlay">Učitavanje...</div>}
      {error && <div className="error-message">{error}</div>}

      {contextMenu.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x, position:'fixed' }}>
          <button onClick={() => { updateAppointmentStatus(contextMenu.appointment._id, 'confirmed'); closeContextMenu(); }}>Potvrdi</button>
          <button onClick={() => { updateAppointmentStatus(contextMenu.appointment._id, 'cancelled'); closeContextMenu(); }}>Otkaži</button>
          <button onClick={() => { setSelectedAppointment(contextMenu.appointment); closeContextMenu(); }}>Uredi</button>
        </div>
      )}
    </div>
  );
};

export default CalendarView;