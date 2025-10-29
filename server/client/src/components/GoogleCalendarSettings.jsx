import React, { useState, useEffect } from 'react';
import './ManagementStyles.clean.css';

const GoogleCalendarSettings = () => {
  const [authStatus, setAuthStatus] = useState('unknown');
  const [hasTokens, setHasTokens] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/google/status');
      const data = await response.json();
      setAuthStatus(data.authenticated ? 'authenticated' : 'not_authenticated');
      setHasTokens(!!data.hasTokens);
      setEnabled(!!data.enabled);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus('not_authenticated');
      setHasTokens(false);
      setEnabled(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google');
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
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setAuthStatus('not_authenticated');
        setHasTokens(false);
        alert('Google Calendar je uspješno odspojen');
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      alert('Došlo je do greške pri odspajanju Google Calendara');
    }
  };

  const handleToggleEnabled = async () => {
    try {
      const response = await fetch('/api/auth/google/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled })
      });
      const data = await response.json();
      if (data.success) {
        setEnabled(data.enabled);
      } else {
        alert('Greška pri promjeni statusa integracije');
      }
    } catch (error) {
      console.error('Error toggling integration:', error);
      alert('Greška pri promjeni statusa integracije');
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
          
          <div className={`status-indicator ${(authStatus === 'authenticated' && hasTokens) ? 'status-connected' : 'status-disconnected'}`}>
            {(authStatus === 'authenticated' && hasTokens) ? (
              <div className="status-content">
                <span className="status-dot connected"></span>
                <strong>Povezan s Google Calendarom</strong>
                <p>Tokeni spremljeni u bazi. Autentifikacija aktivna.</p>
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
            {(authStatus === 'authenticated' && hasTokens) ? (
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

          {(authStatus === 'authenticated' && hasTokens) && (
            <div className="setting-row" style={{ marginTop: '16px' }}>
              <label>Integracija uključena:</label>
              <button onClick={handleToggleEnabled} className="btn-secondary">
                {enabled ? 'Isključi' : 'Uključi'}
              </button>
              <span style={{ marginLeft: 12, color: enabled ? '#16a34a' : '#6b7280' }}>
                {enabled ? 'Aktivna' : 'Onemogućena (tokeni su sačuvani)'}
              </span>
            </div>
          )}

          <div className="integration-info">
            <h4>Što ova integracija omogućuje?</h4>
            <ul>
              <li>✅ Automatsko dodavanje novih termina u Google Calendar</li>
              <li>✅ Automatsko ažuriranje termina kada se promijene</li>
              <li>✅ Automatsko brisanje termina kada se otkažu</li>
              <li>✅ Dvosmjerna sinkronizacija preko Google webhooks</li>
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