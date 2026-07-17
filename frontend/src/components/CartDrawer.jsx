import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { Icons } from './Icons';

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, changeQty, cartCount } = useCart();
  const navigate = useNavigate();
  
  const [selectedIds, setSelectedIds] = useState([]);

  // Sync selectedIds with cart: remove IDs that are no longer in cart, and auto-add new IDs that are not in selectedIds yet
  useEffect(() => {
    const cartIds = cart.map((i) => i.id);
    setSelectedIds((prev) => {
      const validPrev = prev.filter((id) => cartIds.includes(id));
      const newIds = cartIds.filter((id) => !prev.includes(id));
      return [...validPrev, ...newIds];
    });
  }, [cart]);

  const selectedTotal = cart
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedCount = cart.filter((item) => selectedIds.includes(item.id)).length;

  const handleCheckout = () => {
    const selectedItems = cart.filter((i) => selectedIds.includes(i.id));
    if (selectedItems.length === 0) return;
    closeCart();
    navigate('/checkout', { state: { checkoutItems: selectedItems } });
  };

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div 
          onClick={closeCart}
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
          transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div className="cart-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icons.Cart style={{ color: 'var(--accent-gold)' }} />
            <span>ตะกร้าสินค้า <span style={{ color: 'var(--accent-gold)', fontWeight: 400, fontSize: '0.9rem' }}>({selectedCount}/{cartCount} เลือก)</span></span>
          </h3>
          <button className="close-btn" onClick={closeCart} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Items */}
        <div className="cart-items-container" id="cart-items-container" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <Icons.Cart style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.15)' }} />
              </div>
              <p>ตะกร้าสินค้าว่างเปล่า</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.id} className="cart-item" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => {
                  setSelectedIds((prev) =>
                    prev.includes(item.id)
                      ? prev.filter((id) => id !== item.id)
                      : [...prev, item.id]
                  );
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--accent-gold)',
                  cursor: 'pointer',
                  marginRight: '0.2rem'
                }}
              />
              
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '52px', height: '52px', background: 'rgba(197,168,128,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.Watch style={{ width: '22px', height: '22px', color: 'var(--accent-gold)' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.2rem' }}>฿ {(item.price * item.quantity).toLocaleString()}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>฿ {item.price.toLocaleString()} × {item.quantity}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <button
                  style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', lineHeight: 1 }}
                  onClick={() => changeQty(item.id, 1)}
                >+</button>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                <button
                  style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: item.quantity <= 1 ? '#ff6b6b' : 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', lineHeight: 1 }}
                  onClick={() => changeQty(item.id, -1)}
                >
                  {item.quantity <= 1 ? <Icons.Trash style={{ width: '12px', height: '12px' }} /> : '−'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="cart-footer" style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="cart-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>ยอดรวมที่เลือก</span>
            <span id="cart-total-price" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-gold)' }}>฿ {selectedTotal.toLocaleString()}</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', opacity: (cart.length === 0 || selectedIds.length === 0) ? 0.5 : 1 }}
            disabled={cart.length === 0 || selectedIds.length === 0}
            onClick={handleCheckout}
          >
            ดำเนินการชำระเงิน 💳
          </button>
        </div>
      </div>
    </>
  );
}
