import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, changeQty, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      {cartOpen && (
        <div
          className="cart-overlay show"
          onClick={closeCart}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}

      {/* Drawer */}
      <div
        className={`cart-drawer ${cartOpen ? 'open' : ''}`}
        id="cart-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '380px',
          maxWidth: '95vw',
          background: 'var(--glass-bg, #1a1a2e)',
          borderLeft: '1px solid var(--glass-border, rgba(197,168,128,0.2))',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div className="cart-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🛒 ตะกร้าสินค้า <span style={{ color: 'var(--accent-gold)', fontWeight: 400, fontSize: '0.9rem' }}>({cartCount} รายการ)</span></h3>
          <button className="close-btn" onClick={closeCart} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Items */}
        <div className="cart-items-container" id="cart-items-container" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
              <p>ตะกร้าสินค้าว่างเปล่า</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.id} className="cart-item" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '52px', height: '52px', background: 'rgba(197,168,128,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>⌚</div>
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
                >{item.quantity <= 1 ? '🗑' : '−'}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="cart-footer" style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="cart-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>ยอดรวมทั้งสิ้น</span>
            <span id="cart-total-price" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-gold)' }}>฿ {cartTotal.toLocaleString()}</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', opacity: cart.length === 0 ? 0.5 : 1 }}
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            ดำเนินการชำระเงิน 💳
          </button>
        </div>
      </div>
    </>
  );
}
