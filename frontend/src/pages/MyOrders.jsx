import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
import { api } from '../api';
import Header from '../components/Header';
import { Icons } from '../components/Icons';

export default function MyOrders() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async () => {
    try {
      const [oRes, pRes] = await Promise.all([api.getOrders(), api.getProducts()]);
      if (oRes.ok) {
        setOrders(await oRes.json());
      }
      if (pRes.ok) {
        setProducts(await pRes.json());
      }
    } catch (_) {}
  };

  const getProductImage = (itemId) => {
    const prod = products.find(p => p.id === itemId);
    return prod ? prod.image : null;
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    refreshData();
  }, [user]);

  const cancelOrder = async (id) => {
    if (!confirm(t('cancelOrderConfirm').replace('{id}', id))) return;
    const res = await api.cancelOrder(id);
    if (res.ok) {
      showNotif(t('cancelSuccess'));
      refreshData();
    } else {
      showNotif(t('cancelFail'), false);
    }
  };

  const getRemainingTimeText = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const diffMs = (d.getTime() + 24 * 60 * 60 * 1000) - Date.now();
      if (diffMs <= 0) return t('paymentExpired');
      const hours = Math.floor(diffMs / (3600 * 1000));
      const minutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
      return t('paymentRemaining').replace('{hours}', hours).replace('{minutes}', minutes);
    } catch (_) {
      return null;
    }
  };

  const handleUploadSlip = async (orderId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const slipBase64 = ev.target.result;
      try {
        const res = await api.submitSlip(orderId, slipBase64);
        if (res.ok) {
          showNotif(t('slipUploadSuccess'));
          refreshData();
        } else {
          const d = await res.json();
          showNotif(d.error || t('slipUploadFail'), false);
        }
      } catch (_) {
        showNotif(t('serverErrorGeneric'), false);
      }
    };
    reader.readAsDataURL(file);
  };

  const myOrders = orders.filter((o) => o.userId === user?.username);

  const getStatusPriority = (status) => {
    if (status === 'confirmed' || status === 'paid') return 1;
    if (status === 'shipped') return 2;
    if (status === 'pending_review') return 3;
    if (status === 'pending_payment') return 4;
    return 5; // cancelled or others
  };

  const sortedMyOrders = [...myOrders].sort((a, b) => {
    const pA = getStatusPriority(a.status);
    const pB = getStatusPriority(b.status);
    if (pA !== pB) return pA - pB;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="page-wrapper">
      {notification && (
        <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>
      )}
      <Header />

      <main className="main-content" style={{ maxWidth: '950px', margin: '80px auto 0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>{t('homeBreadcrumb')}</button>
          <span>›</span>
          <span style={{ color: 'var(--accent-gold)' }}>{t('myOrders')}</span>
        </nav>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: '#f5f5f7' }}>
          <Icons.Book style={{ color: 'var(--accent-gold)' }} />
          <span>{t('myOrders')}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
          {t('myOrdersSubtitle')}
        </p>

        <div id="customer-orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sortedMyOrders.length === 0 ? (
            <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <span>{t('noOrdersHistory')}</span>
            </div>
          ) : sortedMyOrders.map((ord) => (
            <div key={ord.id} className="order-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1.8rem', borderRadius: '16px' }}>
              <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Order ID: {ord.id}</strong><br />
                  <small style={{ color: 'var(--text-muted)' }}>
                    {(() => {
                      try {
                        const d = new Date(ord.date);
                        return isNaN(d.getTime()) ? ord.date : d.toLocaleString('th-TH');
                      } catch (_) {
                        return ord.date;
                      }
                    })()}
                  </small>
                </div>
                <span className={`badge ${
                  ord.status === 'pending_payment' ? 'badge-pending' :
                  ord.status === 'pending_review' ? 'badge-pending' :
                  ord.status === 'confirmed' ? 'badge-paid' :
                  ord.status === 'paid' ? 'badge-paid' :
                  ord.status === 'shipped' ? 'badge-shipped' : 'badge-cancelled'
                }`}
                style={{
                  background: 
                    ord.status === 'pending_payment' ? 'rgba(255,165,0,0.18)' :
                    ord.status === 'pending_review' ? 'rgba(59,130,246,0.18)' : undefined,
                  color:
                    ord.status === 'pending_payment' ? '#ffa94d' :
                    ord.status === 'pending_review' ? '#60a5fa' : undefined,
                  border:
                    ord.status === 'pending_payment' ? '1px solid #ffa94d55' :
                    ord.status === 'pending_review' ? '1px solid #60a5fa55' : undefined
                }}>
                  {ord.status === 'pending_payment' ? t('statusPendingPayment') :
                   ord.status === 'pending_review' ? t('statusPendingReview') :
                   ord.status === 'confirmed' ? t('statusConfirmed') :
                   ord.status === 'paid' ? t('statusPaid') :
                   ord.status === 'shipped' ? t('statusShipped') : t('statusCancelled')}
                </span>
              </div>

              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('itemsListLabel')}</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {ord.items.map((item) => {
                    const img = getProductImage(item.id);
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '10px' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {img ? (
                            <img src={img} alt={lang === 'en' && item.nameEn ? item.nameEn : item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Icons.Watch style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.2)' }} />
                          )}
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <button 
                            onClick={() => navigate(`/product/${item.id}`)}
                            onMouseEnter={(e) => e.target.style.color = 'var(--accent-gold)'}
                            onMouseLeave={(e) => e.target.style.color = '#f5f5f7'}
                            style={{ background: 'none', border: 'none', color: '#f5f5f7', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'block', transition: 'color 0.2s' }}
                          >
                            {lang === 'en' && item.nameEn ? item.nameEn : item.name}
                          </button>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('itemPriceQty').replace('{price}', item.price?.toLocaleString() || '0').replace('{qty}', item.quantity)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.8rem' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>{t('totalPriceLabel')}</strong>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1.25rem' }}>฿ {ord.total?.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.8rem' }}>
                <span>📍 <strong>{t('shippingAddress')}:</strong> {ord.address}</span>
                <span>💳 <strong>{t('paymentMethod')}:</strong> {ord.payment?.toUpperCase()}</span>
              </div>

              {ord.status === 'pending_payment' && (
                <div style={{ marginTop: '1.2rem', padding: '1.2rem', background: 'rgba(255,165,0,0.03)', borderRadius: '12px', border: '1px solid rgba(255,165,0,0.15)' }}>
                  <div style={{ fontSize: '0.88rem', color: '#ffa94d', fontWeight: 'bold', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>💵 {getRemainingTimeText(ord.date)}</span>
                    <span>{t('pleaseTransfer')}</span>
                  </div>
                  {getRemainingTimeText(ord.date) !== t('paymentExpired') ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {ord.payment === 'bank_transfer' && (
                        <div style={{ 
                          padding: '1rem', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '10px', 
                          marginBottom: '0.8rem' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ 
                              width: '40px', 
                              height: '40px', 
                              background: '#138c45', 
                              borderRadius: '8px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontFamily: "'Oswald', sans-serif",
                              flexShrink: 0
                            }}>
                              K-BANK
                            </div>
                            <div style={{ fontSize: '0.82rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>ธนาคารกสิกรไทย (Kasikornbank)</div>
                              <div style={{ fontWeight: 'bold', letterSpacing: '1px', margin: '0.1rem 0', color: '#f5f5f7' }}>
                                012-3-45678-9
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ชื่อบัญชี: บจก. วอทช์มาร์ท จำกัด
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
                        onChange={(e) => handleUploadSlip(ord.id, e)}
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                        {t('slipUploadTip')}
                      </small>
                    </div>
                  ) : (
                    <div style={{ color: '#ff6b6b', fontSize: '0.85rem', fontWeight: 'bold' }}>{t('orderExpired')}</div>
                  )}
                </div>
              )}

              {(ord.status === 'paid' || ord.status === 'confirmed' || ord.status === 'pending_payment' || ord.status === 'pending_review') && (
                <button 
                  className="btn btn-danger" 
                  style={{ marginTop: '1.2rem', padding: '0.45rem 1.2rem', fontSize: '0.85rem', fontWeight: 600 }} 
                  onClick={() => cancelOrder(ord.id)}
                >
                  {t('cancelOrderBtn')}
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
