import React, { createContext, useContext, useState, useEffect } from 'react';

export const CartContext = createContext(null);

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('watchmart_cart')) || [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  // Sync cart to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('watchmart_cart', JSON.stringify(cart));
  }, [cart]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (product, quantity = 1) => {
    if (!product || product.stock <= 0) return false;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const alreadyQty = existing ? existing.quantity : 0;
      if (alreadyQty + quantity > product.stock) return prev;
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
    return true;
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const next = i.quantity + delta;
          if (next <= 0) return null;
          return { ...i, quantity: next };
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    sessionStorage.removeItem('watchmart_cart');
  };

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  return (
    <CartContext.Provider value={{
      cart, cartOpen, cartCount, cartTotal,
      addToCart, changeQty, removeFromCart, clearCart,
      openCart, closeCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}
