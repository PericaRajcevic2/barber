import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import CustomCalendar from './components/CustomCalendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import toast from 'react-hot-toast';

// Lazy load admin components
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ReviewForm = lazy(() => import('./components/ReviewForm'));
const PublicReviews = lazy(() => import('./components/PublicReviews'));
const InstallPrompt = lazy(() => import('./components/InstallPrompt'));

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);

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
      setServicesLoading(true);
      const response = await fetch('/api/services');
      const servicesData = await response.json();
      setServices(servicesData);
      // Ne postavljaj automatski prvu uslugu - korisnik mora eksplicitno odabrati
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Greška pri dohvaćanju usluga');
    } finally {
      setServicesLoading(false);
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


// Telefonska validacija: default BiH, podrži i Hrvatsku.
function normalizePhone(p) { return String(p || '').replace(/[^+\d]/g, ''); }
function isValidPhoneBiH(p) {
  const x = normalizePhone(p);
  // +3876XXXXXXX (8 znamenki nakon 6x) ili lokalno 06XXXXXXX (9 znamenki ukupno)
  return /^\+3876\d{7}$/.test(x) || /^06\d{7}$/.test(x);
}
function isValidPhoneHR(p) {
  const x = normalizePhone(p);
  // +3859XXXXXXXX (9 nakon 9x) ili lokalno 09XXXXXXXX
  return /^\+3859\d{8}$/.test(x) || /^09\d{8}$/.test(x);
}
function isValidPhoneAny(p) { return isValidPhoneBiH(p) || isValidPhoneHR(p); }

const handleOpenConfirm = (e) => {
  e.preventDefault();
  if (!selectedService) {
    toast.error('Molimo odaberite uslugu!');
    return;
  }
  if (!selectedTime) {
    toast.error('Molimo odaberite vrijeme!');
    return;
  }
  if (!formData.customerName.trim()) {
    toast.error('Unesite ime i prezime.');
    return;
  }
  if (!formData.customerEmail.trim()) {
    toast.error('Unesite email adresu.');
    return;
  }
  if (!isValidPhoneAny(formData.customerPhone)) {
    toast.error('Broj telefona nije ispravan. Prihvatamo BiH (+387/06x) i HR (+385/09x) formate.');
    return;
  }
  setShowConfirmModal(true);
};

const handleSubmit = async (e) => {
  if (e) e.preventDefault();

  // Ponovna validacija u slučaju izmjena unutar modala
  if (!selectedService) {
    toast.error('Molimo odaberite uslugu!');
    return;
  }
  if (!selectedTime) {
    toast.error('Molimo odaberite vrijeme!');
    return;
  }
  if (!formData.customerName.trim()) {
    toast.error('Unesite ime i prezime.');
    return;
  }
  if (!formData.customerEmail.trim()) {
    toast.error('Unesite email adresu.');
    return;
  }
  if (!isValidPhoneAny(formData.customerPhone)) {
    toast.error('Broj telefona nije ispravan. Prihvatamo BiH (+387/06x) i HR (+385/09x) formate.');
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
      toast.success('Termin uspješno rezerviran!');
      // Reset form
      setFormData({ 
        customerName: '', 
        customerEmail: '', 
        customerPhone: '', 
        notes: '' 
      });
      setSelectedTime('');
      setSelectedService('');
      setShowConfirmModal(false);
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
      toast.error(errorMsg);
    }
  } catch (error) {
    setIsLoading(false);
    let errorMsg = 'Došlo je do greške pri rezervaciji. Pokušajte ponovo.';
    if (error && error.message && error.message.includes('Unexpected token')) {
      errorMsg = 'Server je trenutno nedostupan ili je u cold startu. Pokušajte ponovo za minutu.';
    }
    setSuccessMessage(errorMsg);
    setShowSuccessModal(true);
    toast.error(errorMsg);
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
    return (
      <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><div className="loading-spinner"></div></div>}>
        <AdminDashboard user={user} onLogout={handleAdminLogout} />
      </Suspense>
    );
  }

  // Ako treba prikazati admin login
  if (showAdminLogin) {
    return (
      <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><div className="loading-spinner"></div></div>}>
        <AdminLogin onLogin={handleAdminLogin} onCancel={() => setShowAdminLogin(false)} />
      </Suspense>
    );
  }

  // Prikaži normalnu booking stranicu
  return (
    <div className="App">
      <Helmet>
        <title>Barber Booking – Rezerviraj termin online</title>
        <meta name="description" content="Rezervirajte termin u frizerskom salonu Jimmy brzo i jednostavno. Online naručivanje za šišanje i brijanje." />
        <meta property="og:title" content="Barber Booking" />
        <meta property="og:description" content="Online rezervacije – šišanje i brijanje" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.origin : ''} />
        <meta property="og:image" content="/icons/icon-512x512.png" />
      </Helmet>
      <header className="app-header">
        <h1>💈 Frizerski salon Jimmy 💈</h1>
        <p>Rezervirajte svoj termin jednostavno i brzo</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowAdminLogin(true)} 
            className="admin-access-btn"
          >
            Admin pristup
          </button>
          <button 
            onClick={() => setShowReviewForm(true)} 
            className="review-btn"
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ⭐ Ostavite Recenziju
          </button>
        </div>
      </header>
      
      {/* Review Form Modal */}
      {showReviewForm && (
        <Suspense fallback={<div className="loading-spinner"></div>}>
          <ReviewForm 
            onClose={() => setShowReviewForm(false)}
            onSuccess={() => setShowReviewForm(false)}
          />
        </Suspense>
      )}
      
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
            {servicesLoading ? (
              <>
                <div className="skeleton skeleton-select"></div>
                <div className="skeleton skeleton-line"></div>
              </>
            ) : (
              <div className="services-grid">
                {services.map(service => (
                  <div
                    key={service._id}
                    className={`service-card ${selectedService === service._id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedService(service._id);
                      setTimeout(() => scrollToSection(timeSlotsSectionRef), 100);
                    }}
                  >
                    {service.image && (
                      <div className="service-card-image">
                        <img src={service.image} alt={service.name} />
                      </div>
                    )}
                    <div className="service-card-content">
                      <h4>{service.name}</h4>
                      <p className="service-card-duration">{service.duration} min</p>
                      <p className="service-card-price">{service.price} KM</p>
                      {service.description && (
                        <p className="service-card-desc">{service.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              type="button" 
              onClick={handleOpenConfirm}
              disabled={isLoading}
              className={`submit-btn ${isLoading ? 'disabled' : ''}`}
            >
              {isLoading ? 'Rezerviram...' : 'Rezerviraj termin'}
            </button>
          </form>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal-overlay confirm-modal" style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh'}} onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <span className="success-checkmark">📝</span>
            </div>
            <h2 className="modal-title confirm-title">POTVRDA REZERVACIJE</h2>

            <div className="confirm-summary">
              <div className="confirm-grid">
                <div className="confirm-label">Usluga:</div>
                <div className="confirm-value">{services.find(s => s._id === selectedService)?.name || '-'}</div>

                <div className="confirm-label">Datum:</div>
                <div className="confirm-value muted">{formatDate(date)}</div>

                <div className="confirm-label">Vrijeme:</div>
                <div className="confirm-value">{selectedTime}</div>
              </div>

              <div className="confirm-edit-grid">
                <div className="confirm-field">
                  <label>Ime i prezime</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Ime i prezime"
                  />
                </div>
                <div className="confirm-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="email@domena.com"
                  />
                </div>
                <div className="confirm-field">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+3876xxxxxxx ili 06xxxxxxx / +3859xxxxxxxx ili 09xxxxxxxx"
                  />
                </div>
                <div className="confirm-field full">
                  <label>Napomene (opcionalno)</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Dodatne informacije za frizera"
                    style={{resize: 'vertical'}}
                  />
                </div>
              </div>
              <div className="confirm-note">Klikom na Potvrdi rezervaciju prihvaćate otkazivanje najkasnije 2 sata prije termina.</div>
            </div>

            <div className="confirm-actions">
              <button className="btn-secondary-outline" onClick={() => setShowConfirmModal(false)}>Odustani</button>
              <button className="btn-primary-solid" onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Slanje...' : 'Potvrdi rezervaciju'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Public Reviews */}
      <Suspense fallback={<div className="loading-spinner"></div>}>
        <PublicReviews />
      </Suspense>

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

      {/* PWA Install Prompt */}
      <Suspense fallback={null}>
        <InstallPrompt />
      </Suspense>
    </div>
  );
}

export default App;