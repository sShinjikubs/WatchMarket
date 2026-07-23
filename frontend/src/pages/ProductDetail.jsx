import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
import { useCart } from '../CartContext';
import { api } from '../api';
import Header from '../components/Header';
import { Icons } from '../components/Icons';

// ─── Watch SVG Preview (larger) ──────────────────────────────────────────────
function WatchPreview({ color, strokeColor, size = 260 }) {
  const c = color || '#1a1a2e';
  const s = strokeColor || '#c5a880';
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.6))' }}>
      {/* Case outer */}
      <circle cx="100" cy="100" r="75" fill="none" stroke={s} strokeWidth="4" />
      {/* Case */}
      <circle cx="100" cy="100" r="70" fill={c} />
      {/* Inner bezel */}
      <circle cx="100" cy="100" r="64" fill="none" stroke={s} strokeWidth="1" strokeOpacity="0.4" />
      {/* Hour markers */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
        const r = 56;
        const rad = (deg - 90) * Math.PI / 180;
        const x1 = 100 + r * Math.cos(rad);
        const y1 = 100 + r * Math.sin(rad);
        const len = i % 3 === 0 ? 8 : 4;
        const rad2 = rad;
        const x2 = 100 + (r - len) * Math.cos(rad2);
        const y2 = 100 + (r - len) * Math.sin(rad2);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s} strokeWidth={i % 3 === 0 ? 2 : 1} strokeOpacity="0.8" />;
      })}
      {/* Crown */}
      <rect x="172" y="94" width="10" height="12" rx="3" fill="#2a2a3a" stroke={s} strokeWidth="1" />
      {/* Hour hand */}
      <line x1="100" y1="100" x2="100" y2="66" stroke={s} strokeWidth="3" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1="100" y1="100" x2="100" y2="46" stroke={s} strokeWidth="2" strokeLinecap="round" />
      {/* Second hand */}
      <line x1="100" y1="110" x2="100" y2="50" stroke="#ff4757" strokeWidth="1" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="100" cy="100" r="3.5" fill={s} />
      <circle cx="100" cy="100" r="1.5" fill="#000" />
    </svg>
  );
}

// Helper to render star rating
function StarRating({ rating, size = '1rem' }) {
  const rounded = Math.round(rating);
  return (
    <span style={{ fontSize: size, letterSpacing: '1px', color: 'var(--accent-gold)' }}>
      {Array.from({ length: 5 }, (_, i) => (i < rounded ? '★' : '☆')).join('')}
    </span>
  );
}

// ─── Product Detail Page ──────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { addToCart, openCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [notification, setNotification] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshReviews = () => {
    api.getReviews(id).then(async (res) => {
      if (res.ok) {
        setReviews(await res.json());
      }
    });
  };

  useEffect(() => {
    api.getProducts().then(async (res) => {
      if (res.ok) {
        const all = await res.json();
        const found = all.find((p) => p.id === id);
        if (found) {
          setProduct(found);
          setSelectedImage(found.image || '');
        }
        else navigate('/');
      }
    });
    refreshReviews();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (!product || product.stock <= 0) return;
    const ok = addToCart(product, quantity);
    if (ok) {
      setAddedToCart(true);
      showNotif(t('addedToCartToast').replace('{name}', product.name).replace('{qty}', quantity));
      setTimeout(() => setAddedToCart(false), 2000);
    } else {
      showNotif(t('outOfStockToast'), false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showNotif(t('loginToReviewToast'), false);
      return;
    }
    if (!newComment.trim()) {
      showNotif(t('enterReviewToast'), false);
      return;
    }

    try {
      const res = await api.addReview({
        productId: id,
        username: user.username,
        rating: newRating,
        comment: newComment.trim(),
      });
      if (res.ok) {
        showNotif(t('reviewSubmitSuccess'));
        setNewComment('');
        setNewRating(5);
        refreshReviews();
      } else {
        showNotif(t('reviewSubmitFail'), false);
      }
    } catch (_) {
      showNotif(t('serverErrorGeneric'), false);
    }
  };

  const categoryLabel = (cat) =>
    cat === 'classic' ? t('bandingClassic') :
    cat === 'sport'   ? t('bandingSport') :
                        t('bandingElegant');

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 5;

  if (!product) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('loadingProduct')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {notification && (
        <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>
      )}
      <Header />

      <main className="main-content">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <button onClick={() => navigate('/')} className="pd-breadcrumb-link">{t('homeBreadcrumb')}</button>
          <span className="pd-breadcrumb-sep">›</span>
          <span style={{ color: 'var(--accent-gold)' }}>{product.brand}</span>
          <span className="pd-breadcrumb-sep">›</span>
          <span>{lang === 'en' && product.nameEn ? product.nameEn : product.name}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="pd-layout">
          {/* LEFT — Watch Preview Gallery */}
          <div className="pd-gallery">
            <div className="pd-main-image" style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {product.image ? (
                <img 
                  src={selectedImage || product.image} 
                  alt={lang === 'en' && product.nameEn ? product.nameEn : product.name} 
                  style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: '8px' }} 
                />
              ) : (
                <WatchPreview color={product.color} strokeColor={product.strokeColor} size={320} />
              )}
            </div>
             {product.image && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', width: '100%' }}>
                {/* Explicit buttons for users to toggle front/back images */}
                <div style={{ display: 'flex', gap: '0.8rem', width: '100%' }}>
                  <button 
                    className="btn"
                    onClick={() => setSelectedImage(product.image)}
                    style={{
                      flex: 1,
                      padding: '0.6rem 1rem',
                      fontSize: '0.85rem',
                      background: selectedImage === product.image || !selectedImage ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                      color: selectedImage === product.image || !selectedImage ? '#0f172a' : 'var(--text-light)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s',
                    }}
                    >
                      {t('viewFrontImage')}
                    </button>
                  {product.imageBack && (
                    <button 
                      className="btn"
                      onClick={() => setSelectedImage(product.imageBack)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 1rem',
                        fontSize: '0.85rem',
                        background: selectedImage === product.imageBack ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                        color: selectedImage === product.imageBack ? '#0f172a' : 'var(--text-light)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                      }}
                      >
                        {t('viewBackImage')}
                      </button>
                  )}
                </div>

                {/* Thumbnails row */}
                <div className="pd-thumbnail-row" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                  <div 
                    className="pd-thumbnail" 
                    onClick={() => setSelectedImage(product.image)}
                    style={{ 
                      border: (!selectedImage || selectedImage === product.image) ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                      cursor: 'pointer', opacity: (!selectedImage || selectedImage === product.image) ? 1 : 0.6 
                    }}
                  >
                    <img src={product.image} alt="front" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                  </div>
                  {product.imageBack && (
                    <div 
                      className="pd-thumbnail" 
                      onClick={() => setSelectedImage(product.imageBack)}
                      style={{ 
                        border: selectedImage === product.imageBack ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                        cursor: 'pointer', opacity: selectedImage === product.imageBack ? 1 : 0.6 
                      }}
                    >
                      <img src={product.imageBack} alt="back" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Product Info */}
          <div className="pd-info">
            {/* Brand + Category */}
            <div className="pd-brand-row">
              <span className="pd-brand-badge">{product.brand}</span>
              <span className="pd-category-badge">{categoryLabel(product.category)}</span>
            </div>

            {/* Name */}
            <h1 className="pd-title">{lang === 'en' && product.nameEn ? product.nameEn : product.name}</h1>

            {/* Rating Section */}
            <div className="pd-rating-row">
              <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {avgRating.toFixed(1)}
              </span>
              <StarRating rating={avgRating} size="1.2rem" />
              <span className="pd-rating-count" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {t('reviewsCount').replace('{count}', reviews.length)}
              </span>
              <span className="pd-divider">|</span>
              <span style={{ color: '#51cf66', fontSize: '0.85rem' }}>
                {product.stock > 0 ? t('inStockCount').replace('{count}', product.stock) : t('outOfStockText')}
              </span>
            </div>

            {/* Price */}
            <div className="pd-price-box">
              <div className="pd-price">฿ {product.price.toLocaleString()}</div>
              <div className="pd-price-note">{t('priceVatFreeShipping')}</div>
            </div>

            {/* Guarantee */}
            <div className="pd-guarantee-row">
              <div className="pd-guarantee-item">{t('guaranteeAuthentic')}</div>
              <div className="pd-guarantee-item">{t('guaranteeReturn')}</div>
              <div className="pd-guarantee-item">{t('guaranteeShipping')}</div>
            </div>

            <div className="pd-divider-line" />

            {/* Quantity Selector */}
            <div className="pd-qty-row">
              <span className="pd-qty-label">{t('quantityLabel')}</span>
              <div className="pd-qty-control">
                <button
                  className="pd-qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >−</button>
                <span className="pd-qty-value">{quantity}</span>
                <button
                  className="pd-qty-btn"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock || product.stock === 0}
                >+</button>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {t('stockAvailable').replace('{count}', product.stock)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pd-actions">
              <button
                className={`btn pd-btn-cart ${addedToCart ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {addedToCart ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.Check style={{ color: '#0f172a' }} />
                    <span>{t('addedBtn')}</span>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.Cart />
                    <span>{t('addToCartBtn')}</span>
                  </span>
                )}
              </button>
              <button
                className="btn btn-primary pd-btn-buy"
                onClick={() => {
                  if (!user) {
                    navigate('/register');
                    return;
                  }
                  navigate('/checkout', { state: { buyNowItem: { ...product, quantity } } });
                }}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? t('outOfStockText') : t('buyNowBtn')}
              </button>
            </div>

            {/* Voucher / Shop info */}
            <div className="pd-shop-info">
              <div className="pd-shop-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Icons.Info style={{ color: 'var(--accent-gold)' }} />
                <span><strong>WatchMart Official Store</strong> — Premium Watch Marketplace</span>
              </div>
              <div className="pd-shop-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Icons.Package style={{ color: 'var(--accent-gold)' }} />
                <span>Product ID: <code style={{ color: 'var(--accent-gold)', fontFamily: 'monospace' }}>{product.id}</code></span>
              </div>
              <div className="pd-shop-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Icons.Settings style={{ color: 'var(--accent-gold)' }} />
                <span>{t('categoryLabelText')} <strong>{product.category?.toUpperCase()}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — Description */}
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h2 className="card-title">{t('productDetailTitle')}</h2>
          <div className="pd-description">
            <p dangerouslySetInnerHTML={{ __html: t('productDescText')
                .replace('{brand}', `<strong>${product.brand}</strong>`)
                .replace('{name}', `<strong>${lang === 'en' && product.nameEn ? product.nameEn : product.name}</strong>`)
                .replace('{level}', product.category === 'elegant' ? t('levelHigh') : product.category === 'sport' ? t('levelMedium') : t('levelEntry'))
                .replace('{cat}', `<strong>${categoryLabel(product.category)}</strong>`)
            }}></p>
            <div className="pd-specs-grid">
              <div className="pd-spec"><span className="pd-spec-key">{t('brandLabel')}</span><span>{product.brand}</span></div>
              <div className="pd-spec"><span className="pd-spec-key">{t('modelLabel')}</span><span>{lang === 'en' && product.nameEn ? product.nameEn : product.name}</span></div>
              <div className="pd-spec"><span className="pd-spec-key">{t('categoryLabelSpec')}</span><span>{product.category?.toUpperCase()}</span></div>
              <div className="pd-spec"><span className="pd-spec-key">{t('priceCol')}</span><span>฿ {product.price.toLocaleString()}</span></div>
              <div className="pd-spec"><span className="pd-spec-key">{t('stockLabel')}</span><span>{t('stockCount').replace('{count}', product.stock)}</span></div>
              <div className="pd-spec"><span className="pd-spec-key">Product ID</span><span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{product.id}</span></div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h2 className="card-title">{t('reviewsTitle').replace('{count}', reviews.length)}</h2>
          
          <div className="content-grid two-col" style={{ gap: '2rem', alignItems: 'start' }}>
            
            {/* Submit Review Form */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-light)' }}>
                {t('writeReviewTitle')}
              </h3>
              {user ? (
                <form onSubmit={handleSubmitReview} className="form-stack">
                  <div className="form-group">
                    <label className="form-label">{t('rateProductLabel')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNewRating(val)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.8rem',
                            color: val <= newRating ? 'var(--accent-gold)' : 'var(--text-muted)',
                            transition: 'color 0.2s',
                            padding: 0
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{t('commentLabel')}</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      placeholder={t('commentPlaceholder')}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }}>
                    {t('submitReviewBtn')}
                  </button>
                </form>
              ) : (
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--glass-border)', color: 'var(--text-muted)' }}>
                  {t('please')} <button onClick={() => navigate('/login')} className="pd-breadcrumb-link" style={{ textDecoration: 'underline', color: 'var(--accent-gold)' }}>{t('loginLink')}</button> {t('toWriteReview')}
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icons.Star style={{ color: 'var(--accent-gold)' }} />
                <span>{t('allCustomerReviews')}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {reviews.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                    {t('noReviewsYet')}
                  </p>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-light)' }}>
                          👤 {r.username}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          📅 {r.date}
                        </span>
                      </div>
                      <div>
                        <StarRating rating={r.rating} size="0.9rem" />
                      </div>
                      <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: '0.2rem 0 0', whiteSpace: 'pre-wrap' }}>
                        {r.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
