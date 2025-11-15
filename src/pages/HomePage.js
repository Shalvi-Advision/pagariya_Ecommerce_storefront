import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getProductsOptimized, searchProductsAPI } from '../api/productsApi';
import { useCart } from '../context/CartContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Carousel from '../components/Carousel';
import GSTBanner from '../components/GSTBanner';
import CategoryBanner from '../components/CategoryBanner';
import DealsSection from '../components/DealsSection';
import PopularCategories from '../components/PopularCategories';
import FestiveBanner from '../components/FestiveBanner';
import FestiveSpecials from '../components/FestiveSpecials';
import OfferBanner from '../components/OfferBanner';
import SeasonalOfferBanner from '../components/SeasonalOfferBanner';
import BestsellerProducts from '../components/BestsellerProducts';
import AdvertisementCarousel from '../components/AdvertisementCarousel';
import FamousCategories from '../components/FamousCategories';
import ProductCard from '../components/ProductCard';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { COLORS } from '../constants/theme';

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';
  
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOffline, setIsOffline] = useState(false);
  const [isDataFromCache, setIsDataFromCache] = useState(false);
  const [isFallbackData, setIsFallbackData] = useState(false);
  const { addItem } = useCart();
  const { openDrawer } = useCartDrawer();

  // Helper function to get store code
  const getStoreCode = () => {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        return location?.store?.store_code || 'AVB';
      } catch (error) {
        console.warn('Failed to parse location data:', error);
      }
    }
    return 'AVB'; // Default store code
  };

  // Memoize loadProducts function to prevent recreating it on every render
  const loadProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in search mode
      if (searchQuery && searchQuery.trim().length >= 2) {
        // Use search API
        const storeCode = getStoreCode();
        const searchResponse = await searchProductsAPI(searchQuery);
        
        if (searchResponse.success && searchResponse.data) {
          setAllProducts(searchResponse.data);
          setPagination({
            page: 1,
            limit: searchResponse.data.length,
            total_products: searchResponse.count || searchResponse.data.length,
            total_pages: 1,
            has_next: false,
            has_prev: false
          });
          setIsDataFromCache(false);
          setIsFallbackData(false);
        } else {
          setAllProducts([]);
          setPagination(null);
        }
      } else {
        // Use regular product listing API
        const response = await getProductsOptimized({
          page,
          limit: 100, // Increased limit to get more products for search
          dept_id: "2",
          category_id: "72",
          sub_category_id: "391"
        });

        setAllProducts(response.products || []); // Store all products for filtering
        setPagination(response.pagination || null);

        // Check if data is from cache (offline mode) or fallback
        if (response.isOffline) {
          setIsDataFromCache(true);
        } else {
          setIsDataFromCache(false);
        }
        
        // Check if data is from fallback
        if (response.isFallback) {
          setIsFallbackData(true);
        } else {
          setIsFallbackData(false);
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
      
      // Only show error if we don't have any fallback data
      setError(err.message || 'Failed to load products');

      // If offline and no cached data, show offline message
      if (!navigator.onLine) {
        setError('You are currently offline. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);
  
  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    // If we used API search, products are already filtered
    if (searchQuery && searchQuery.trim().length >= 2) {
      return allProducts; // Already filtered by API
    }
    
    // Otherwise, apply client-side filtering for category filter
    if (!categoryFilter) {
      return allProducts;
    }

    // Apply category filtering
    return allProducts.filter(product => {
      const productCategory = product.category || product.category_name || '';
      return productCategory.toLowerCase().includes(categoryFilter.toLowerCase());
    });
  }, [allProducts, searchQuery, categoryFilter]);

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * 20;
    const endIndex = startIndex + 20;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  // Calculate pagination info for filtered products
  const filteredPagination = useMemo(() => {
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / 20);
    
    return {
      page: currentPage,
      limit: 20,
      total_products: totalProducts,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1
    };
  }, [filteredProducts, currentPage]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);
  
  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Reload data when coming back online after a small delay to ensure connectivity
      if (isDataFromCache) {
        setTimeout(() => loadProducts(currentPage), 1000);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isDataFromCache, currentPage]);

  // loadProducts is now defined using useCallback above

  const handleAddToCart = (product, quantity = 1) => {
    addItem(product, quantity);
    // Open cart drawer when item is added
    openDrawer();
  };

  const handleNextPage = () => {
    if (filteredPagination?.has_next) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (filteredPagination?.has_prev) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= (filteredPagination?.total_pages || 1)) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading && allProducts.length === 0) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom right, ${COLORS.primary[50]}, ${COLORS.success[50]}, ${COLORS.primary[100]})`
        }}
      >
        <div className="text-center">
          <Loading size="large" text="Loading products..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom right, ${COLORS.error[50]}, ${COLORS.error[100]}, ${COLORS.error[50]})`
        }}
      >
        <div 
          className="text-center backdrop-blur-lg rounded-3xl p-8 shadow-2xl border"
          style={{
            backgroundColor: hexToRgba(COLORS.white, 0.8),
            borderColor: hexToRgba(COLORS.gray[200], 0.2)
          }}
        >
          <p 
            className="mb-4 text-lg font-semibold"
            style={{ color: COLORS.error[600] }}
          >
            Error: {error}
          </p>
          <Button onClick={() => loadProducts(currentPage)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom right, ${COLORS.secondary[50]}, ${COLORS.gray[50]}, ${COLORS.secondary[100]})`
      }}
    >
      {/* Hero Carousel with Modern Frame */}
      <div 
        className="w-full py-3 sm:py-4 lg:py-6"
        style={{
          background: `linear-gradient(to right, ${hexToRgba(COLORS.primary[600], 0.05)}, ${hexToRgba(COLORS.primary[500], 0.05)}, ${hexToRgba(COLORS.success[500], 0.05)})`
        }}
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div 
            className="relative overflow-hidden rounded-3xl shadow-2xl"
            style={{
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px ${hexToRgba(COLORS.gray[900], 0.05)}`
            }}
          >
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(to top right, ${hexToRgba(COLORS.primary[500], 0.1)}, ${hexToRgba(COLORS.primary[400], 0.1)}, ${hexToRgba(COLORS.success[400], 0.1)})`
              }}
            ></div>
            <Carousel />
          </div>
        </div>
      </div>

      {/* GSTBanner in a styled container */}
      {/* <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-cyan-50/50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <GSTBanner />
          </div>
        </div>
      </div> */}

      {/* Category Banner with Modern Design */}
      {/*<div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.warning[50], 0.5)}, ${hexToRgba(COLORS.warning[100], 0.5)}, ${hexToRgba(COLORS.warning[50], 0.5)})`
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full blur-3xl -translate-y-1/2"
          style={{
            background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.warning[400], 0.2)}, ${hexToRgba(COLORS.warning[500], 0.2)})`
          }}
        ></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div 
            className="backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border hover:shadow-2xl transition-all duration-300 overflow-hidden"
            style={{
              backgroundColor: hexToRgba(COLORS.white, 0.8),
              borderColor: hexToRgba(COLORS.white, 0.6)
            }}
          >
            <CategoryBanner />
          </div>
        </div>
      </div>*/}

      {/* DealsSection */}
      {/* <DealsSection /> */}

      {/* Popular Categories */}
      <PopularCategories />

      {/* Bestseller Products */}
      <BestsellerProducts />

      {/* Famous Categories */}
      <FamousCategories />

      {/* FestiveBanner */}
      {/* <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-rose-50/50 to-red-50/50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4"></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <FestiveBanner />
          </div>
        </div>
      </div> */}

      {/* FestiveSpecials */}
      {/* <FestiveSpecials /> */}

      {/* Offer Banner with Modern Gradient */}
      {/*<div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.secondary[50], 0.5)}, ${hexToRgba(COLORS.secondary[100], 0.5)}, ${hexToRgba(COLORS.secondary[50], 0.5)})`
          }}
        ></div>
        <div 
          className="absolute top-1/2 right-1/4 w-96 h-96 rounded-full blur-3xl -translate-y-1/2"
          style={{
            background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.secondary[400], 0.2)}, ${hexToRgba(COLORS.secondary[500], 0.2)})`
          }}
        ></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div 
            className="backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border hover:shadow-2xl transition-all duration-300 overflow-hidden"
            style={{
              backgroundColor: hexToRgba(COLORS.white, 0.8),
              borderColor: hexToRgba(COLORS.white, 0.6)
            }}
          >
            <OfferBanner />
          </div>
        </div>
      </div>*/}

      {/* Seasonal Offer Banner with Elegant Design */}
      <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.primary[50], 0.5)}, ${hexToRgba(COLORS.success[50], 0.5)}, ${hexToRgba(COLORS.primary[100], 0.5)})`
          }}
        ></div>
        <div 
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"
          style={{
            background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.primary[400], 0.2)}, ${hexToRgba(COLORS.success[400], 0.2)})`
          }}
        ></div>
        <div 
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"
          style={{
            background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.success[400], 0.2)}, ${hexToRgba(COLORS.primary[500], 0.2)})`
          }}
        ></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div 
            className="backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border hover:shadow-2xl transition-all duration-300 overflow-hidden"
            style={{
              backgroundColor: hexToRgba(COLORS.white, 0.8),
              borderColor: hexToRgba(COLORS.white, 0.6)
            }}
          >
            <SeasonalOfferBanner />
          </div>
        </div>
      </div>

      {/* Advertisement Carousel */}
      <AdvertisementCarousel />

      </div>
  );
}; 

export default HomePage;
