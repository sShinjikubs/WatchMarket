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
        setError(data.error || data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-layout">
      {/* Left Side: Brand Imagery */}
      <div 
        className="login-left-side"
        style={{ backgroundImage: 'url("/images/TAG Heuer/TAG Heuer Formula 1 Chronograph  Front.avif")' }}
      >
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
          <h2 className="login-title-minimal">เข้าสู่ระบบ</h2>
          
          {error && <div className="error-message" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label>เข้าสู่ระบบเป็น</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">👤 Customer / Seller</option>
                <option value="admin">👑 Admin</option>
                <option value="manager">📊 Manager</option>
              </select>
            </div>

            <div className="login-input-group">
              <label>ชื่อผู้ใช้</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้"
                required
                autoFocus
              />
            </div>

            <div className="login-input-group">
              <label>รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                required
              />
            </div>

            <button type="submit" className="login-btn-full" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="login-form-footer">
            ยังไม่มีบัญชี?{' '}
            <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
              สมัครสมาชิก
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
