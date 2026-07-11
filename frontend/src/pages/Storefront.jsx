import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
import { useCart } from '../CartContext';
import { api } from '../api';
import Header from '../components/Header';
import SystemLogger from '../components/SystemLogger';

const HERO_SLIDES = [
  {
    title: "TAG HEUER CARRERA",
    subtitle: "X PORSCHE AUTOMATIC",
    desc: "ดีไซน์สปอร์ตหรูหราสะท้อนประวัติศาสตร์ความเร็ว คอนเซปต์ระดับเวิลด์คลาสในหน้าปัดกลไกโครโนกราฟคาลิเบอร์สุดหรู",
    image: "/images/TAG Heuer/More/TAG Heuer Carrera Chronograph x Porsche Automatic, 44 mm, Steel Front.avif",
    bg: "linear-gradient(135deg, #181d2c 0%, #151515 100%)",
    accent: "var(--accent-gold)",
    keyword: "carrera"
  },
  {
    title: "SEIKO PROSPEX",
    subtitle: "MONSTER CMU 60TH ANNIVERSARY",
    desc: "รุ่นลิมิเต็ดเอดิชันฉลองครบรอบ 60 ปี รังสรรค์ความแข็งแกร่งด้วยกลไกจักรกลและวัสดุสแตนเลสสตีลชั้นเลิศ",
    image: "/images/SEIKO/SEIKO PROSPEX MONSTER CMU 60th Anniversary Limited Edition หน้า.webp",
    bg: "linear-gradient(135deg, #112233 0%, #0a111a 100%)",
    accent: "#ff6b6b",
    keyword: "monster"
  },
  {
    title: "LUMINOX NAVY SEAL",
    subtitle: "BEAR GRYLLS SURVIVAL",
    desc: "นาฬิกายอดมนุษย์ผู้รอดชีวิต ดำน้ำลึก 200 เมตร พร้อมเทคโนโลยีหลอดแก๊สเรืองแสงทริเทียมสว่างไร้ขีดจำกัดนาน 25 ปี",
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ BEAR GRYLLS SURVIVAL 3720 SEA SERIES รุ่น XB.3729.NGU หน้า.webp",
    bg: "linear-gradient(135deg, #1a221f 0%, #111513 100%)",
    accent: "#4ade80",
    keyword: "bear grylls"
  }
];

export default function Storefront() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'Luminox' | 'Seiko'
  const [notification, setNotification] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const search = searchParams.get('search') || '';

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

  // Recommended: Top 3 highest price items
  const recommendedProducts = [...products]
    .sort((a, b) => b.price - a.price)
    .slice(0, 3);

  // New Arrivals: Latest 4 items
  const newArrivalsProducts = [...products]
    .slice()
    .reverse()
    .slice(0, 4);

  // Promotions: Pick 3 products with stock to show with mock original crossed out prices
  const promotionProducts = products.filter((p) => p.stock > 0).slice(0, 3);

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
        {/* Slider Hero Section */}
        <section style={{
          position: 'relative',
          width: '100%',
          height: '380px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: HERO_SLIDES[currentSlide].bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2rem 6%',
          boxSizing: 'border-box',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          border: '1px solid var(--glass-border)',
          transition: 'all 0.5s ease-in-out',
          marginBottom: '3rem',
          marginTop: '1rem'
        }}>
          {/* Left Side: Slide Details */}
          <div style={{ flex: 1, maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left', zIndex: 10 }}>
            <span style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${HERO_SLIDES[currentSlide].accent}`,
              color: HERO_SLIDES[currentSlide].accent,
              padding: '0.2rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 600,
              width: 'fit-content',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              🔥 HOT ITEM OF THE WEEK
            </span>
            <h1 style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              color: 'var(--text-light)',
              lineHeight: 1.1,
              margin: 0,
              textShadow: '0 4px 10px rgba(0,0,0,0.5)'
            }}>
              {HERO_SLIDES[currentSlide].title}<br />
              <span style={{ color: HERO_SLIDES[currentSlide].accent }}>{HERO_SLIDES[currentSlide].subtitle}</span>
            </h1>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              lineHeight: 1.5,
              margin: '0.4rem 0 0.8rem 0'
            }}>
              {HERO_SLIDES[currentSlide].desc}
            </p>
            <button 
              className="btn btn-primary" 
              style={{
                width: 'fit-content',
                padding: '0.55rem 1.4rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                background: HERO_SLIDES[currentSlide].accent,
                borderColor: HERO_SLIDES[currentSlide].accent,
                color: HERO_SLIDES[currentSlide].accent === 'var(--accent-gold)' ? '#0f172a' : '#fff'
              }}
              onClick={() => {
                const keyword = HERO_SLIDES[currentSlide].keyword;
                const matched = products.find((p) => p.name.toLowerCase().includes(keyword));
                if (matched) navigate(`/product/${matched.id}`);
              }}
            >
              ดูข้อมูลสินค้าข้อมือ ⌚
            </button>
          </div>

          {/* Right Side: Slide Image */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'relative',
            zIndex: 5
          }}>
            <img 
              src={HERO_SLIDES[currentSlide].image} 
              alt={HERO_SLIDES[currentSlide].title} 
              style={{
                maxHeight: '300px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.8))',
                transition: 'all 0.5s ease-in-out'
              }}
            />
          </div>

          {/* Slider Arrow Controls */}
          <button 
            onClick={prevSlide}
            style={{
              position: 'absolute',
              top: '50%',
              left: '1rem',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-light)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              fontSize: '0.8rem',
              transition: 'all 0.2s'
            }}
            className="hover-gold-bg"
          >
            ◀
          </button>
          <button 
            onClick={nextSlide}
            style={{
              position: 'absolute',
              top: '50%',
              right: '1rem',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-light)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              fontSize: '0.8rem',
              transition: 'all 0.2s'
            }}
            className="hover-gold-bg"
          >
            ▶
          </button>

          {/* Dot Indicators */}
          <div style={{
            position: 'absolute',
            bottom: '0.8rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.45rem',
            zIndex: 20
          }}>
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: idx === currentSlide ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentSlide ? HERO_SLIDES[currentSlide].accent : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </section>

        {/* Recommended Products Section */}
        {recommendedProducts.length > 0 && (
          <section id="recommended" className="products-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3rem', marginBottom: '2rem' }}>
            <div className="section-header">
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>⭐️ {t('recommended')}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>นาฬิกาหรูคัดสรรระดับพรีเมียมที่เป็นที่นิยมที่สุด</p>
              </div>
            </div>
            <div className="products-grid">
              {recommendedProducts.map((p) => (
                <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--accent-gold)', color: '#0f172a', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', zIndex: 10 }}>RECOMMENDED ⭐</span>
                  <div className="product-card-preview">
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>⌚</span>
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
        )}

        {/* New Arrivals Section */}
        {newArrivalsProducts.length > 0 && (
          <section id="new-arrivals" className="products-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3rem', marginBottom: '2rem' }}>
            <div className="section-header">
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>🆕 {t('newArrivals')}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>นาฬิกาดีไซน์ใหม่ล่าสุดที่อัปเดตลงระบบ</p>
              </div>
            </div>
            <div className="products-grid">
              {newArrivalsProducts.map((p) => (
                <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#3b82f6', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', zIndex: 10 }}>NEW ARRIVAL 🆕</span>
                  <div className="product-card-preview">
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>⌚</span>
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
        )}

        {/* Special Promotions Section */}
        {promotionProducts.length > 0 && (
          <section id="promotions" className="products-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3rem', marginBottom: '2rem' }}>
            <div className="section-header">
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>🏷️ {t('promotions')}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>โปรโมชั่นลดสูงสุดถึง 15% วันนี้เท่านั้น</p>
              </div>
            </div>
            <div className="products-grid">
              {promotionProducts.map((p) => (
                <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', zIndex: 10 }}>SALE -15% 🏷️</span>
                  <div className="product-card-preview">
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>⌚</span>
                    )}
                  </div>
                  <div className="product-card-details">
                    <span className="product-card-brand">{p.brand}</span>
                    <h3 className="product-card-title">{p.name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                          ฿ {Math.round(p.price * 1.15).toLocaleString()}
                        </span>
                        <span className="product-card-price" style={{ color: '#ef4444' }}>
                          ฿ {p.price.toLocaleString()}
                        </span>
                      </div>
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
        )}

        {/* Product Filters */}
        <section className="products-section">
          <div className="section-header">
            <h2 className="section-title">สินค้าทั้งหมด</h2>
            <div className="filter-controls">
              {[{ key: 'all', label: 'ทั้งหมด' }, { key: 'Luminox', label: 'LUMINOX' }, { key: 'Seiko', label: 'SEIKO' }, { key: 'TAG Heuer', label: 'TAG HEUER' }].map(({ key, label }) => (
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

        {(user?.role === 'admin' || user?.role === 'manager') && <SystemLogger />}
      </main>
    </div>
  );
}
