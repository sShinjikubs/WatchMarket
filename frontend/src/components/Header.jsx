import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
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

  const { lang, changeLang, t } = useLanguage();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  const toggleLanguage = () => {
    changeLang(lang === 'th' ? 'en' : 'th');
  };

  const roleLabel =
    user?.role === 'admin' ? `👑 ${t('admin')}` :
    user?.role === 'manager' ? `📊 ${t('manager')}` : `👤 ${t('role')} ${t('home')}`;

  const roleDescription = 
    user?.role === 'admin' ? 'สิทธิ์การเข้าถึง: Admin (ผู้ดูแลระบบสูงสุด สามารถจัดการผู้ใช้งาน จัดการฐานข้อมูล และเข้าถึงหน้ารายงานสรุปโครงงานได้)' :
    user?.role === 'manager' ? 'สิทธิ์การเข้าถึง: Manager (ผู้จัดการ สามารถเพิ่ม ลบ แก้ไขนาฬิกาในระบบ รวมถึงดูรายงานยอดขายได้)' :
    'สิทธิ์การเข้าถึง: User (ลูกค้า/ผู้ซื้อทั่วไป สามารถเลือกซื้อนาฬิกา ใส่ตะกร้า และบันทึกคำสั่งซื้อได้)';

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header style={{ display: 'flex', flexDirection: 'column', padding: 0, borderBottom: '1px solid var(--glass-border)', background: 'rgba(11, 12, 16, 0.92)', backdropFilter: 'blur(20px)', zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%' }}>
      {/* 1. TOP MINI BAR (Shopee-style top bar) */}
      <div className="header-top-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 5%', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem', color: 'var(--text-muted)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '1.2rem' }}>
          <span>{lang === 'th' ? '📞 ศูนย์บริการลูกค้า: 02-123-4567' : '📞 Call Center: 02-123-4567'}</span>
          <span>{lang === 'th' ? '✨ โครงงาน CSI204 ระดับพรีเมียม' : '✨ Premium CSI204 Project'}</span>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', position: 'relative' }}>
          {/* Notifications Button */}
          <span 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', transition: 'color 0.2s' }}
            className="hover-gold-text"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔 {t('notifications')}
          </span>

          {/* Help Button */}
          <span 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', transition: 'color 0.2s' }}
            className="hover-gold-text"
            onClick={() => setShowHelp(true)}
          >
            ❓ {t('help')}
          </span>

          {/* Language Toggle Button */}
          <span 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}
            className="hover-gold-text"
            onClick={toggleLanguage}
          >
            🌐 {lang === 'th' ? 'English (EN)' : 'ไทย (TH)'}
          </span>

          {/* Role Info Badge */}
          <span 
            style={{ color: 'var(--accent-gold)', fontWeight: 'bold', cursor: 'pointer', border: '1px dashed var(--accent-gold)', padding: '1px 6px', borderRadius: '4px' }}
            onClick={() => setShowRoleInfo(true)}
          >
            {roleLabel}
          </span>

          {/* Notifications Floating Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '1.5rem',
              right: '12rem',
              background: '#151c2c',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              width: '280px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '0.8rem',
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem', color: 'var(--accent-gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🔔 {t('notifications')}</span>
                <span style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }} onClick={() => setShowNotifications(false)}>✕</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                🎉 {lang === 'th' ? 'ยินดีต้อนรับสู่ WatchMart! ระบบออนไลน์สมบูรณ์แบบ' : 'Welcome to WatchMart! Fully functional system.'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                📦 {lang === 'th' ? 'ฐานข้อมูล PostgreSQL (Neon) เชื่อมต่อใช้งานสำเร็จ' : 'PostgreSQL DB (Neon) connected successfully.'}
              </div>
            </div>
          )}
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
              placeholder={t('searchPlaceholder')}
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
          {/* Small Keywords Tag Row - SEIKO and LUMINOX only (Classic/Sport deleted) */}
          <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {['SEIKO', 'LUMINOX'].map((kw) => (
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
              <li><Link to="/" className={isActive('/')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/' ? 'var(--accent-gold)' : 'var(--text-light)' }}>{t('home')}</Link></li>
              {user?.role === 'admin' && (
                <>
                  <li><Link to="/admin" className={isActive('/admin')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/admin' ? 'var(--accent-gold)' : 'var(--text-light)' }}>👑 {t('admin')}</Link></li>
                  <li><Link to="/docs" className={isActive('/docs')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/docs' ? 'var(--accent-gold)' : 'var(--text-light)' }}>📖 {t('docs')}</Link></li>
                </>
              )}
              {(user?.role === 'manager' || user?.role === 'admin') && (
                <>
                  <li><Link to="/manager" className={isActive('/manager')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/manager' ? 'var(--accent-gold)' : 'var(--text-light)' }}>📊 {t('manager')}</Link></li>
                  <li><Link to="/staff" className={isActive('/staff')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/staff' ? 'var(--accent-gold)' : 'var(--text-light)' }}>🧑‍💼 {t('staff')}</Link></li>
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
                  {t('myProfile')}
                </Link>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item signout-btn" onClick={handleLogout}>
                  {t('signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HELP MODAL OVERLAY */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setShowHelp(false)}>
          <div style={{
            background: '#151c2c',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            width: '450px',
            maxWidth: '90vw',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            textAlign: 'left'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>❓ {lang === 'th' ? 'ความช่วยเหลือและคำถามที่พบบ่อย' : 'Help & FAQ'}</span>
              <span style={{ cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }} onClick={() => setShowHelp(false)}>✕</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-light)' }}>
              <div>
                <strong>🔍 {lang === 'th' ? 'ค้นหาสินค้าอย่างไร?' : 'How to search?'}</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>
                  {lang === 'th' ? 'คุณสามารถพิมพ์ชื่อนาฬิกาหรือแบรนด์ในแถบค้นหาเพื่อทำการกรอง หรือคลิกที่แบรนด์ฮิตด้านล่างของแถบค้นหาเพื่อกรองทันที' : 'Type watch names or brands in the search box to filter, or click hot keywords below it.'}
                </p>
              </div>
              <div>
                <strong>💳 {lang === 'th' ? 'การทดสอบจ่ายเงินชำระเงิน' : 'Testing Payment'}</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>
                  {lang === 'th' ? 'เมื่อเลือกสินค้าลงตะกร้าแล้ว สามารถเข้าสู่หน้าชำระเงิน โดยระบบจะทำการอัปเดตสต็อกสินค้าหักออกจากระบบทันทีหลังจากสั่งซื้อสำเร็จ' : 'Add items to cart and go to checkout. The system will automatically deduct product stock upon successful checkout simulation.'}
                </p>
              </div>
              <div>
                <strong>🔑 {lang === 'th' ? 'การเปลี่ยนบทบาทเพื่อทดสอบสิทธิ์' : 'Testing Roles'}</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>
                  {lang === 'th' ? 'ล็อกเอ้าท์ออกจากระบบ แล้วเลือก Sign In ด้วยบัญชีที่มีบทบาทแตกต่างกัน (Admin, Manager, User) เพื่อทดสอบขอบเขตการเข้าถึง' : 'Logout and sign in using accounts with different roles (Admin, Manager, User) to test system permission limits.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE INFO MODAL OVERLAY */}
      {showRoleInfo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setShowRoleInfo(false)}>
          <div style={{
            background: '#151c2c',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90vw',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)' }}>🔑 {lang === 'th' ? 'ข้อมูลสิทธิ์บัญชีผู้ใช้' : 'Account Role Privileges'}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
              {roleDescription}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '1.5rem', padding: '0.5rem 2rem' }}
              onClick={() => setShowRoleInfo(false)}
            >
              {lang === 'th' ? 'รับทราบ' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
