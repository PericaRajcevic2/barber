import React, { useState } from 'react';
import './AdminLogin.css';

const AdminLogin = ({ onLogin, onCancel }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Došlo je do greške pri prijavi');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <div className="admin-login-header">
          <h2>💈 Admin Prijava</h2>
          <p>Dobrodošli u administraciju</p>
        </div>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label>Korisničko ime:</label>
            <input
              type="text"
              placeholder="Unesite korisničko ime"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label>Lozinka:</label>
            <input
              type="password"
              placeholder="Unesite lozinku"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <div className="login-actions">
            <button type="submit" className="login-btn-primary">Prijavi se</button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="login-btn-secondary">Natrag</button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};

export default AdminLogin;