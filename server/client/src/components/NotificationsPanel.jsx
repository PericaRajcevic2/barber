import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './ManagementStyles.clean.css';

const NotificationsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/notifications?limit=100');
      setItems(res.data || []);
    } catch (e) {
      setError('Ne mogu učitati notifikacije');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      fetchItems();
    } catch {}
  };

  const clearAll = async () => {
    if (!window.confirm('Obrisati sve notifikacije?')) return;
    try {
      await api.delete('/api/notifications/clear');
      fetchItems();
    } catch {}
  };

  return (
    <div className="management-container">
      <div className="section-header">
        <h2>🔔 Notifikacije</h2>
        <div className="appointment-actions">
          <button className="btn-secondary" onClick={markAllRead}>Označi sve kao pročitane</button>
          <button className="btn-delete" onClick={clearAll}>Obriši sve</button>
        </div>
      </div>

      {loading && <div className="loading">Učitavanje...</div>}
      {error && <div className="no-data">{error}</div>}

      {!loading && !items.length && (
        <div className="no-data">Nema notifikacija</div>
      )}

      <div className="items-grid">
        {items.map(n => (
          <div key={n._id} className="item-card">
            <div className="item-header">
              <h3>{n.title}</h3>
              <span className={`status-badge ${n.read ? 'inactive' : 'active'}`}>
                {n.read ? 'pročitano' : 'novo'}
              </span>
            </div>
            <div className="item-details">
              <p>{n.message}</p>
              <p style={{ color: '#8898aa', marginTop: 8 }}>
                {new Date(n.createdAt).toLocaleString('hr-HR')}
              </p>
            </div>
            <div className="item-actions">
              {!n.read && (
                <button
                  className="btn-edit"
                  onClick={async () => {
                    await api.patch(`/api/notifications/${n._id}/read`);
                    fetchItems();
                  }}
                >
                  Označi kao pročitano
                </button>
              )}
              {n.data?.appointmentId && (
                <a className="btn-primary" href="/admin" onClick={(e) => e.preventDefault()}>
                  Otvori u admin panelu
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPanel;
