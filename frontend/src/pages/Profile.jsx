import React, { useState, useEffect } from 'react';
import { useAuth, useLanguage } from '../App';
import { api } from '../api';
import Header from '../components/Header';
import { Icons } from '../components/Icons';
import { useRef } from 'react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
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
      if (res.ok) showNotif(t('profileSaveSuccess'));
      else showNotif(t('profileSaveFail'), false);
    } catch (_) { showNotif(t('serverError'), false); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotif(t('imageUploadOnly'), false);
      return;
    }
    
    // ~2MB limit (2 * 1024 * 1024 bytes)
    if (file.size > 2097152) {
      showNotif(t('fileSizeLimit'), false);
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
          showNotif(t('avatarUploadSuccess'));
        } else {
          showNotif(t('avatarUploadFail'), false);
        }
      } catch {
        showNotif(t('serverConnError'), false);
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
        showNotif(t('avatarDeleteSuccess'));
      } else {
        showNotif(t('avatarDeleteFail'), false);
      }
    } catch {
      showNotif(t('serverConnError'), false);
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
            <span>{t('myProfileTitle')}</span>
          </h1>
          <p className="page-subtitle">{t('profileSubtitle')}</p>
        </div>

        <div className="content-grid two-col">
          <div className="glass-card">
            <h2 className="card-title">{t('personalInfo')}</h2>
            <form onSubmit={handleSave} className="form-stack">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('firstName')}</label>
                  <input className="form-input" value={form.firstname} onChange={set('firstname')} id="prof-firstname" placeholder={t('firstName')} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('lastName')}</label>
                  <input className="form-input" value={form.lastname} onChange={set('lastname')} id="prof-lastname" placeholder={t('lastName')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('email')}</label>
                <input type="email" className="form-input" value={form.email} onChange={set('email')} id="prof-email" placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('phoneNumber')}</label>
                <input className="form-input" value={form.phone} onChange={set('phone')} id="prof-phone" placeholder={t('phonePlaceholder')} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('shippingAddress')}</label>
                <textarea className="form-input" rows={4} value={form.address} onChange={set('address')} id="prof-address" placeholder={t('addressPlaceholder')} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icons.Check />
                <span>{t('saveDataBtn')}</span>
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h2 className="card-title">{t('accountInfo')}</h2>
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
                  title={t('clickToChangeAvatar')}
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
                    {t('deleteAvatarBtn')}
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
