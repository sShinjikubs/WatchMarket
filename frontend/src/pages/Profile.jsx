import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../api';
import Header from '../components/Header';
import { Icons } from '../components/Icons';
import { useRef } from 'react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', phone: '', address: '' });
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

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
      const payload = { ...form, avatar: user.avatar }; // Preserve avatar if not modified
      const res = await api.saveProfile(user.username, payload);
      if (res.ok) showNotif('บันทึกข้อมูลโปรไฟล์สำเร็จ!');
      else showNotif('บันทึกข้อมูลไม่สำเร็จ', false);
    } catch (_) { showNotif('เซิร์ฟเวอร์ขัดข้อง', false); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotif('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', false);
      return;
    }
    
    // ~2MB limit (2 * 1024 * 1024 bytes)
    if (file.size > 2097152) {
      showNotif('ขนาดไฟล์ต้องไม่เกิน 2MB', false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      try {
        const payload = { ...form, avatar: dataUrl };
        const res = await api.saveProfile(user.username, payload);
        if (res.ok) {
          updateUser({ avatar: dataUrl });
          showNotif('อัปโหลดรูปโปรไฟล์สำเร็จ!');
        } else {
          showNotif('อัปโหลดไม่สำเร็จ', false);
        }
      } catch {
        showNotif('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = async () => {
    try {
      const payload = { ...form, avatar: '' }; // Send empty string to clear
      const res = await api.saveProfile(user.username, payload);
      if (res.ok) {
        updateUser({ avatar: '' }); // Update context to reflect deletion
        showNotif('ลบรูปโปรไฟล์สำเร็จ!');
      } else {
        showNotif('ลบรูปโปรไฟล์ไม่สำเร็จ', false);
      }
    } catch {
      showNotif('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', false);
    }
  };

  return (
    <div className="page-wrapper">
      {notification && <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>}
      <Header />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <Icons.User style={{ color: 'var(--accent-gold)', width: '24px', height: '24px' }} />
            <span>โปรไฟล์ของฉัน</span>
          </h1>
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
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icons.Check />
                <span>บันทึกข้อมูล</span>
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h2 className="card-title">ข้อมูลบัญชี</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' }}>
              
              <div style={{ position: 'relative' }}>
                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleAvatarChange} />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gold)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', 
                    fontWeight: 'bold', color: '#000', cursor: 'pointer', overflow: 'hidden',
                    backgroundImage: user?.avatar ? `url(${user.avatar})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    border: '2px solid var(--accent-gold)'
                  }}
                  title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
                >
                  {!user?.avatar && user?.username?.charAt(0).toUpperCase()}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user?.username}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {user?.role === 'admin' ? (
                    <>
                      <Icons.Crown style={{ color: 'var(--accent-gold)' }} />
                      <span>Administrator</span>
                    </>
                  ) : user?.role === 'manager' ? (
                    <>
                      <Icons.Chart style={{ color: 'var(--accent-gold)' }} />
                      <span>Manager</span>
                    </>
                  ) : (
                    <>
                      <Icons.User style={{ color: 'var(--accent-gold)' }} />
                      <span>Customer</span>
                    </>
                  )}
                </div>
                {user?.avatar && (
                  <button onClick={handleDeleteAvatar} style={{ background: 'none', border: 'none', color: '#ef5350', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.5rem', padding: 0 }}>
                    ลบรูปโปรไฟล์
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
