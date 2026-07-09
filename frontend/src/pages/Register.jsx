import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '',
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
        firstName: form.firstName,
        lastName: form.lastName,
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
        <div className="brand-logo">
          Watch<span>Mart</span>
        </div>
        <h1 className="auth-title">สมัครสมาชิก</h1>
        <p className="auth-subtitle">สร้างบัญชีผู้ใช้ใหม่</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ชื่อจริง</label>
              <input className="form-input" placeholder="ชื่อจริง" value={form.firstName} onChange={set('firstName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">นามสกุล</label>
              <input className="form-input" placeholder="นามสกุล" value={form.lastName} onChange={set('lastName')} required />
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
