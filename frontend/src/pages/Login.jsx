import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(role, username, password);
      const data = await res.json();
      if (res.ok && data.success) {
        const userData = data.user || { username: data.username, role: data.role };
        login({ username: userData.username, role: userData.role });
        if (userData.role === 'admin') navigate('/admin');
        else if (userData.role === 'manager') navigate('/manager');
        else navigate('/');
      } else {
        setError(data.error || data.message || 'Invalid username or password');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-layout">
      {/* Left Side: Brand Imagery */}
      <div 
        className="login-left-side"
        style={{ backgroundColor: '#080a0f', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9, zIndex: 1 }}>
          <img 
            src="/images/TAG Heuer/TAG Heuer Formula 1 Chronograph  Front.avif" 
            alt="TAG Heuer" 
            style={{ width: '150%', height: '150%', objectFit: 'contain', animation: 'float-watch 6s ease-in-out infinite' }}
          />
        </div>
        <div className="login-left-overlay"></div>
        <div className="login-left-content">
          <div className="login-logo">
            Watch<span>Mart</span>
          </div>
        </div>
        <div className="login-slogan">
          <h1>Crafting Time</h1>
          <p>Discover the finest luxury timepieces. Precision, elegance, and mastery in every second.</p>
          <div className="login-brands-tags">
            <span>TAG HEUER</span>
            <span>|</span>
            <span>SEIKO</span>
            <span>|</span>
            <span>LUMINOX</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="login-right-side">
        <div className="login-form-container">
          <h2 className="login-title-minimal">Log in</h2>
          
          {error && <div className="error-message" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>

            <div className="login-input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div className="login-input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="login-btn-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="login-form-footer">
            Don't have an account?{' '}
            <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
              Register
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
