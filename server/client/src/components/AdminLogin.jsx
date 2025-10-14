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
    <div className="admin-login">
      <div className="login-container">
        <h2>Admin Prijava</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Korisničko ime:</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Lozinka:</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="login-actions">
            <button type="submit" className="btn-primary">Prijavi se</button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="btn-secondary">Natrag</button>
            )}
          </div>
        </form>
        <div className="login-info">
          <p><strong>Testni podaci:</strong></p>
          <p>Korisničko ime: <code>admin</code></p>
          <p>Lozinka: <code>admin123</code></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;