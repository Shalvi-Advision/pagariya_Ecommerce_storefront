// Cart-Auth Integration Hook
// Handles cart synchronization when authentication state changes

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContextOptimized';
import { useCart } from '../context/CartContext';

export const useCartAuthSync = () => {
  const { isAuthenticated, user } = useAuth();
  const { mergeGuestCart, fetchCart, clearUserCart } = useCart();
  const hasInitializedRef = useRef(false);
  const previousAuthStateRef = useRef(isAuthenticated);

  // Handle cart sync on authentication state changes
  useEffect(() => {
    const handleAuthStateChange = async () => {
      const wasAuthenticated = previousAuthStateRef.current;
      const isNowAuthenticated = isAuthenticated;

      // User just logged in
      if (!wasAuthenticated && isNowAuthenticated) {
        console.log('🛒 Cart-Auth Sync: User logged in, merging guest cart');

        try {
          // Get guest cart from localStorage
          const guestCartData = localStorage.getItem('guest_cart');
          if (guestCartData) {
            const guestCart = JSON.parse(guestCartData);
            const guestItems = guestCart.items || [];

            if (guestItems.length > 0) {
              // Merge guest cart with backend cart
              await mergeGuestCart(guestItems);
              console.log('✅ Cart-Auth Sync: Guest cart merged successfully');
            }
          }

          // Fetch fresh cart from backend
          await fetchCart();
          console.log('✅ Cart-Auth Sync: Cart fetched from backend');

        } catch (error) {
          console.error('❌ Cart-Auth Sync: Error during login cart sync:', error);
        }
      }

      // User just logged out
      if (wasAuthenticated && !isNowAuthenticated) {
        console.log('🛒 Cart-Auth Sync: User logged out, clearing authenticated cart');

        try {
          // Clear authenticated cart data
          clearUserCart();
          console.log('✅ Cart-Auth Sync: Authenticated cart cleared');
        } catch (error) {
          console.error('❌ Cart-Auth Sync: Error during logout cart clear:', error);
        }
      }

      // Update previous auth state
      previousAuthStateRef.current = isNowAuthenticated;
    };

    // Only run if this is not the initial mount
    if (hasInitializedRef.current) {
      handleAuthStateChange();
    } else {
      hasInitializedRef.current = true;
      previousAuthStateRef.current = isAuthenticated;
    }
  }, [isAuthenticated, user, mergeGuestCart, fetchCart, clearUserCart]);

  // Return current sync status
  return {
    isAuthenticated,
    user,
    hasInitialized: hasInitializedRef.current
  };
};
