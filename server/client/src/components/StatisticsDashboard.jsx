import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './StatisticsDashboard.css';

const StatisticsDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmedAppointments: 0,
    revenue: 0,
    popularServices: []
  });
  const [chartData, setChartData] = useState({
    revenueOverTime: [],
    topServices: [],
    customerStats: { new: 0, returning: 0, total: 0 },
    revenueStats: { total: 0, confirmed: 0, pending: 0 }
  });
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    fetchChartData();
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

  const fetchChartData = async () => {
    try {
      const response = await fetch(`/api/admin/statistics/charts?range=${timeRange}`);
      const data = await response.json();
      if (response.ok) {
        setChartData(data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  if (loading) {
    return <div className="loading">Učitavanje statistike...</div>;
  }

  const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'];
  
  const customerPieData = [
    { name: 'Novi klijenti', value: chartData.customerStats.new, color: '#4CAF50' },
    { name: 'Vraćeni klijenti', value: chartData.customerStats.returning, color: '#2196F3' }
  ];

  const revenuePieData = [
    { name: 'Potvrđeno', value: chartData.revenueStats.confirmed, color: '#4CAF50' },
    { name: 'Na čekanju', value: chartData.revenueStats.pending, color: '#FFC107' }
  ];

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
          <option value="year">Zadnjih 12 mjeseci</option>
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

      {/* Charts Section */}
      <div className="charts-section">
        {/* Revenue Over Time */}
        <div className="chart-card">
          <h3>📈 Prihod i Narudžbe preko vremena</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4CAF50" name="Prihod (KM)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="appointments" stroke="#2196F3" name="Narudžbe" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Services Bar Chart */}
        <div className="chart-card">
          <h3>🏆 Top 5 Usluga po Prihodu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.topServices}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#2196F3" name="Prihod (KM)" />
              <Bar dataKey="count" fill="#FF9800" name="Broj narudžbi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Stats Pie */}
        <div className="chart-card">
          <h3>👥 Novi vs. Vraćeni Klijenti</h3>
          <div className="pie-chart-row">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={customerPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="stats-summary">
              <div className="stat-item">
                <span className="stat-label">Ukupno klijenata:</span>
                <span className="stat-value-large">{chartData.customerStats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label" style={{color: '#4CAF50'}}>● Novi:</span>
                <span className="stat-value">{chartData.customerStats.new}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label" style={{color: '#2196F3'}}>● Vraćeni:</span>
                <span className="stat-value">{chartData.customerStats.returning}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Postotak vraćenih:</span>
                <span className="stat-value">
                  {chartData.customerStats.total > 0 
                    ? `${Math.round((chartData.customerStats.returning / chartData.customerStats.total) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Stats Pie */}
        <div className="chart-card">
          <h3>💰 Struktura Prihoda</h3>
          <div className="pie-chart-row">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={revenuePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value} KM`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenuePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="stats-summary">
              <div className="stat-item">
                <span className="stat-label">Ukupan prihod:</span>
                <span className="stat-value-large">{chartData.revenueStats.total} KM</span>
              </div>
              <div className="stat-item">
                <span className="stat-label" style={{color: '#4CAF50'}}>● Potvrđeno:</span>
                <span className="stat-value">{chartData.revenueStats.confirmed} KM</span>
              </div>
              <div className="stat-item">
                <span className="stat-label" style={{color: '#FFC107'}}>● Na čekanju:</span>
                <span className="stat-value">{chartData.revenueStats.pending} KM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;