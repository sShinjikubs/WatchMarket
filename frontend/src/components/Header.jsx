import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useCart } from '../CartContext';
import { api } from '../api';

export default function Header({ showCart, cartCount: cartCountProp, onCartClick }) {
  const { user, logout } = useAuth();
  const { cartCount: ctxCartCount, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Use CartContext count by default; fall back to prop if explicitly provided
  const displayCartCount = ctxCartCount;
  const handleCartClick = onCartClick || openCart;

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

  const roleLabel =
    user?.role === 'admin' ? '👑 Admin' :
    user?.role === 'manager' ? '📊 Manager' : '👤 User';

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header id="main-header">
      <Link to="/" className="logo">Watch<span>Mart</span></Link>

      <nav>
        <ul id="main-nav-list">
          <li><Link to="/" className={isActive('/')}>Home</Link></li>

          {user?.role === 'admin' && (
            <li><Link to="/admin" className={isActive('/admin')}>👑 Admin</Link></li>
          )}
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <>
              <li><Link to="/manager" className={isActive('/manager')}>📊 Manager</Link></li>
              <li><Link to="/staff" className={isActive('/staff')}>🧑‍💼 Staff</Link></li>
            </>
          )}
          {user?.role === 'user' && (
            <li><Link to="/seller" className={isActive('/seller')}>🛍️ Seller</Link></li>
          )}
          <li><Link to="/docs">📖 Docs</Link></li>
        </ul>
      </nav>

      <div className="header-actions">
        {user?.role === 'user' && (
          <button className="cart-icon-btn" onClick={handleCartClick} aria-label="Shopping Cart">
            🛒
            <span className="cart-badge" id="cart-counter">{displayCartCount || 0}</span>
          </button>
        )}

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
    </header>
  );
}
