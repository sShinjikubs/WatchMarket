import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useCart } from '../CartContext';
import { api } from '../api';
import Header from '../components/Header';
import SystemLogger from '../components/SystemLogger';

export default function Storefront() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'Luminox' | 'Seiko'
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([api.getProducts(), api.getOrders()]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (_) {}
  };

  useEffect(() => { refreshData(); }, []);

  // ─── Filtered Products ────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    if (filter !== 'all' && p.brand !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ─── Cart Actions ─────────────────────────────────────────────────────────
  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;
    const ok = addToCart(product, 1);
    if (ok) {
      showNotif(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`);
    } else {
      showNotif(`สินค้า "${product.name}" ในคลังหมดแล้ว!`, false);
    }
  };

  const cancelOrder = async (id) => {
    if (!confirm(`ยกเลิกออเดอร์ "${id}" ใช่หรือไม่?`)) return;
    const res = await api.cancelOrder(id);
    if (res.ok) { showNotif('ยกเลิกสำเร็จ'); refreshData(); }
    else showNotif('ยกเลิกไม่สำเร็จ', false);
  };

  const myOrders = orders.filter((o) => o.userId === user?.username);

  return (
    <div className="page-wrapper">
      {notification && (
        <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>
      )}

      <Header />

      <main className="main-content">
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-text">
            <div className="hero-badge">Premium Collection 2024</div>
            <h1>Discover Timeless<br /><span className="hero-highlight">Luxury Watches</span></h1>
            <p>คัดสรรนาฬิกาหรูชั้นเยี่ยมจากแบรนด์ชั้นนำระดับโลก พร้อมรับประกันของแท้ทุกเรือน</p>
          </div>
        </section>

        {/* Product Filters */}
        <section className="products-section">
          <div className="section-header">
            <h2 className="section-title">สินค้าทั้งหมด</h2>
            <div className="filter-controls">
              <input
                className="search-input"
                type="text"
                placeholder="ค้นหานาฬิกา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {[{ key: 'all', label: 'ทั้งหมด' }, { key: 'Luminox', label: 'LUMINOX' }, { key: 'Seiko', label: 'SEIKO' }].map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-btn ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="products-grid" id="products-list">
            {filteredProducts.length === 0 ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                ไม่พบสินค้าตรงตามเงื่อนไข
              </p>
            ) : filteredProducts.map((p) => (
              <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>
                <div className="product-card-preview">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                    />
                  ) : (
                    <svg className="product-watch-svg" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="70" fill="none" stroke={p.strokeColor} strokeWidth="3" />
                      <circle cx="100" cy="100" r="66" fill={p.color} />
                      <line x1="100" y1="100" x2="100" y2="76" stroke="#f5f5f7" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="100" y1="100" x2="118" y2="100" stroke="#f5f5f7" strokeWidth="1.2" strokeLinecap="round" />
                      <line x1="100" y1="100" x2="90" y2="124" stroke="#ff6b6b" strokeWidth="0.8" />
                    </svg>
                  )}
                </div>
                <div className="product-card-details">
                  <span className="product-card-brand">{p.brand}</span>
                  <h3 className="product-card-title">{p.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span className="product-card-price">฿ {p.price.toLocaleString()}</span>
                    <span className="product-card-stock" style={{ color: p.stock === 0 ? '#ff6b6b' : p.stock <= 3 ? '#ff922b' : '#51cf66' }}>
                      {p.stock === 0 ? 'หมดสต็อก' : `สต็อก: ${p.stock} เรือน`}
                    </span>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1.2rem' }}
                    disabled={p.stock === 0}
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                  >
                    {p.stock === 0 ? 'สินค้าหมดชั่วคราว' : 'ใส่ตะกร้าสินค้า 🛒'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* My Orders */}
        <section className="orders-section">
          <h2 className="section-title">ประวัติใบสั่งซื้อของฉัน</h2>
          <div id="customer-orders-list">
            {myOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>ไม่มีรายการคำสั่งซื้อในขณะนี้</p>
            ) : myOrders.map((ord) => (
              <div key={ord.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <strong>Order ID: {ord.id}</strong><br />
                    <small style={{ color: 'var(--text-muted)' }}>{ord.date}</small>
                  </div>
                  <span className={`badge ${ord.status === 'paid' ? 'badge-paid' : ord.status === 'shipped' ? 'badge-shipped' : 'badge-cancelled'}`}>
                    {ord.status === 'paid' ? 'ชำระเงินแล้ว' : ord.status === 'shipped' ? 'จัดส่งแล้ว' : 'ยกเลิก'}
                  </span>
                </div>
                <div style={{ marginTop: '0.8rem', fontSize: '0.95rem' }}>
                  <strong>รายการสินค้า:</strong> {ord.items.map((i) => `${i.name} (${i.quantity} เรือน)`).join(', ')}<br />
                  <strong>ราคารวม:</strong> ฿ {ord.total?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  <strong>ที่อยู่:</strong> {ord.address} | <strong>วิธีชำระ:</strong> {ord.payment?.toUpperCase()}
                </div>
                {ord.status === 'paid' && (
                  <button className="btn btn-danger" style={{ marginTop: '0.8rem', padding: '0.35rem 0.8rem', fontSize: '0.8rem' }} onClick={() => cancelOrder(ord.id)}>
                    ยกเลิกออเดอร์
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <SystemLogger />
      </main>
    </div>
  );
}
