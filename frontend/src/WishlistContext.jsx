import React, { createContext, useContext, useState, useEffect } from 'react';

export const WishlistContext = createContext(null);

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('watchmart_wishlist')) || [];
    } catch {
      return [];
    }
  });

  const [wishlistOpen, setWishlistOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('watchmart_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (product) => {
    if (!product) return;
    setWishlist((prev) => {
      const exists = prev.some((i) => i.id === product.id);
      if (exists) {
        return prev.filter((i) => i.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some((i) => i.id === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem('watchmart_wishlist');
  };

  const openWishlist = () => setWishlistOpen(true);
  const closeWishlist = () => setWishlistOpen(false);
  const toggleWishlistDrawer = () => setWishlistOpen((prev) => !prev);

  return (
    <WishlistContext.Provider value={{
      wishlist, wishlistOpen,
      toggleWishlist, isInWishlist, clearWishlist,
      openWishlist, closeWishlist, toggleWishlistDrawer
    }}>
      {children}
    </WishlistContext.Provider>
  );
}
