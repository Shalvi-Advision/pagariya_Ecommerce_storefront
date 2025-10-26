import React, { createContext, useContext, useState, useEffect } from 'react';
import { addToFavorites as addToFavoritesAPI, removeFromFavorites as removeFromFavoritesAPI, getFavorites as getFavoritesAPI } from '../api/favoritesApi';

const FavoriteContext = createContext();

export const useFavorite = () => {
  return useContext(FavoriteContext);
};

export const FavoriteProvider = ({ children }) => {
  // Get auth status without using useAuth hook to avoid circular dependency
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('auth_token');
      setIsAuthenticated(!!token);
    };
    
    checkAuthStatus();
    
    // Listen for auth changes via custom events or polling
    const interval = setInterval(checkAuthStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize from localStorage if available (for guests)
  useEffect(() => {
    if (!isAuthenticated) {
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    }
  }, [isAuthenticated]);

  // Save to localStorage whenever favorites change (for guest users)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites, isAuthenticated]);

  // Load favorites from API for authenticated users
  useEffect(() => {
    const loadFavorites = async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          const response = await getFavoritesAPI();
          if (response.success && response.data) {
            // Store only p_code values for authenticated users
            // We'll fetch full product details when displaying on FavoritesPage
            const favoriteIds = response.data.map(item => item.p_code);
            setFavorites(favoriteIds);
          }
        } catch (error) {
          console.error('Error loading favorites:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadFavorites();
  }, [isAuthenticated]);

  const addToFavorites = async (product) => {
    try {
      // Use p_code as identifier
      const p_code = product.p_code || product._id;
      
      if (!p_code) {
        console.error('No p_code provided for favorite');
        return;
      }

      if (isAuthenticated) {
        // Call API for authenticated users only if token exists
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.warn('No auth token found, using localStorage instead');
          // Fall back to localStorage
          setFavorites((prev) => {
            if (!prev.some(item => (typeof item === 'object' ? item.p_code : item) === p_code)) {
              const updated = [...prev, product];
              localStorage.setItem('favorites', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
          return;
        }
        
        const response = await addToFavoritesAPI(p_code);
        if (response.success) {
          // Add to local state with full product data
          setFavorites((prev) => {
            if (!prev.some(item => (typeof item === 'object' ? item.p_code : item) === p_code)) {
              const updated = [...prev, product];
              return updated;
            }
            return prev;
          });
        }
      } else {
        // Use localStorage for guest users
        setFavorites((prev) => {
          if (!prev.some(item => (typeof item === 'object' ? item.p_code : item) === p_code)) {
            // Store full product data for guest users
            const updated = [...prev, product];
            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      // Fall back to localStorage on API error
      const p_code = product.p_code || product._id;
      setFavorites((prev) => {
        if (!prev.some(item => (typeof item === 'object' ? item.p_code : item) === p_code)) {
          const updated = [...prev, product];
          localStorage.setItem('favorites', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  };

  const removeFromFavorites = async (p_code) => {
    try {
      if (isAuthenticated) {
        // Call API for authenticated users only if token exists
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.warn('No auth token found, using localStorage instead');
          // Fall back to localStorage
          setFavorites((prev) => {
            const updated = prev.filter(item => {
              if (typeof item === 'object') {
                return item.p_code !== p_code;
              }
              return item !== p_code;
            });
            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
          });
          return;
        }
        
        const response = await removeFromFavoritesAPI(p_code);
        if (response.success) {
          // Remove from local state (handle both object and string formats)
          setFavorites((prev) => prev.filter(item => {
            if (typeof item === 'object') {
              return item.p_code !== p_code;
            }
            return item !== p_code;
          }));
        }
      } else {
        // Use localStorage for guest users
        setFavorites((prev) => {
          const updated = prev.filter(item => {
            if (typeof item === 'object') {
              return item.p_code !== p_code;
            }
            return item !== p_code;
          });
          localStorage.setItem('favorites', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      // Fall back to localStorage on API error
      setFavorites((prev) => {
        const updated = prev.filter(item => {
          if (typeof item === 'object') {
            return item.p_code !== p_code;
          }
          return item !== p_code;
        });
        localStorage.setItem('favorites', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const isFavorite = (p_code) => {
    if (!p_code) return false;
    
    // Handle both object and string formats
    return favorites.some(item => {
      if (typeof item === 'object') {
        return item.p_code === p_code;
      }
      return item === p_code;
    });
  };

  const toggleFavorite = async (product) => {
    const p_code = product.p_code || product._id;
    
    try {
      if (isFavorite(p_code)) {
        await removeFromFavorites(p_code);
      } else {
        await addToFavorites(product);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const value = {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    isAuthenticated,
  };

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
};

