import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
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
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Provjeri da li je admin već prijavljen (iz localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAdmin(true);
    }
  }, []);

  // Dohvati usluge pri učitavanju
  useEffect(() => {
    fetchServices();
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
    // Koristi YYYY-MM-DD format bez vremenske zone
    const dateString = selectedDate.toISOString().split('T')[0];
    console.log(`📅 Frontend traži termine za: ${dateString}`);
    
    const response = await fetch(`/api/available-slots?date=${dateString}`);
    const slots = await response.json();
    
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
    const appointmentDate = new Date(date);
    
    // Postavi vrijeme u UTC da se izbjegnu problemi s zonama
    appointmentDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    console.log(`🕒 Kreiran termin: ${appointmentDate.toISOString()}`);

    const appointmentData = {
      ...formData,
      service: selectedService,
      date: appointmentDate.toISOString() // Pošalji ISO string
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
      alert('Termin je uspješno rezerviran!');
      
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
      const error = await response.json();
      alert(`Greška: ${error.message}`);
    }
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    alert('Došlo je do greške pri rezervaciji.');
  } finally {
    setIsLoading(false);
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
          <h2>📅 Odaberite datum</h2>
          <Calendar 
            onChange={setDate} 
            value={date}
            minDate={new Date()}
            locale="hr-HR"
            className="custom-calendar"
          />
          <div className="selected-date">
            Odabrani datum: <strong>{formatDate(date)}</strong>
          </div>
        </div>

        <div className="booking-form">
          <h2>✂️ Rezervirajte termin</h2>
          
          <div className="form-section">
            <label className="section-label">1. Odaberite uslugu:</label>
            <select 
              value={selectedService} 
              onChange={(e) => setSelectedService(e.target.value)}
              className="service-select"
            >
              {services.map(service => (
                <option key={service._id} value={service._id}>
                  {service.name} - {service.duration}min - {service.price}€
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
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
        {availableSlots.map(slot => (
          <button 
            key={slot}
            type="button"
            className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
            onClick={() => setSelectedTime(slot)}
          >
            {slot}
          </button>
        ))}
      </div>
    )}
  </div>
</div>

          <form onSubmit={handleSubmit} className="customer-form">
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
              {isLoading ? 'Rezerviram...' : '✅ Rezerviraj termin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;