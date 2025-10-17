import React, { useState, useEffect } from 'react';
import './ManagementStyles.css';

const GoogleCalendarSettings = () => {
  const [authStatus, setAuthStatus] = useState('unknown');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
  const response = await fetch('/api/google/google/status');
      const data = await response.json();
      setAuthStatus(data.authenticated ? 'authenticated' : 'not_authenticated');
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus('not_authenticated');
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
  const response = await fetch('/api/google/google');
      const data = await response.json();
      
      // Otvori Google OAuth prozor
      window.open(data.authUrl, '_blank');
    } catch (error) {
      console.error('Error starting Google auth:', error);
      alert('Došlo je do greške pri povezivanju s Google Calendarom');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
  const response = await fetch('/api/google/google/disconnect', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setAuthStatus('not_authenticated');
        alert('Google Calendar je uspješno odspojen');
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      alert('Došlo je do greške pri odspajanju Google Calendara');
    }
  };

  // Provjeri status autentifikacije kada se vratimo s OAuth flowa
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get('googleAuth');
    
    if (googleAuth === 'success') {
      alert('✅ Google Calendar uspješno povezan!');
      checkAuthStatus();
      // Ukloni parametar iz URL-a
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (googleAuth === 'error') {
      alert('❌ Greška pri povezivanju s Google Calendarom');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="management-container">
      <div className="section-header">
        <h2>Google Calendar Integracija</h2>
      </div>

      <div className="calendar-settings">
        <div className="setting-card">
          <h3>📅 Status Integracije</h3>
          
          <div className={`status-indicator ${authStatus === 'authenticated' ? 'status-connected' : 'status-disconnected'}`}>
            {authStatus === 'authenticated' ? (
              <div className="status-content">
                <span className="status-dot connected"></span>
                <strong>Povezan s Google Calendarom</strong>
                <p>Termini će se automatski dodavati u vaš Google Calendar</p>
              </div>
            ) : (
              <div className="status-content">
                <span className="status-dot disconnected"></span>
                <strong>Nije povezano s Google Calendarom</strong>
                <p>Povežite svoj Google Calendar za automatsko upravljanje terminima</p>
              </div>
            )}
          </div>

          <div className="auth-actions">
            {authStatus === 'authenticated' ? (
              <button 
                onClick={handleDisconnect}
                className="btn-secondary"
              >
                Odspoji Google Calendar
              </button>
            ) : (
              <button 
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Povezivanje...' : '🔗 Poveži s Google Calendarom'}
              </button>
            )}
          </div>

          <div className="integration-info">
            <h4>Što ova integracija omogućuje?</h4>
            <ul>
              <li>✅ Automatsko dodavanje novih termina u Google Calendar</li>
              <li>✅ Automatsko ažuriranje termina kada se promijene</li>
              <li>✅ Automatsko brisanje termina kada se otkažu</li>
              <li>✅ Email i push notifikacije iz Google Calendara</li>
              <li>✅ Sync sa svim vašim uređajima</li>
              <li>✅ Podsjetnici za termine</li>
            </ul>

            <div className="setup-instructions">
              <h4>Uputstvo za postavljanje:</h4>
              <ol>
                <li>Kliknite "Poveži s Google Calendarom"</li>
                <li>Odaberite Google account koji želite povezati</li>
                <li>Dozvolite pristup Google Calendaru</li>
                <li>Nakon uspješne autentifikacije, termini će se automatski sync-ati</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarSettings;