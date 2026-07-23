import React from 'react';
import { useWishlist } from '../WishlistContext';
import { useCart } from '../CartContext';
import { useLanguage } from '../App';
import { Icons } from './Icons';

export default function WishlistDrawer() {
  const { wishlist, wishlistOpen, closeWishlist, toggleWishlist } = useWishlist();
  const { addToCart, openCart } = useCart();
  const { t, lang } = useLanguage();

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;
    const ok = addToCart(product, 1);
    if (ok) {
      closeWishlist();
      openCart();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {wishlistOpen && (
        <div 
          onClick={closeWishlist}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 9998,
          }}
        />
      )}

      {/* Drawer Panel */}
      <div 
        className="cart-drawer-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '360px',
          maxWidth: '90vw',
          height: '100vh',
          background: 'var(--drawer-bg)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--glass-border)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          transform: wishlistOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div className="cart-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ff6b6b' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{t('wishlist')} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>{t('itemsCount').replace('{count}', wishlist.length)}</span></span>
          </h3>
          <button className="close-btn" onClick={closeWishlist} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Items */}
        <div className="cart-items-container" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {wishlist.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <p>{t('noWishlistItems')}</p>
            </div>
          ) : wishlist.map((item) => (
            <div key={item.id} className="cart-item" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              {item.image ? (
                <img src={item.image} alt={lang === 'en' && item.nameEn ? item.nameEn : item.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '52px', height: '52px', background: 'rgba(197,168,128,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.Watch style={{ width: '22px', height: '22px', color: 'var(--accent-gold)' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'en' && item.nameEn ? item.nameEn : item.name}</div>
                <div style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.2rem' }}>฿ {item.price.toLocaleString()}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.brand}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    opacity: item.stock === 0 ? 0.5 : 1
                  }}
                  disabled={item.stock === 0}
                  onClick={() => handleAddToCart(item)}
                >
                  {item.stock === 0 ? t('outOfStockShort') : t('addToCartShort')}
                </button>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff6b6b',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                  onClick={() => toggleWishlist(item)}
                >
                  <Icons.Trash style={{ width: '12px', height: '12px' }} />
                  <span>{t('remove')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
