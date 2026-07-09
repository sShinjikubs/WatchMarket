import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../api';
import Header from '../components/Header';
import SystemLogger from '../components/SystemLogger';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', phone: '', address: '' });
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!user) return;
    api.getProfile(user.username).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setForm({
          firstname: data.firstname || '',
          lastname: data.lastname || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      }
    });
  }, [user]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.saveProfile(user.username, form);
      if (res.ok) showNotif('บันทึกข้อมูลโปรไฟล์สำเร็จ! 🎉');
      else showNotif('บันทึกข้อมูลไม่สำเร็จ', false);
    } catch (_) { showNotif('เซิร์ฟเวอร์ขัดข้อง', false); }
  };

  return (
    <div className="page-wrapper">
      {notification && <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>}
      <Header />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">👤 โปรไฟล์ของฉัน</h1>
          <p className="page-subtitle">จัดการข้อมูลส่วนตัวและที่อยู่จัดส่ง</p>
        </div>

        <div className="content-grid two-col">
          <div className="glass-card">
            <h2 className="card-title">ข้อมูลส่วนตัว</h2>
            <form onSubmit={handleSave} className="form-stack">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ชื่อจริง</label>
                  <input className="form-input" value={form.firstname} onChange={set('firstname')} id="prof-firstname" placeholder="ชื่อจริง" />
                </div>
                <div className="form-group">
                  <label className="form-label">นามสกุล</label>
                  <input className="form-input" value={form.lastname} onChange={set('lastname')} id="prof-lastname" placeholder="นามสกุล" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">อีเมล</label>
                <input type="email" className="form-input" value={form.email} onChange={set('email')} id="prof-email" placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์</label>
                <input className="form-input" value={form.phone} onChange={set('phone')} id="prof-phone" placeholder="08X-XXX-XXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">ที่อยู่จัดส่ง</label>
                <textarea className="form-input" rows={4} value={form.address} onChange={set('address')} id="prof-address" placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" />
              </div>
              <button type="submit" className="btn btn-primary">💾 บันทึกข้อมูล</button>
            </form>
          </div>

          <div className="glass-card">
            <h2 className="card-title">ข้อมูลบัญชี</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: '#000' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user?.username}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {user?.role === 'admin' ? '👑 Administrator' : user?.role === 'manager' ? '📊 Manager' : '👤 Customer'}
                </div>
              </div>
            </div>
            <SystemLogger />
          </div>
        </div>
      </main>
    </div>
  );
}
