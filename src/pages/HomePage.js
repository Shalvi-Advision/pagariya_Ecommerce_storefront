import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/productsApi';
import { useCart } from '../context/CartContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Carousel from '../components/Carousel';
import PopularCategories from '../components/PopularCategories';
import SeasonalCategories from '../components/SeasonalCategories';
import ProductCard from '../components/ProductCard';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOffline, setIsOffline] = useState(false);
  const [isDataFromCache, setIsDataFromCache] = useState(false);
  const { addItem } = useCart();
  const { openDrawer } = useCartDrawer();

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Reload data when coming back online
      if (isDataFromCache) {
        loadProducts(currentPage);
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

  const loadProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getProducts({
        page,
        limit: 20,
        sort_by: 'createdAt',
        sort_order: 'desc'
      });

      setProducts(response.products || []);
      setPagination(response.pagination || null);

      // Check if data is from cache (offline mode)
      if (response.isOffline) {
        setIsDataFromCache(true);
      } else {
        setIsDataFromCache(false);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');

      // If offline and no cached data, show offline message
      if (!navigator.onLine) {
        setError('You are currently offline. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addItem(product);
    // Open cart drawer when item is added
    openDrawer();
  };

  const handleNextPage = () => {
    if (pagination?.has_next) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.has_prev) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= (pagination?.total_pages || 1)) {
      setCurrentPage(page);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading size="large" text="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={loadProducts}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Carousel */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100">
            <Carousel />
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <PopularCategories />

      {/* Seasonal Categories */}
      <SeasonalCategories />

      {/* Products Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12 lg:py-16" id="products">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100">
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Fresh Products</h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
                Discover our wide range of fresh groceries, household items, and daily essentials
              </p>

              {/* Offline/Cache Status Indicators */}
              {(isOffline || isDataFromCache) && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 px-2">
                  {isOffline && (
                    <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-full text-xs sm:text-sm font-medium min-h-[32px]">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
                      <span className="whitespace-nowrap">Offline Mode</span>
                    </div>
                  )}
                  {isDataFromCache && (
                    <div className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-full text-xs sm:text-sm font-medium min-h-[32px]">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                      <span className="whitespace-nowrap">Cached Data</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {products.map(product => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {products.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-gray-400">📦</span>
                </div>
                <p className="text-gray-500 text-lg mb-4">No products found.</p>
                <p className="text-gray-400 text-sm">Check back later for fresh products!</p>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-8 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-gray-600 text-center lg:text-left">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.total_products)} of {pagination.total_products} products
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  {/* Previous Button */}
                  <Button
                    onClick={handlePrevPage}
                    disabled={!pagination.has_prev}
                    className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] touch-manipulation ${
                      !pagination.has_prev
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    <span className="hidden xs:inline">Previous</span>
                    <span className="xs:hidden">Prev</span>
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > pagination.total_pages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 min-h-[44px] min-w-[44px] text-sm rounded-md transition-colors touch-manipulation flex-shrink-0 ${
                            pageNum === currentPage
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <Button
                    onClick={handleNextPage}
                    disabled={!pagination.has_next}
                    className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] touch-manipulation ${
                      !pagination.has_next
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <span className="hidden xs:inline">Next</span>
                    <span className="xs:hidden">Next</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
