import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Storefront from './pages/Storefront';
import Profile from './pages/Profile';
import Seller from './pages/Seller';
import Admin from './pages/Admin';
import Manager from './pages/Manager';
import Staff from './pages/Staff';
import MarkdownViewer from './pages/Markdown';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import { CartProvider } from './CartContext';
import CartDrawer from './components/CartDrawer';

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

  const logout = () => {
    localStorage.removeItem('watchmart_logged_in_user');
    localStorage.removeItem('watchmart_db_seller_registered');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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

// ─── App Router ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Global Cart Drawer — rendered once across all pages */}
          <CartDrawer />

          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

            {/* Customer (any logged-in user) */}
            <Route path="/" element={<RequireAuth><Storefront /></RequireAuth>} />
            <Route path="/product/:id" element={<RequireAuth><ProductDetail /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/seller" element={<RequireAuth><Seller /></RequireAuth>} />
            <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />

            {/* Manager + Admin only */}
            <Route path="/manager" element={<RequireRole roles={['manager', 'admin']}><Manager /></RequireRole>} />
            <Route path="/staff" element={<RequireRole roles={['manager', 'admin']}><Staff /></RequireRole>} />

            {/* Admin only */}
            <Route path="/admin" element={<RequireRole roles={['admin']}><Admin /></RequireRole>} />

            {/* System Docs */}
            <Route path="/docs" element={<MarkdownViewer />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
