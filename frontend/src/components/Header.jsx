import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { useCart } from '../CartContext';
import { api } from '../api';

export default function Header({ showCart, cartCount: cartCountProp, onCartClick }) {
  const { user, logout } = useAuth();
  const { cartCount: ctxCartCount, toggleCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Use CartContext count by default; fall back to prop if explicitly provided
  const displayCartCount = ctxCartCount;
  const handleCartClick = onCartClick || toggleCart;

  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    try {
      await api.addLog(`[AUTH]: ผู้ใช้ ${user?.username} ออกจากระบบ`);
    } catch (_) {}
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = e.target.search.value;
    if (location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (location.pathname === '/') {
      setSearchParams((prev) => {
        if (val) prev.set('search', val);
        else prev.delete('search');
        return prev;
      });
    }
  };

  const roleLabel =
    user?.role === 'admin' ? '👑 Admin' :
    user?.role === 'manager' ? '📊 Manager' : '👤 User';

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header style={{ display: 'flex', flexDirection: 'column', padding: 0, borderBottom: '1px solid var(--glass-border)', background: 'rgba(11, 12, 16, 0.92)', backdropFilter: 'blur(20px)', zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%' }}>
      {/* 1. TOP MINI BAR (Shopee-style top bar) */}
      <div className="header-top-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 5%', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem', color: 'var(--text-muted)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '1.2rem' }}>
          <span>📞 Call Center: 02-123-4567</span>
          <span>✨ Premium CSI204 Project</span>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <span>🔔 การแจ้งเตือน</span>
          <span>❓ ช่วยเหลือ</span>
          <span>🌐 ไทย</span>
          <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{roleLabel}</span>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <div className="header-main-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 5%', gap: '2rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Logo */}
        <Link to="/" className="logo" style={{ textDecoration: 'none', flexShrink: 0, fontSize: '1.6rem' }}>Watch<span>Mart</span></Link>

        {/* Center: Search Bar & Keywords */}
        <div style={{ flex: 1, maxWidth: '550px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative' }}>
            <input
              name="search"
              type="text"
              placeholder="ค้นหานาฬิกาหรูสไตล์คุณ..."
              value={location.pathname === '/' ? (searchParams.get('search') || '') : undefined}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-border)',
                borderRight: 'none',
                color: 'var(--text-light)',
                padding: '0.65rem 1rem',
                borderTopLeftRadius: '8px',
                borderBottomLeftRadius: '8px',
                outline: 'none',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
            />
            <button
              type="submit"
              style={{
                background: 'var(--accent-gold)',
                color: '#0f172a',
                border: 'none',
                padding: '0 1.5rem',
                borderTopRightRadius: '8px',
                borderBottomRightRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              🔍
            </button>
          </form>
          {/* Small Keywords Tag Row */}
          <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {['SEIKO', 'LUMINOX', 'Classic', 'Sport'].map((kw) => (
              <span
                key={kw}
                onClick={() => {
                  if (location.pathname === '/') {
                    setSearchParams({ search: kw });
                  } else {
                    navigate(`/?search=${kw}`);
                  }
                }}
                style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                className="hover-gold-text"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Right side navigation & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexShrink: 0 }}>
          {/* Navigation Links */}
          <nav>
            <ul style={{ display: 'flex', listStyle: 'none', gap: '1.2rem', margin: 0, padding: 0 }}>
              <li><Link to="/" className={isActive('/')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/' ? 'var(--accent-gold)' : 'var(--text-light)' }}>Home</Link></li>
              {user?.role === 'admin' && (
                <>
                  <li><Link to="/admin" className={isActive('/admin')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/admin' ? 'var(--accent-gold)' : 'var(--text-light)' }}>👑 Admin</Link></li>
                  <li><Link to="/docs" className={isActive('/docs')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/docs' ? 'var(--accent-gold)' : 'var(--text-light)' }}>📖 Docs</Link></li>
                </>
              )}
              {(user?.role === 'manager' || user?.role === 'admin') && (
                <>
                  <li><Link to="/manager" className={isActive('/manager')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/manager' ? 'var(--accent-gold)' : 'var(--text-light)' }}>📊 Manager</Link></li>
                  <li><Link to="/staff" className={isActive('/staff')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/staff' ? 'var(--accent-gold)' : 'var(--text-light)' }}>🧑‍💼 Staff</Link></li>
                </>
              )}
            </ul>
          </nav>

          {/* Cart Icon */}
          {user?.role === 'user' && (
            <button className="cart-icon-btn" onClick={handleCartClick} aria-label="Shopping Cart" style={{ margin: 0 }}>
              🛒
              <span className="cart-badge" id="cart-counter">{displayCartCount || 0}</span>
            </button>
          )}

          {/* Profile Dropdown */}
          {user && (
            <div className="user-profile-dropdown-container" id="user-profile-header" ref={dropdownRef}>
              <button
                className="profile-avatar-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="User Profile"
              >
                <div className="profile-avatar">
                  {(user?.username ?? user?.name ?? '?').charAt(0).toUpperCase()}
                </div>
              </button>

              <div className={`profile-dropdown${dropdownOpen ? ' open' : ''}`} id="profile-dropdown-menu">
                <div className="profile-dropdown-header">
                  <div className="profile-username">{user?.username ?? user?.name ?? 'User'}</div>
                  <span className="badge">{roleLabel}</span>
                </div>
                <div className="profile-dropdown-divider" />
                <Link
                  to="/profile"
                  className="profile-dropdown-item"
                  style={{ textDecoration: 'none', display: 'block', textAlign: 'left' }}
                  onClick={() => setDropdownOpen(false)}
                >
                  👤 My Profile
                </Link>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item signout-btn" onClick={handleLogout}>
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
