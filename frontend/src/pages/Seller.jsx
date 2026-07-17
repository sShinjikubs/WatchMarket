import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth, useLanguage } from '../App';
import Header from '../components/Header';
import SystemLogger from '../components/SystemLogger';

export default function Seller() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [pendingWatches, setPendingWatches] = useState([]);
  const [isRegistered, setIsRegistered] = useState(() => {
    try { return JSON.parse(localStorage.getItem('watchmart_db_seller_registered')) || false; }
    catch { return false; }
  });
  const [blocked, setBlocked] = useState(false);
  const [notification, setNotification] = useState(null);
  const [regForm, setRegForm] = useState({ name: '', email: '', nationalId: '' });
  const [watchForm, setWatchForm] = useState({ brand: '', model: '', price: '', proposedBanding: 'classic', dialColor: '#1a1a2e', description: '' });

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async () => {
    try {
      const res = await api.getPendingWatches();
      if (res.ok) setPendingWatches(await res.json());
    } catch (_) {}
  };

  useEffect(() => { refreshData(); }, []);

  const setReg = (f) => (e) => setRegForm((prev) => ({ ...prev, [f]: e.target.value }));
  const setWatch = (f) => (e) => setWatchForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.registerSeller(regForm);
      if (res.ok) {
        setIsRegistered(true);
        setBlocked(false);
        localStorage.setItem('watchmart_db_seller_registered', JSON.stringify(true));
        showNotif(t('sellerVerifySuccess'));
        refreshData();
      } else {
        setBlocked(true);
        const d = await res.json();
        showNotif(d.error || t('sellerBlacklisted'), false);
      }
    } catch (_) { showNotif(t('serverError'), false); }
  };

  const handleWatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.proposWatch({
        ...watchForm,
        price: parseFloat(watchForm.price),
        sellerName: regForm.name || user?.username || 'Seller',
        sellerEmail: regForm.email || '',
      });
      if (res.ok) {
        showNotif(t('proposeSuccess'));
        setWatchForm({ brand: '', model: '', price: '', proposedBanding: 'classic', dialColor: '#1a1a2e', description: '' });
        refreshData();
      } else {
        const d = await res.json();
        showNotif(d.error || t('proposeFailed'), false);
      }
    } catch (_) { showNotif(t('serverErrorGeneric'), false); }
  };

  const totalProposed = pendingWatches.length;
  const pendingCount = pendingWatches.filter((w) => w.importStatus === 'pending').length;
  const importedCount = pendingWatches.filter((w) => w.importStatus === 'imported').length;

  return (
    <div className="page-wrapper">
      {notification && <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>}
      <Header />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">{t('sellerPortalTitle')}</h1>
          <p className="page-subtitle">{t('sellerPortalSubtitle')}</p>
        </div>

        {!isRegistered ? (
          <div className="glass-card" style={{ maxWidth: '560px', margin: '0 auto' }}>
            <h2 className="card-title">{t('verifySellerTitle')}</h2>
            {blocked && (
              <div className="error-banner">
                {t('blacklistWarning')}
              </div>
            )}
            <form onSubmit={handleRegister} className="form-stack">
              <div className="form-group">
                <label className="form-label">{t('fullName')}</label>
                <input className="form-input" value={regForm.name} onChange={setReg('name')} required placeholder={t('fullNamePlaceholder')} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('email')}</label>
                <input type="email" className="form-input" value={regForm.email} onChange={setReg('email')} required placeholder="email@example.com" id="seller-email" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('nationalId')}</label>
                <input className="form-input" value={regForm.nationalId} onChange={setReg('nationalId')} required placeholder="X-XXXX-XXXXX-XX-X" id="seller-national-id" />
              </div>
              <button type="submit" className="btn btn-primary w-full">{t('verifySubmit')}</button>
            </form>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{totalProposed}</div><div className="stat-label">{t('totalProposedLabel')}</div></div>
              <div className="stat-card"><div className="stat-value">{pendingCount}</div><div className="stat-label">{t('pendingLabel')}</div></div>
              <div className="stat-card"><div className="stat-value">{importedCount}</div><div className="stat-label">{t('importedLabel')}</div></div>
            </div>

            <div className="content-grid two-col">
              {/* Propose Watch Form */}
              <div className="glass-card">
                <h2 className="card-title">{t('proposeWatchTitle')}</h2>
                <form onSubmit={handleWatchSubmit} className="form-stack" id="seller-watch-form">
                  <div className="form-group">
                    <label className="form-label">{t('watchBrand')}</label>
                    <input className="form-input" value={watchForm.brand} onChange={setWatch('brand')} required placeholder="Rolex, Patek Philippe..." id="sw-brand" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('watchModel')}</label>
                    <input className="form-input" value={watchForm.model} onChange={setWatch('model')} required placeholder="Submariner, Nautilus..." id="sw-model" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('proposePrice')}</label>
                    <input type="number" className="form-input" value={watchForm.price} onChange={setWatch('price')} required placeholder="250000" id="sw-price" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('priceBanding')}</label>
                    <select className="form-select" value={watchForm.proposedBanding} onChange={setWatch('proposedBanding')} id="sw-banding">
                      <option value="classic">{t('bandingClassic')}</option>
                      <option value="sport">{t('bandingSport')}</option>
                      <option value="elegant">{t('bandingElegant')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('dialColor')}</label>
                    <input type="color" className="form-input" value={watchForm.dialColor} onChange={setWatch('dialColor')} id="sw-dial-color" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('watchCondition')}</label>
                    <textarea className="form-input" rows={3} value={watchForm.description} onChange={setWatch('description')} id="sw-desc" placeholder={t('watchConditionPlaceholder')} />
                  </div>
                  <button type="submit" className="btn btn-primary w-full">{t('submitProposalBtn')}</button>
                </form>
              </div>

              {/* Proposed Watches Table */}
              <div className="glass-card">
                <h2 className="card-title">{t('myProposalsTitle')}</h2>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('watchCol')}</th>
                        <th>{t('price')}</th>
                        <th>{t('priceBanding')}</th>
                        <th>{t('conditionCol')}</th>
                        <th>{t('statusCol')}</th>
                      </tr>
                    </thead>
                    <tbody id="seller-watches-table">
                      {pendingWatches.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('noProposals')}</td></tr>
                      ) : pendingWatches.map((w) => (
                        <tr key={w.id}>
                          <td><strong>{w.brand}</strong> {w.model}</td>
                          <td>฿ {w.price?.toLocaleString()}</td>
                          <td><span className="badge" style={{ background: 'rgba(197,168,128,0.1)', color: 'var(--accent-gold)' }}>{w.proposedBanding?.toUpperCase()}</span></td>
                          <td>
                            {w.inspectionStatus === 'pending' && <span className="badge badge-watch-pending">{t('statusPendingCheck')}</span>}
                            {w.inspectionStatus === 'passed' && <span className="badge badge-watch-passed">{t('statusPassed')}</span>}
                            {w.inspectionStatus === 'failed' && <span className="badge badge-watch-failed">{t('statusFailed')}</span>}
                          </td>
                          <td>
                            {w.importStatus === 'imported' ? <span className="badge badge-watch-imported">{t('importedLabel')}</span> : <span className="badge badge-watch-pending">{t('statusPendingImport')}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        <SystemLogger />
      </main>
    </div>
  );
}
