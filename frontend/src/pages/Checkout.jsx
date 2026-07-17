import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
import { useCart } from '../CartContext';
import { api } from '../api';
import Header from '../components/Header';
import { Icons } from '../components/Icons';

export default function Checkout() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { cart: contextCart, cartTotal: contextCartTotal, clearCart, removeSelectedFromCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowItem = location.state?.buyNowItem;
  const stateItems = location.state?.checkoutItems;
  const checkoutItems = buyNowItem ? [buyNowItem] : (stateItems ? stateItems : contextCart);
  const checkoutTotal = buyNowItem ? buyNowItem.price * buyNowItem.quantity : (stateItems ? stateItems.reduce((s, i) => s + i.price * i.quantity, 0) : contextCartTotal);

  const [form, setForm] = useState({ email: '', address: '', payment: 'promptpay' });
  const [slipBase64, setSlipBase64] = useState(null);
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (checkoutItems.length === 0 && !orderSuccess) {
      navigate('/');
    }
    // Pre-fill email and address from profile
    api.getProfile(user.username).then(async (res) => {
      if (res.ok) {
        const profile = await res.json();
        setForm((f) => ({
          ...f,
          email: profile.email || '',
          address: profile.address || '',
        }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.payment === 'promptpay' && checkoutTotal > 0) {
      setLoadingQR(true);
      api.getPaymentQR(checkoutTotal)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setQrCode(data.qrCode);
          } else {
            showNotif(t('loadQRFail').replace('❌ ', ''), false);
          }
        })
        .catch(() => {
          showNotif(t('serverErrorGeneric'), false);
        })
        .finally(() => {
          setLoadingQR(false);
        });
    }
  }, [form.payment, checkoutTotal]);

  const handleSlip = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSlipBase64(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createOrder({
        userId: user.username,
        items: checkoutItems.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
        email: form.email,
        address: form.address,
        payment: form.payment,
        slip: slipBase64 || null,
      });
      if (res.ok) {
        const data = await res.json();
        setOrderId(data.id || 'ORD-' + Date.now());
        if (buyNowItem) {
          // Do nothing to cart
        } else if (stateItems) {
          removeSelectedFromCart(stateItems.map(i => i.id));
        } else {
          clearCart();
        }
        setOrderSuccess(true);
      } else {
        const d = await res.json();
        showNotif(d.error || t('checkoutFailedToast'), false);
      }
    } catch {
      showNotif(t('serverErrorGeneric'), false);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success Screen ────────────────────────────────────────────────────────
  if (orderSuccess) {
    let title = t('orderSuccessTitle1');
    let icon = "🛍️";
    let desc = <span dangerouslySetInnerHTML={{ __html: t('orderSuccessDesc1') }} />;

    if (form.payment === 'promptpay' || form.payment === 'bank_transfer') {
      if (slipBase64) {
        title = t('orderSuccessTitle2');
        icon = "⏳";
        desc = <span dangerouslySetInnerHTML={{ __html: t('orderSuccessDesc2') }} />;
      } else {
        title = t('orderSuccessTitle3');
        icon = "💸";
        desc = <span dangerouslySetInnerHTML={{ __html: t('orderSuccessDesc3') }} />;
      }
    } else if (form.payment === 'cod') {
      title = t('orderSuccessTitle4');
      icon = "📦";
      desc = <span dangerouslySetInnerHTML={{ __html: t('orderSuccessDesc4') }} />;
    }

    return (
      <div className="page-wrapper">
        <Header />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
          <div style={{
            textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)', borderRadius: '20px', maxWidth: '480px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{icon}</div>
            <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>{title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {desc}
            </p>
            {orderId && (
              <div style={{ background: 'rgba(255,169,77,0.08)', border: '1px solid rgba(255,169,77,0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('orderIdLabel')}</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-gold)', fontFamily: 'monospace' }}>{orderId}</div>
              </div>
            )}
            <button
              className="btn btn-primary"
              style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }}
              onClick={() => navigate('/')}
            >
              {t('backToStoreBtn')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Checkout Form ────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      {notification && (
        <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>
      )}
      <Header />

      <main className="main-content">
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>{t('homeBreadcrumb')}</button>
          <span>›</span>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>{t('cart')}</button>
          <span>›</span>
          <span style={{ color: 'var(--accent-gold)' }}>{t('checkout').replace(' 💳', '')}</span>
        </nav>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>{t('checkoutConfirmTitle')}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

          {/* LEFT: Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Contact Info */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--accent-gold)' }}>{t('contactInfoTitle')}</h3>
              <div className="form-group">
                <label className="form-label">{t('contactEmailLabel')}</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">{t('shippingAddressLabel')}</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={t('addressPlaceholderCheckout')}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--accent-gold)' }}>{t('paymentMethodTitle')}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {[
                  { value: 'promptpay', label: t('paymentPromptPay'), desc: t('paymentPromptPayDesc') },
                  { value: 'bank_transfer', label: t('paymentBank'), desc: t('paymentBankDesc') },
                  { value: 'cod', label: t('paymentCOD'), desc: t('paymentCODDesc') },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem',
                      border: `2px solid ${form.payment === value ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                      borderRadius: '10px', cursor: 'pointer',
                      background: form.payment === value ? 'rgba(197,168,128,0.08)' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={value}
                      checked={form.payment === value}
                      onChange={(e) => setForm((f) => ({ ...f, payment: e.target.value }))}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent-gold)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* QR Code for PromptPay */}
              {form.payment === 'promptpay' && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem', background: 'white', borderRadius: '12px', display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ color: '#0c4a60', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.8rem' }}>{t('paymentPromptPay')}</div>
                  
                  {loadingQR ? (
                    <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Icons.Loading style={{ color: '#0c4a60' }} />
                        <span>{t('generatingQR')}</span>
                      </span>
                    </div>
                  ) : qrCode ? (
                    <img 
                      src={qrCode} 
                      alt="PromptPay QR" 
                      style={{ width: '160px', height: '160px', margin: '0 auto', display: 'block', borderRadius: '8px' }} 
                    />
                  ) : (
                    <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b' }}>
                      {t('loadQRFail')}
                    </div>
                  )}

                  <div style={{ marginTop: '0.8rem', color: '#0c4a60', fontWeight: 700, fontSize: '1.2rem' }}>฿ {checkoutTotal.toLocaleString()}</div>
                  <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.3rem' }}>{t('scanQRInstruction')}</div>
                  <div style={{ color: '#ff922b', fontSize: '0.7rem', marginTop: '0.3rem', fontWeight: 'bold' }}>{t('qrMockWarning')}</div>
                </div>
              )}

              {/* Slip upload */}
              {(form.payment === 'promptpay' || form.payment === 'bank_transfer') && (
                <div className="form-group">
                  <label className="form-label">
                    {form.payment === 'bank_transfer' ? t('attachSlipRequired') : t('attachSlipOptional')}
                  </label>
                  <input
                    type="file"
                    className="form-input"
                    accept="image/*"
                    onChange={handleSlip}
                    required={form.payment === 'bank_transfer'}
                    style={{ padding: '0.5rem' }}
                  />
                  {slipBase64 && (
                    <img src={slipBase64} alt="slip preview" style={{ maxWidth: '100%', marginTop: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 700 }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', width: '100%' }}>
                  <Icons.Loading />
                  <span>{t('processingLabel')}</span>
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', width: '100%' }}>
                  <Icons.Check />
                  <span>{t('confirmOrderBtn')}</span>
                </span>
              )}
            </button>
          </form>

          {/* RIGHT: Order Summary */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--accent-gold)' }}>{t('orderSummaryTitle')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {checkoutItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    {item.image ? (
                      <img src={item.image} alt={lang === 'en' && item.nameEn ? item.nameEn : item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '50px', height: '50px', background: 'rgba(197,168,128,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icons.Watch style={{ width: '22px', height: '22px', color: 'var(--accent-gold)' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'en' && item.nameEn ? item.nameEn : item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>฿ {item.price.toLocaleString()} × {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.9rem', flexShrink: 0 }}>
                      ฿ {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span>{t('productPriceTotalLabel')}</span><span>฿ {checkoutTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span>{t('shippingFeeLabel')}</span><span style={{ color: '#51cf66' }}>{t('freeLabel')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--glass-border)' }}>
                  <span>{t('grandTotalLabel')}</span>
                  <span style={{ color: 'var(--accent-gold)' }}>฿ {checkoutTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
