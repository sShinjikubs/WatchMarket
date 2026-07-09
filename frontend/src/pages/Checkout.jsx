import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useCart } from '../CartContext';
import { api } from '../api';
import Header from '../components/Header';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', address: '', payment: 'promptpay' });
  const [slipBase64, setSlipBase64] = useState(null);
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
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

  const handleSlip = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSlipBase64(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((form.payment === 'promptpay' || form.payment === 'bank_transfer') && !slipBase64) {
      showNotif('โปรดแนบสลิปการโอนเงิน', false);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createOrder({
        userId: user.username,
        items: cart.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
        email: form.email,
        address: form.address,
        payment: form.payment,
        slip: slipBase64,
      });
      if (res.ok) {
        const data = await res.json();
        setOrderId(data.id || 'ORD-' + Date.now());
        clearCart();
        setOrderSuccess(true);
      } else {
        const d = await res.json();
        showNotif(d.error || 'การสั่งซื้อล้มเหลว', false);
      }
    } catch {
      showNotif('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่', false);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success Screen ────────────────────────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
          <div style={{
            textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)', borderRadius: '20px', maxWidth: '480px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'pulse 1s' }}>🎉</div>
            <h2 style={{ color: '#51cf66', fontSize: '1.8rem', marginBottom: '0.5rem' }}>สั่งซื้อสำเร็จ!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              ขอบคุณสำหรับการสั่งซื้อนาฬิกาจาก WatchMart<br />
              ทีมงานจะดำเนินการส่งสินค้าให้คุณโดยเร็วที่สุด
            </p>
            {orderId && (
              <div style={{ background: 'rgba(81,207,102,0.08)', border: '1px solid rgba(81,207,102,0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>หมายเลขออเดอร์ของคุณ</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#51cf66', fontFamily: 'monospace' }}>{orderId}</div>
              </div>
            )}
            <button
              className="btn btn-primary"
              style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }}
              onClick={() => navigate('/')}
            >
              กลับไปที่ร้านค้า 🏠
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
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>🏠 หน้าหลัก</button>
          <span>›</span>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>ตะกร้าสินค้า</button>
          <span>›</span>
          <span style={{ color: 'var(--accent-gold)' }}>ชำระเงิน</span>
        </nav>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>💳 ชำระเงินและยืนยันคำสั่งซื้อ</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

          {/* LEFT: Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Contact Info */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--accent-gold)' }}>📋 ข้อมูลติดต่อ</h3>
              <div className="form-group">
                <label className="form-label">อีเมลติดต่อ *</label>
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
                <label className="form-label">ที่อยู่จัดส่ง *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="บ้านเลขที่, ถนน, แขวง, เขต, จังหวัด, รหัสไปรษณีย์"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--accent-gold)' }}>💰 วิธีชำระเงิน</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {[
                  { value: 'promptpay', label: '📱 PromptPay QR Code', desc: 'สแกน QR แล้วแนบสลิป' },
                  { value: 'bank_transfer', label: '🏦 โอนเงินผ่านธนาคาร', desc: 'โอนแล้วแนบสลิปยืนยัน' },
                  { value: 'cod', label: '📦 ชำระเงินปลายทาง (COD)', desc: 'ชำระเงินเมื่อรับสินค้า' },
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
                  <div style={{ color: '#0c4a60', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.8rem' }}>🔲 PromptPay QR Code</div>
                  <div style={{
                    width: '140px', height: '140px', margin: '0 auto',
                    background: 'repeating-conic-gradient(from 45deg, #0b0c10 0% 25%, #fff 0% 50%)',
                    backgroundSize: '10px 10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '4px',
                  }}>
                    <div style={{ width: '40px', height: '40px', background: '#0c4a60', borderRadius: '6px' }} />
                  </div>
                  <div style={{ marginTop: '0.8rem', color: '#0c4a60', fontWeight: 700, fontSize: '1.2rem' }}>฿ {cartTotal.toLocaleString()}</div>
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>โอนครบแล้วแนบสลิปด้านล่าง</div>
                </div>
              )}

              {/* Slip upload */}
              {(form.payment === 'promptpay' || form.payment === 'bank_transfer') && (
                <div className="form-group">
                  <label className="form-label">แนบสลิปการโอนเงิน *</label>
                  <input
                    type="file"
                    className="form-input"
                    accept="image/*"
                    onChange={handleSlip}
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
              {submitting ? '⏳ กำลังดำเนินการ...' : 'ยืนยันการสั่งซื้อ ✅'}
            </button>
          </form>

          {/* RIGHT: Order Summary */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--accent-gold)' }}>🧾 สรุปคำสั่งซื้อ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '50px', height: '50px', background: 'rgba(197,168,128,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⌚</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
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
                  <span>ราคาสินค้า</span><span>฿ {cartTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span>ค่าจัดส่ง</span><span style={{ color: '#51cf66' }}>ฟรี</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--glass-border)' }}>
                  <span>ยอดรวม</span>
                  <span style={{ color: 'var(--accent-gold)' }}>฿ {cartTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
