import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    firstname: '', lastname: '', phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.register({
        username: form.username,
        email: form.email,
        password: form.password,
        firstname: form.firstname,
        lastname: form.lastname,
        phone: form.phone,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Registration successful! Redirecting to Login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Registration failed');
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
            src="/images/Rolex/001.avif" 
            alt="Rolex" 
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
          <h1>Join The Legacy</h1>
          <p>Create your account and unlock access to the world's most prestigious timepieces.</p>
          <div className="login-brands-tags">
            <span>SEIKO</span>
            <span>|</span>
            <span>TAG HEUER</span>
            <span>|</span>
            <span>LUMINOX</span>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="login-right-side" style={{ padding: '2rem 3rem' }}>
        <div className="login-form-container" style={{ maxWidth: '450px' }}>
          <h2 className="login-title-minimal">Register</h2>
          
          {error && <div className="error-message" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem' }}>{error}</div>}
          {success && <div className="success-message" style={{ marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem' }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="login-input-group" style={{ flex: 1, marginBottom: '1.5rem' }}>
                <label>First Name</label>
                <input type="text" placeholder="First Name" value={form.firstname} onChange={set('firstname')} required autoFocus />
              </div>
              <div className="login-input-group" style={{ flex: 1, marginBottom: '1.5rem' }}>
                <label>Last Name</label>
                <input type="text" placeholder="Last Name" value={form.lastname} onChange={set('lastname')} required />
              </div>
            </div>

            <div className="login-input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Username</label>
              <input type="text" placeholder="Username" value={form.username} onChange={set('username')} required />
            </div>

            <div className="login-input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Email</label>
              <input type="email" placeholder="Email@example.com" value={form.email} onChange={set('email')} required />
            </div>

            <div className="login-input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Phone Number</label>
              <input type="text" placeholder="08X-XXX-XXXX" value={form.phone} onChange={set('phone')} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="login-input-group" style={{ flex: 1, marginBottom: '1.5rem' }}>
                <label>Password</label>
                <input type="password" placeholder="At least 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div className="login-input-group" style={{ flex: 1, marginBottom: '1.5rem' }}>
                <label>Confirm Password</label>
                <input type="password" placeholder="Enter password again" value={form.confirmPassword} onChange={set('confirmPassword')} required />
              </div>
            </div>

            <button type="submit" className="login-btn-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="login-form-footer">
            Already have an account?{' '}
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
              Log in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
