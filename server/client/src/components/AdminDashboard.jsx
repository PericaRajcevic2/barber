import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AppointmentsManagement from './AppointmentsManagement';
import CalendarView from './CalendarView';
import ServicesManagement from './ServicesManagement';
import WorkingHoursManagement from './WorkingHoursManagement';
import BlockedDatesManagement from './BlockedDatesManagement';
import StatisticsDashboard from './StatisticsDashboard';
import GoogleCalendarSettings from './GoogleCalendarSettings';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('statistics');
  const [navigationHistory, setNavigationHistory] = useState(['statistics']);
  const [newAppointments, setNewAppointments] = useState(0);
  const [socket, setSocket] = useState(null);

  // Funkcija za promjenu taba koja pamti historiju
  const handleTabChange = (tabId) => {
    setNavigationHistory(prev => [...prev, tabId]);
    setActiveTab(tabId);
  };

  // Funkcija za nazad
  const handleGoBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Ukloni trenutnu stranicu
      const previousTab = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setActiveTab(previousTab);
    }
  };

  // Handler za klik koji osigurava reset animacije
  const handleBackClick = (e) => {
    e.currentTarget.blur(); // Remove focus to reset animation
    handleGoBack();
  };

  useEffect(() => {
    // Spoji se na Socket.io server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    // Joinaj admin room
    newSocket.emit('join_admin');
    
    // Slušaj nove narudžbe
    newSocket.on('new_appointment', (appointment) => {
      console.log('Nova narudžba primljena:', appointment);
      setNewAppointments(prev => prev + 1);
      
      // Prikaži browser notifikaciju
      if (Notification.permission === 'granted') {
        new Notification('Nova narudžba!', {
          body: `${appointment.customerName} - ${appointment.service.name}`,
          icon: '/favicon.ico'
        });
      }
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNewAppointments(prev => Math.max(0, prev - 1));
      }, 5000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Zatraži dozvolu za notifikacije
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const tabs = [
    { id: 'statistics', label: '📈 Statistika', component: StatisticsDashboard },
    { id: 'calendar', label: '🗓️ Kalendar', component: CalendarView },
    { id: 'appointments', label: '📋 Narudžbe', component: AppointmentsManagement },
    { id: 'services', label: '✂️ Usluge', component: ServicesManagement },
    { id: 'working-hours', label: '⏰ Radno Vrijeme', component: WorkingHoursManagement },
    { id: 'blocked-dates', label: '🚫 Blokirani Dani', component: BlockedDatesManagement },
    { id: 'google-calendar', label: '📅 Google Calendar', component: GoogleCalendarSettings },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="admin-dashboard">
      {/* Floating Back Button */}
      {navigationHistory.length > 1 && (
        <button 
          className="floating-back-button" 
          onClick={handleBackClick}
          title="Nazad na prethodnu stranicu"
          aria-label="Nazad"
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      )}

      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Panel - Frizerski salon Jimmy</h1>
          <div className="admin-user">
            <span>Prijavljeni ste kao: <strong>{user?.name}</strong></span>
            {newAppointments > 0 && (
              <span className="notification-badge">{newAppointments} nova</span>
            )}
            <button onClick={onLogout} className="btn-logout">Odjava</button>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <div className="admin-nav-content">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="admin-main">
        <div className="admin-main-content">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;