import React, { useState, useEffect } from 'react';
import './StatisticsDashboard.css';

const StatisticsDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmedAppointments: 0,
    revenue: 0,
    popularServices: []
  });
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/admin/statistics?range=${timeRange}`);
      const data = await response.json();
      if (!response.ok) {
        console.error('Server error fetching statistics:', data);
        setStats({
          totalAppointments: 0,
          confirmedAppointments: 0,
          revenue: 0,
          popularServices: []
        });
        return;
      }
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Učitavanje statistike...</div>;
  }

  return (
    <div className="statistics-dashboard">
      <div className="stats-header">
        <h2>📈 Statistika i Izvještaji</h2>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-range-select"
        >
          <option value="week">Zadnjih 7 dana</option>
          <option value="month">Zadnjih 30 dana</option>
          <option value="quarter">Zadnja 3 mjeseca</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Ukupno narudžbi</h3>
            <div className="stat-value">{stats.totalAppointments}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Potvrđene narudžbe</h3>
            <div className="stat-value">{stats.confirmedAppointments}</div>
            <div className="stat-percentage">
              {stats.totalAppointments > 0 
                ? `${Math.round((stats.confirmedAppointments / stats.totalAppointments) * 100)}%`
                : '0%'
              }
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Ukupni prihod</h3>
            <div className="stat-value">{stats.revenue} KM</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Prosječno po narudžbi</h3>
            <div className="stat-value">
              {stats.totalAppointments > 0 
                ? `${(stats.revenue / stats.totalAppointments).toFixed(2)} KM`
                : '0 KM'
              }
            </div>
          </div>
        </div>
      </div>

      <div className="popular-services">
        <h3>🎯 Najpopularnije usluge</h3>
        <div className="services-list">
          {(stats.popularServices || []).map((service, index) => (
            <div key={service._id} className="service-stat">
              <div className="service-rank">#{index + 1}</div>
              <div className="service-info">
                <div className="service-name">{service.name}</div>
                <div className="service-count">{service.count} narudžbi</div>
              </div>
              <div className="service-revenue">{service.revenue} KM</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;