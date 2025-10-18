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
    } else {
      fetchDayAppointments();
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
      } else {
        newDate.setDate(newDate.getDate() + direction);
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

  return (
    <div className="calendar-view">
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
                : `${currentWeek.getDate()}. ${monthNames[currentWeek.getMonth()]} ${currentWeek.getFullYear()}`
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
          </div>
        )}
      </div>

      <div className="calendar-container">
        {/* Kalendar */}
        <div className={`calendar-content ${selectedAppointment ? 'with-sidebar' : ''}`}>
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
              <div key={dayIndex} className="day-column">
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
                        height: `${position.height}px`,
                        backgroundColor: getServiceColor(appointment.service?.name)
                      }}
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
    </div>
  );
};

export default CalendarView;