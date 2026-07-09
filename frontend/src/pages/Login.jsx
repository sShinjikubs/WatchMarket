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
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="brand-logo">
          Watch<span>Mart</span>
        </div>
        <h1 className="auth-title">เข้าสู่ระบบ</h1>
        <p className="auth-subtitle">ยินดีต้อนรับกลับมา</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">เข้าสู่ระบบเป็น</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">👤 Customer / Seller</option>
              <option value="admin">👑 Admin</option>
              <option value="manager">📊 Manager</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ชื่อผู้ใช้</label>
            <input
              type="text"
              className="form-input"
              placeholder="กรอกชื่อผู้ใช้"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">รหัสผ่าน</label>
            <input
              type="password"
              className="form-input"
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="auth-footer">
          ยังไม่มีบัญชี?{' '}
          <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
            สมัครสมาชิก
          </a>
        </div>
      </div>
    </div>
  );
}
