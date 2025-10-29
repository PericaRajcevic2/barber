import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { initSentry } from './sentry.jsx'
import CancelAppointment from './components/CancelAppointment.jsx'
import './index.css'
import './utils/offlineQueue.js'

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);
        
        // Request push notification permission
        if ('PushManager' in window) {
          // Fetch VAPID public key from server
          fetch('/api/push/vapid-public-key')
            .then(res => res.json())
            .then(data => {
              localStorage.setItem('vapidPublicKey', data.publicKey);
              
              return registration.pushManager.getSubscription();
            })
            .then((subscription) => {
              if (!subscription) {
                const vapidPublicKey = localStorage.getItem('vapidPublicKey');
                if (vapidPublicKey) {
                  // Subscribe to push notifications
                  return registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                  });
                }
              }
              return subscription;
            })
            .then((subscription) => {
              if (subscription) {
                console.log('✅ Push subscription:', subscription);
                // Send subscription to server
                fetch('/api/push/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(subscription)
                }).catch(console.error);
              }
            })
            .catch((error) => {
              console.log('Push subscription not available:', error);
            });
        }
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Initialize Sentry (no-op if DSN missing)
initSentry();

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  if (!base64String || base64String.length === 0) {
    return new Uint8Array(0);
  }
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// PWA Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('💡 PWA install prompt available');
  
  // Show custom install button (can be triggered later)
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully');
  deferredPrompt = null;
});

// Export install function for components
window.installPWA = () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
      }
      deferredPrompt = null;
    });
  }
};

import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/cancel/:token" element={<CancelAppointment />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
)