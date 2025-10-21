import React, { useState, useEffect } from 'react';
import CustomCalendar from './components/CustomCalendar';
import 'react-calendar/dist/Calendar.css';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [services, setServices] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  
  // Refs za scrollanje
  const serviceSectionRef = React.useRef(null);
  const timeSlotsSectionRef = React.useRef(null);
  const customerFormRef = React.useRef(null);
  
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Provjeri da li je admin već prijavljen (iz localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAdmin(true);
    }
  }, []);

  // Fetch blocked dates
  const fetchBlockedDates = async () => {
    try {
      const response = await fetch('/api/admin/blocked-dates');
      if (response.ok) {
        const data = await response.json();
        setBlockedDates(data.map(item => new Date(item.date)));
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    }
  };

  // Dohvati usluge i blokirane datume pri učitavanju
  useEffect(() => {
    fetchServices();
    fetchBlockedDates();
  }, []);

  // Kada se promijeni datum, dohvati slobodne termine
  useEffect(() => {
    if (date && !isAdmin) {
      fetchAvailableSlots(date);
    }
  }, [date, isAdmin]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const servicesData = await response.json();
      setServices(servicesData);
      if (servicesData.length > 0) {
        setSelectedService(servicesData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

const fetchAvailableSlots = async (selectedDate) => {
  try {
    // Koristi lokalni datum (YYYY-MM-DD) iz komponenta Date
    // Ovo izbjegava pomak datuma kada se koristi toISOString() koji konvertira u UTC
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    console.log(`📅 Frontend traži termine za (lokalno): ${dateString}`);

    const response = await fetch(`/api/available-slots?date=${dateString}`);
    const data = await response.json();
    // Ako server vrati grešku, data može biti objekt s porukom
    if (!response.ok) {
      console.error('Server error fetching slots:', data);
      setAvailableSlots([]);
      return;
    }

    const slots = data;
    setAvailableSlots(slots);
    setSelectedTime('');
    
    console.log(`✅ Frontend dobio termine:`, slots);
  } catch (error) {
    console.error('❌ Error fetching slots:', error);
    setAvailableSlots([]);
  }
};


const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedTime) {
    alert('Molimo odaberite vrijeme!');
    return;
  }

  setIsLoading(true);

  try {
    // Kombiniraj datum i vrijeme u UTC
    const [hours, minutes] = selectedTime.split(':');
    // Kreiraj lokalni Date objekt za odabrani datum i vrijeme
    const year = date.getFullYear();
    const month = date.getMonth(); // monthIndex
    const day = date.getDate();
    const appointmentDate = new Date(year, month, day, parseInt(hours), parseInt(minutes), 0, 0);

    console.log(`🕒 Kreiran lokalni termin: ${appointmentDate.toString()} | ISO: ${appointmentDate.toISOString()}`);

    const appointmentData = {
      ...formData,
      service: selectedService,
      date: appointmentDate.toISOString() // Pošalji ISO string (server očekuje ISO timestamp)
    };

    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData)
    });

    if (response.ok) {
      const savedAppointment = await response.json();
      setIsLoading(false);
      setSuccessMessage(`Vaš termin je uspješno rezerviran za ${formatDate(date)} u ${selectedTime}!`);
      setShowSuccessModal(true);
      // Reset form
      setFormData({ 
        customerName: '', 
        customerEmail: '', 
        customerPhone: '', 
        notes: '' 
      });
      setSelectedTime('');
      // Osvježi dostupne termine
      await fetchAvailableSlots(date);
      console.log('✅ Termin spremljen:', savedAppointment);
    } else {
      setIsLoading(false);
      let errorMsg = 'Došlo je do greške pri rezervaciji. Pokušajte ponovo.';
      try {
        // Pokušaj parsirati JSON error
        const error = await response.json();
        if (error && error.message) errorMsg = `Greška: ${error.message}`;
      } catch (e) {
        // Ako nije JSON (npr. HTML/502), prikaži user-friendly poruku
        if (response.status === 502 || response.status === 503) {
          errorMsg = 'Server je trenutno nedostupan. Pokušajte ponovo za minutu.';
        } else {
          errorMsg = 'Neočekivana greška na serveru. Pokušajte kasnije.';
        }
      }
      setSuccessMessage(errorMsg);
      setShowSuccessModal(true);
    }
  } catch (error) {
    setIsLoading(false);
    let errorMsg = 'Došlo je do greške pri rezervaciji. Pokušajte ponovo.';
    if (error && error.message && error.message.includes('Unexpected token')) {
      errorMsg = 'Server je trenutno nedostupan ili je u cold startu. Pokušajte ponovo za minutu.';
    }
    setSuccessMessage(errorMsg);
    setShowSuccessModal(true);
  }
};

  const handleAdminLogin = (userData) => {
    setUser(userData);
    setIsAdmin(true);
    setShowAdminLogin(false);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const handleAdminLogout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('adminUser');
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('hr-HR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Ako je admin prijavljen, prikaži admin panel
  if (isAdmin) {
    return <AdminDashboard user={user} onLogout={handleAdminLogout} />;
  }

  // Ako treba prikazati admin login
  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} onCancel={() => setShowAdminLogin(false)} />;
  }

  // Prikaži normalnu booking stranicu
  return (
    <div className="App">
      <header className="app-header">
        <h1>💈 Frizerski salon Jimmy 💈</h1>
        <p>Rezervirajte svoj termin jednostavno i brzo</p>
        <button 
          onClick={() => setShowAdminLogin(true)} 
          className="admin-access-btn"
        >
          Admin pristup
        </button>
      </header>
      
      <div className="booking-container">
        <div className="calendar-section">
          <h2>Odaberite datum</h2>
          <CustomCalendar 
            value={date}
            onChange={setDate}
            blockedDates={blockedDates}
            onDateSelect={() => setTimeout(() => scrollToSection(serviceSectionRef), 100)}
          />
          <div className="selected-date">
            Odabrani datum: <strong>{formatDate(date)}</strong>
          </div>
        </div>

        <div className="booking-form">
          <h2>Rezervirajte termin</h2>
          
          <div className="form-section" ref={serviceSectionRef}>
            <label className="section-label">1. Odaberite uslugu:</label>
            <select 
              value={selectedService} 
              onChange={(e) => {
                setSelectedService(e.target.value);
                setTimeout(() => scrollToSection(timeSlotsSectionRef), 100);
              }}
              className="service-select"
            >
              {services.map(service => (
                <option key={service._id} value={service._id}>
                  {service.name} - {service.duration}min - {service.price} KM
                </option>
              ))}
            </select>
          </div>

          <div className="form-section" ref={timeSlotsSectionRef}>
  <label className="section-label">2. Odaberite vrijeme:</label>
  <div className="time-slots">
    {isLoading ? (
      <div className="loading-slots">
        <div className="loading-spinner-small"></div>
        Učitavanje termina...
      </div>
    ) : availableSlots.length === 0 ? (
      <div className="no-slots">
        🚫 Nema dostupnih termina za odabrani datum
      </div>
    ) : (
      <div className="slots-grid">
        {availableSlots.map(slot => {
          const slotTime = typeof slot === 'string' ? slot : slot.time;
          const slotStatus = typeof slot === 'string' ? 'available' : slot.status;
          const isDisabled = slotStatus === 'booked' || slotStatus === 'past';
          
          return (
            <button 
              key={slotTime}
              type="button"
              className={`time-slot ${selectedTime === slotTime ? 'selected' : ''} ${slotStatus}`}
              onClick={() => {
                if (!isDisabled) {
                  setSelectedTime(slotTime);
                  // Scroll to customer form after selecting time
                  setTimeout(() => scrollToSection(customerFormRef), 100);
                }
              }}
              disabled={isDisabled}
            >
              {slotTime}
              {slotStatus === 'booked' && <span className="slot-indicator">Zauzeto</span>}
            </button>
          );
        })}
      </div>
    )}
  </div>
</div>

          <form onSubmit={handleSubmit} className="customer-form" ref={customerFormRef}>
            <label className="section-label">3. Vaši podaci:</label>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Ime i prezime *"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                required
                className="form-input"
              />
              <input
                type="email"
                placeholder="Email adresa *"
                value={formData.customerEmail}
                onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                required
                className="form-input"
              />
              <input
                type="tel"
                placeholder="Broj telefona *"
                value={formData.customerPhone}
                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                required
                className="form-input"
              />
            </div>
            <textarea
              placeholder="Dodatne napomene (opcionalno)"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              className="form-textarea"
            />
            
            <button 
              type="submit" 
              disabled={!selectedTime || isLoading}
              className={`submit-btn ${(!selectedTime || isLoading) ? 'disabled' : ''}`}
            >
              {isLoading ? 'Rezerviram...' : 'Rezerviraj termin'}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh'}} onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <span className="success-checkmark">✓</span>
            </div>
            <h2 className="modal-title">Uspješno!</h2>
            <p className="modal-message">{successMessage}</p>
            <button 
              className="modal-btn" 
              onClick={() => setShowSuccessModal(false)}
            >
              U redu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;