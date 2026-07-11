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
      setError('รหัสผ่านไม่ตรงกัน');
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
        setSuccess('สมัครสมาชิกสำเร็จ! กำลังนำไปหน้า Login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'สมัครสมาชิกไม่สำเร็จ');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card" style={{ maxWidth: '480px' }}>
        <div className="brand-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
          <img src="/images/logo.jpg" alt="WatchMart Logo" style={{ height: '70px', borderRadius: '12px', border: '1px solid var(--glass-border)', objectFit: 'contain' }} />
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Watch<span>Mart</span></div>
        </div>
        <h1 className="auth-title">สมัครสมาชิก</h1>
        <p className="auth-subtitle">สร้างบัญชีผู้ใช้ใหม่</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ชื่อจริง</label>
              <input className="form-input" placeholder="ชื่อจริง" value={form.firstname} onChange={set('firstname')} required />
            </div>
            <div className="form-group">
              <label className="form-label">นามสกุล</label>
              <input className="form-input" placeholder="นามสกุล" value={form.lastname} onChange={set('lastname')} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ชื่อผู้ใช้</label>
            <input className="form-input" placeholder="username" value={form.username} onChange={set('username')} required />
          </div>

          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <input type="email" className="form-input" placeholder="email@example.com" value={form.email} onChange={set('email')} required />
          </div>

          <div className="form-group">
            <label className="form-label">เบอร์โทรศัพท์</label>
            <input className="form-input" placeholder="08X-XXX-XXXX" value={form.phone} onChange={set('phone')} />
          </div>

          <div className="form-group">
            <label className="form-label">รหัสผ่าน</label>
            <input type="password" className="form-input" placeholder="อย่างน้อย 6 ตัวอักษร" value={form.password} onChange={set('password')} required minLength={6} />
          </div>

          <div className="form-group">
            <label className="form-label">ยืนยันรหัสผ่าน</label>
            <input type="password" className="form-input" placeholder="กรอกรหัสผ่านอีกครั้ง" value={form.confirmPassword} onChange={set('confirmPassword')} required />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="auth-footer">
          มีบัญชีแล้ว?{' '}
          <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    </div>
  );
}
