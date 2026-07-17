import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth, useLanguage, useTheme } from '../App';
import { useCart } from '../CartContext';
import { useWishlist } from '../WishlistContext';
import { api } from '../api';

const Icons = {
  Settings: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  User: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Globe: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Bell: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Help: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Phone: (props) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Sparkle: (props) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Crown: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Chart: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Book: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Edit: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Cart: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  Search: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
};

export default function Header({ showCart, cartCount: cartCountProp, onCartClick }) {
  const { user, logout } = useAuth();
  const { cartCount: ctxCartCount, toggleCart } = useCart();
  const { wishlist, toggleWishlistDrawer } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [orders, setOrders] = useState([]);

  // Use CartContext count by default; fall back to prop if explicitly provided
  const displayCartCount = ctxCartCount;
  const handleCartClick = onCartClick || toggleCart;

  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = () => {
      api.getOrders().then(async (res) => {
        if (res.ok) setOrders(await res.json());
      }).catch(() => {});
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const getNotifications = () => {
    const list = [];
    if (!user) return list;

    if (user.role === 'admin') {
      orders.forEach(ord => {
        if (ord.status === 'manager_approved') {
            list.push({
              id: `admin-confirm-${ord.id}`,
              text: t('adminConfirmNotif').replace('{id}', ord.id),
              time: ord.date,
              link: '/manager'
            });
        }
      });
    } else if (user.role === 'manager') {
      orders.forEach(ord => {
        if (ord.status === 'pending_review') {
            list.push({
              id: `manager-review-${ord.id}`,
              text: t('managerReviewNotif').replace('{id}', ord.id),
              time: ord.date,
              link: '/manager'
            });
        }
      });
    } else {
      // Regular user/buyer
      const myOrders = orders.filter(o => o.userId === user.username);
      myOrders.forEach(ord => {
        if (ord.status === 'manager_approved') {
            list.push({
              id: `user-m-approve-${ord.id}`,
              text: t('userManagerApproveNotif').replace('{id}', ord.id),
              time: ord.date,
              link: '/my-orders'
            });
        } else if (ord.status === 'confirmed') {
            list.push({
              id: `user-confirm-${ord.id}`,
              text: t('userConfirmNotif').replace('{id}', ord.id),
              time: ord.date,
              link: '/my-orders'
            });
        } else if (ord.status === 'shipped') {
            list.push({
              id: `user-shipped-${ord.id}`,
              text: t('userShippedNotif').replace('{id}', ord.id),
              time: ord.date,
              link: '/my-orders'
            });
        } else if (ord.status === 'cancelled' && ord.slip) {
            list.push({
              id: `user-cancelled-${ord.id}`,
              text: t('userCancelNotif').replace('{id}', ord.id),
              time: ord.date,
              link: '/my-orders'
            });
        }
      });
    }
    
    return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  const notificationsList = getNotifications();

  const handleLogout = async () => {
    try {
      await api.addLog(t('logoutLog').replace('{username}', user?.username));
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

  const handleScrollTo = (id) => (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/#${id}`);
    }
  };

  const { lang, changeLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const toggleLanguage = () => {
    changeLang(lang === 'th' ? 'en' : 'th');
  };

  const roleLabel =
    user?.role === 'admin' ? t('admin') :
    user?.role === 'manager' ? t('manager') : `${t('role')}${t('home')}`;

  const roleDescription = 
    user?.role === 'admin' ? t('roleAdminDesc') :
    user?.role === 'manager' ? t('roleManagerDesc') :
    t('roleUserDesc');

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header style={{ display: 'flex', flexDirection: 'column', padding: 0, borderBottom: '1px solid var(--glass-border)', background: 'var(--header-bg)', backdropFilter: 'blur(20px)', zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%' }}>
      {/* Sliding Settings Drawer Backdrop Overlay */}
      {showDrawer && (
        <div 
          onClick={() => setShowDrawer(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Sliding Settings Drawer Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: showDrawer ? 0 : '-320px',
        width: '300px',
        height: '100vh',
        background: 'var(--drawer-bg)',
        backdropFilter: 'blur(25px)',
        borderRight: '1px solid var(--glass-border)',
        boxShadow: '10px 0 30px rgba(0, 0, 0, 0.6)',
        zIndex: 10000,
        transition: 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.8rem',
        boxSizing: 'border-box'
      }}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/images/logo.jpg" alt="WatchMart Logo" style={{ height: '32px', borderRadius: '4px', border: '1px solid var(--glass-border)' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-gold)', letterSpacing: '0.5px' }}>WatchMart</span>
          </div>
          <button 
            onClick={() => setShowDrawer(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem' }}
            className="hover-gold-text"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body - Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', flex: 1, overflowY: 'auto' }}>
          
          {/* Role Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Settings style={{ color: 'var(--accent-gold)' }} />
              <span>{t('switchRole')}</span>
            </label>
            <button 
              onClick={() => { setShowRoleInfo(true); setShowDrawer(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--accent-gold)',
                borderRadius: '8px',
                padding: '0.65rem 0.8rem',
                color: 'var(--accent-gold)',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s'
              }}
              className="hover-gold-bg-light"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user?.role === 'admin' ? <Icons.Crown style={{ color: 'var(--accent-gold)' }} /> :
                 user?.role === 'manager' ? <Icons.Chart style={{ color: 'var(--accent-gold)' }} /> :
                 <Icons.User style={{ color: 'var(--accent-gold)' }} />}
                {roleLabel}
              </span>
              <Icons.Edit style={{ color: 'var(--accent-gold)', width: '12px', height: '12px' }} />
            </button>
          </div>

          {/* Language Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Globe style={{ color: 'var(--accent-gold)' }} />
              <span>{t('language')}</span>
            </label>
            <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '8px', padding: '2px', border: '1px solid var(--glass-border)' }}>
              <button 
                onClick={() => { if (lang !== 'th') toggleLanguage(); }}
                style={{
                  flex: 1,
                  background: lang === 'th' ? 'var(--accent-gold)' : 'none',
                  color: lang === 'th' ? '#0b0c10' : 'var(--text-light)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('langTh')}
              </button>
              <button 
                onClick={() => { if (lang !== 'en') toggleLanguage(); }}
                style={{
                  flex: 1,
                  background: lang === 'en' ? 'var(--accent-gold)' : 'none',
                  color: lang === 'en' ? '#0b0c10' : 'var(--text-light)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('langEn')}
              </button>
            </div>
          </div>

          {/* Theme Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: 'var(--accent-gold)' }}>◑</span>
              <span>{t('themeTitle')}</span>
            </label>
            <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '8px', padding: '2px', border: '1px solid var(--glass-border)' }}>
              <button 
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                style={{
                  flex: 1,
                  background: theme === 'dark' ? 'var(--accent-gold)' : 'none',
                  color: theme === 'dark' ? '#0b0c10' : 'var(--text-light)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('themeDark')}
              </button>
              <button 
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                style={{
                  flex: 1,
                  background: theme === 'light' ? 'var(--accent-gold)' : 'none',
                  color: theme === 'light' ? '#0b0c10' : 'var(--text-light)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('themeLight')}
              </button>
            </div>
          </div>

          {/* Help & Notifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.2rem' }}>
            <button 
              onClick={() => { setShowNotifications(!showNotifications); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                padding: '0.4rem 0',
                transition: 'color 0.2s'
              }}
              className="hover-gold-text"
            >
              <Icons.Bell style={{ color: 'var(--accent-gold)' }} />
              <span>{t('notifications')}</span>
            </button>
            {showNotifications && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.45rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Icons.Sparkle style={{ color: 'var(--accent-gold)', width: '10px', height: '10px' }} />
                  <span>{t('welcomeSys')}</span>
                </div>
                <div>📦 {t('dbConnectedSys')}</div>
              </div>
            )}

            <button 
              onClick={() => { setShowHelp(true); setShowDrawer(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                padding: '0.4rem 0',
                transition: 'color 0.2s'
              }}
              className="hover-gold-text"
            >
              <Icons.Help style={{ color: 'var(--accent-gold)' }} />
              <span>{t('help')}</span>
            </button>
          </div>

          {/* Contact & Project Info */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Phone style={{ color: 'var(--accent-gold)' }} />
              <span>{t('callCenter')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Sparkle style={{ color: 'var(--accent-gold)' }} />
              <span>{t('project')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <div className="header-main-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 5%', gap: '2rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Hamburger & Logo Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
          <button 
            onClick={() => setShowDrawer(true)} 
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-light)',
              fontSize: '1.6rem',
              cursor: 'pointer',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
              lineHeight: 1
            }}
            className="hover-gold-text"
            aria-label="Toggle settings drawer"
          >
            ☰
          </button>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/images/logo.jpg" alt="WatchMart Logo" style={{ height: '46px', borderRadius: '8px', border: '1px solid var(--glass-border)', objectFit: 'contain' }} />
          </Link>
        </div>

        {/* Center: Search Bar & Keywords */}
        <div style={{ flex: 1, maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative' }}>
            <input
              name="search"
              type="text"
              placeholder={t('searchPlaceholder')}
              value={location.pathname === '/' ? (searchParams.get('search') || '') : undefined}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                background: 'var(--input-bg)',
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
              <Icons.Search style={{ width: '15px', height: '15px' }} />
            </button>
          </form>
          {/* Small Keywords Tag Row - SEIKO and LUMINOX only (Classic/Sport deleted) */}
          <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {['SEIKO', 'LUMINOX', 'TAG HEUER'].map((kw) => (
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
              <li><a href="#recommended" onClick={handleScrollTo('recommended')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: 'var(--text-light)', transition: 'color 0.2s' }} className="hover-gold-text">{t('recommended')}</a></li>
              <li><a href="#new-arrivals" onClick={handleScrollTo('new-arrivals')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: 'var(--text-light)', transition: 'color 0.2s' }} className="hover-gold-text">{t('newArrivals')}</a></li>
              <li><a href="#promotions" onClick={handleScrollTo('promotions')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: 'var(--text-light)', transition: 'color 0.2s' }} className="hover-gold-text">{t('promotions')}</a></li>
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link to="/admin" className={isActive('/admin')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/admin' ? 'var(--accent-gold)' : 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Icons.Crown style={{ width: '13px', height: '13px' }} />
                      <span>{t('admin')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/docs" className={isActive('/docs')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/docs' ? 'var(--accent-gold)' : 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Icons.Book style={{ width: '13px', height: '13px' }} />
                      <span>{t('docs')}</span>
                    </Link>
                  </li>
                </>
              )}
              {user?.role === 'manager' && (
                <li>
                  <Link to="/manager" className={isActive('/manager')} style={{ fontSize: '0.88rem', textDecoration: 'none', color: location.pathname === '/manager' ? 'var(--accent-gold)' : 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Icons.Chart style={{ width: '13px', height: '13px' }} />
                    <span>{t('manager')}</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Wishlist Icon */}
          {(user?.role === 'user' || !user) && (
            <button className="cart-icon-btn" onClick={() => {
              if (!user) {
                navigate('/register');
              } else {
                toggleWishlistDrawer();
              }
            }} aria-label={t('wishlist')} style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', color: '#ff6b6b' }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="cart-badge" style={{ backgroundColor: '#ff6b6b' }}>{wishlist.length}</span>
            </button>
          )}

          {/* Cart Icon */}
          {(user?.role === 'user' || !user) && (
            <button className="cart-icon-btn" onClick={() => {
              if (!user) {
                navigate('/register');
              } else {
                handleCartClick();
              }
            }} aria-label="Shopping Cart" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Icons.Cart style={{ width: '16px', height: '16px' }} />
              <span className="cart-badge" id="cart-counter">{displayCartCount || 0}</span>
            </button>
          )}

          {/* Guest Login/Register Button */}
          {!user && (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', marginLeft: '0.5rem' }}>
              {t('loginRegister')}
            </Link>
          )}

          {/* Notifications Icon & Dropdown */}
          {user && (
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={notifRef}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: notifOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                  transition: 'background 0.2s',
                  marginRight: '0.5rem'
                }}
              >
                <Icons.Bell style={{ width: '18px', height: '18px', color: notificationsList.length > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }} />
                {notificationsList.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {notificationsList.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  width: '320px',
                  background: 'rgba(21, 28, 44, 0.98)',
                  backdropFilter: 'blur(25px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  padding: '1rem',
                  zIndex: 1010,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>🔔 {t('notifications')}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>{t('newItemsCount').replace('{count}', notificationsList.length)}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {notificationsList.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {t('noNewNotifications')}
                      </div>
                    ) : notificationsList.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => { setNotifOpen(false); navigate(item.link); }}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.03)',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          color: '#f5f5f7',
                          lineHeight: 1.4,
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                      >
                        <div>{item.text}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: 'right' }}>
                          {(() => {
                            try {
                              const d = new Date(item.time);
                              return isNaN(d.getTime()) ? item.time : d.toLocaleString('th-TH');
                            } catch (_) {
                              return item.time;
                            }
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Dropdown */}
          {user && (
            <div className="user-profile-dropdown-container" id="user-profile-header" ref={dropdownRef}>
              <button
                className="profile-avatar-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="User Profile"
              >
                <div className="profile-avatar" style={user?.avatar ? { backgroundImage: `url(${user.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}>
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
                <Link
                  to="/my-orders"
                  className="profile-dropdown-item"
                  style={{ textDecoration: 'none', display: 'block', textAlign: 'left' }}
                  onClick={() => setDropdownOpen(false)}
                >
                  📦 {t('myOrders')}
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
            background: 'var(--modal-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            width: '450px',
            maxWidth: '90vw',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            textAlign: 'left'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>❓ {t('helpFaq')}</span>
              <span style={{ cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }} onClick={() => setShowHelp(false)}>✕</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-light)' }}>
              <div>
                <strong>🔍 {t('howToSearch')}</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>
                  {t('searchHelp')}
                </p>
              </div>
              <div>
                <strong>💳 {t('testingPayment')}</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>
                  {t('paymentHelp')}
                </p>
              </div>
              <div>
                <strong>🔑 {t('testingRoles')}</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>
                  {t('rolesHelp')}
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
            background: 'var(--modal-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90vw',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-gold)' }}>🔑 {t('accountRolePrivileges')}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
              {roleDescription}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '1.5rem', padding: '0.5rem 2rem' }}
              onClick={() => setShowRoleInfo(false)}
            >
              {t('okButton')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
