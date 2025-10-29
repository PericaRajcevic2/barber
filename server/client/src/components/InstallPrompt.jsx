import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Listen for PWA install prompt availability
    const handleInstallable = () => {
      if (!standalone) {
        setIsVisible(true);
      }
    };

    window.addEventListener('pwa-installable', handleInstallable);

    // Auto-show after 30 seconds if not installed
    const timer = setTimeout(() => {
      if (!standalone && window.installPWA) {
        setIsVisible(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = () => {
    if (window.installPWA) {
      window.installPWA();
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', new Date().getTime().toString());
  };

  // Don't show if dismissed recently (within 7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setIsVisible(false);
      }
    }
  }, []);

  if (!isVisible || isStandalone) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">📱</div>
        <div className="install-prompt-text">
          <h3>Instaliraj aplikaciju</h3>
          <p>Dodaj na početni ekran za brži pristup!</p>
        </div>
        <div className="install-prompt-actions">
          <button className="install-btn-primary" onClick={handleInstall}>
            Instaliraj
          </button>
          <button className="install-btn-dismiss" onClick={handleDismiss}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
