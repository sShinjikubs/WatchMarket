import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Storefront from './pages/Storefront';
import Profile from './pages/Profile';
import Seller from './pages/Seller';
import Admin from './pages/Admin';
import Manager from './pages/Manager';
import MarkdownViewer from './pages/Markdown';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import { api } from './api';

// ─── Theme Context ───────────────────────────────────────────────────────────
export const ThemeContext = createContext(null);

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('watchmart_theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    localStorage.setItem('watchmart_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Language Context ────────────────────────────────────────────────────────
export const LanguageContext = createContext(null);

export function useLanguage() {
  return useContext(LanguageContext);
}

const translations = {
  th: {
    home: "Home",
    admin: "Admin",
    docs: "Docs",
    manager: "Management",
    staff: "Staff",
    newArrivals: "New Arrivals",
    recommended: "Recommended",
    promotions: "Promotions",
    notifications: "Notifications",
    help: "Help",
    lang: "English",
    searchPlaceholder: "Search your luxury watch...",
    callCenter: "📞 Call Center: 02-123-4567",
    project: "✨ Premium CSI204 Project",
    myProfile: "👤 My Profile",
    signOut: "🚪 Sign Out",
    all: "All",
    cart: "Shopping Cart",
    wishlist: "Wishlist",
    checkout: "Proceed to Checkout 💳",
    role: "Role",
    welcome: "Welcome",
    cancel: "Cancel",
    productsTitle: "All Products",
    myOrders: "My Order History",
    noOrders: "No orders found.",
    stock: "Stock",
    outOfStock: "Out of Stock",
    addToCart: "Add to Cart 🛒",
    tempOutOfStock: "Temporarily Out of Stock",
    price: "Price",
    brand: "Brand",
    cartEmpty: "Shopping Cart is empty",
    selectedTotal: "Selected Total",
    wishlistEmpty: "Wishlist is empty",
  },
  en: {
    home: "Home",
    admin: "Admin",
    docs: "Docs",
    manager: "Management",
    staff: "Staff",
    newArrivals: "New Arrivals",
    recommended: "Recommended",
    promotions: "Promotions",
    notifications: "Notifications",
    help: "Help",
    lang: "English",
    searchPlaceholder: "Search your luxury watch...",
    callCenter: "📞 Call Center: 02-123-4567",
    project: "✨ Premium CSI204 Project",
    myProfile: "👤 My Profile",
    signOut: "🚪 Sign Out",
    all: "All",
    cart: "Shopping Cart",
    wishlist: "Wishlist",
    checkout: "Proceed to Checkout 💳",
    role: "Role",
    welcome: "Welcome",
    cancel: "Cancel",
    productsTitle: "All Products",
    myOrders: "My Order History",
    noOrders: "No orders found.",
    stock: "Stock",
    outOfStock: "Out of Stock",
    addToCart: "Add to Cart 🛒",
    tempOutOfStock: "Temporarily Out of Stock",
    price: "Price",
    brand: "Brand",
    cartEmpty: "Shopping Cart is empty",
    selectedTotal: "Selected Total",
    wishlistEmpty: "Wishlist is empty",
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('watchmart_lang') || 'en');

  const changeLang = (newLang) => {
    localStorage.setItem('watchmart_lang', newLang);
    setLang(newLang);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Auth Context ───────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('watchmart_logged_in_user'));
      if (stored && stored.username && stored.role) return stored;
      if (stored) localStorage.removeItem('watchmart_logged_in_user');
      return null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem('watchmart_logged_in_user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('watchmart_logged_in_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('watchmart_logged_in_user');
    localStorage.removeItem('watchmart_db_seller_registered');
    setUser(null);
  };

  // Fetch avatar on mount if missing from localStorage
  useEffect(() => {
    if (user && user.username) {
      api.getProfile(user.username).then(async (res) => {
        if (res.ok) {
          const profile = await res.json();
          if (profile.avatar !== undefined && profile.avatar !== user.avatar) {
            updateUser({ avatar: profile.avatar });
          }
        }
      }).catch(() => {});
    }
  }, [user?.username]); // Only run when username changes/mounts

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Route Guards ────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'manager') return <Navigate to="/manager" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function GuestOnly({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/" replace />;
}

function ManagerRouteWrapper() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Admin /> : <Manager />;
}

// ─── App Router ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
        <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            {/* Global Cart Drawer — rendered once across all pages */}
            <CartDrawer />
            {/* Global Wishlist Drawer */}
            <WishlistDrawer />

            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

              {/* Customer (anyone can browse, but checkout/cart action requires auth) */}
              <Route path="/" element={<Storefront />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
              <Route path="/my-orders" element={<RequireAuth><MyOrders /></RequireAuth>} />

              {/* Manager + Admin only */}
              <Route path="/manager" element={<RequireRole roles={['manager', 'admin']}><ManagerRouteWrapper /></RequireRole>} />

              {/* Admin only */}
              <Route path="/admin" element={<RequireRole roles={['admin']}><Admin /></RequireRole>} />
              {/* System Docs - Admin only */}
              <Route path="/docs" element={<RequireRole roles={['admin']}><MarkdownViewer /></RequireRole>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
        </WishlistProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
