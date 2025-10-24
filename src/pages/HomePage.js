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
import ProductCard from '../components/ProductCard';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <Loading size="large" text="Loading products..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-red-50">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <p className="text-red-600 mb-4 text-lg font-semibold">Error: {error}</p>
          <Button onClick={() => loadProducts(currentPage)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Hero Carousel with Modern Frame */}
      <div className="w-full bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-fuchsia-600/5 py-3 sm:py-4 lg:py-6">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-gray-900/5">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 pointer-events-none"></div>
            <Carousel />
          </div>
        </div>
      </div>

      {/* GST Banner with Enhanced Styling */}
      <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-cyan-50/50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <GSTBanner />
          </div>
        </div>
      </div>

      {/* Category Banner with Modern Design */}
      <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-orange-50/50 to-rose-50/50"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CategoryBanner />
          </div>
        </div>
      </div>

      {/* Deals Section */}
      <DealsSection />

      {/* Popular Categories */}
      <PopularCategories />

      {/* Festive Banner with Vibrant Gradient */}
      <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-rose-50/50 to-red-50/50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4"></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <FestiveBanner />
          </div>
        </div>
      </div>

      {/* Festive Specials */}
      <FestiveSpecials />

      {/* Offer Banner with Modern Gradient */}
      <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-blue-50/50 to-sky-50/50"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <OfferBanner />
          </div>
        </div>
      </div>

      {/* Seasonal Offer Banner with Elegant Design */}
      <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-fuchsia-50/50 to-pink-50/50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-fuchsia-400/20 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <SeasonalOfferBanner />
          </div>
        </div>
      </div>

      {/* Products Section with Modern Gradient Design */}
      <div className="relative overflow-hidden py-8 sm:py-12 lg:py-16" id="products">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/60">
            {/* Section Header with Modern Design */}
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <SparklesIcon className="w-4 h-4 animate-pulse" />
                <span>Fresh & Premium Quality</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Fresh Products
                </span>
              </h2>
              <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto px-4 leading-relaxed">
                Discover our wide range of fresh groceries, household items, and daily essentials
              </p>

              {/* Enhanced Status Indicators with Modern Design */}
              {(isOffline || isDataFromCache || isFallbackData) && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 px-2">
                  {isOffline && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg min-h-[36px]">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse flex-shrink-0"></div>
                      <span className="whitespace-nowrap">Offline Mode</span>
                    </div>
                  )}
                  {isDataFromCache && !isFallbackData && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg min-h-[36px]">
                      <div className="w-2.5 h-2.5 bg-white rounded-full flex-shrink-0"></div>
                      <span className="whitespace-nowrap">Cached Data</span>
                    </div>
                  )}
                  {isFallbackData && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg min-h-[36px]">
                      <div className="w-2.5 h-2.5 bg-white rounded-full flex-shrink-0"></div>
                      <span className="whitespace-nowrap">Demo Data</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Search Results Info */}
            {searchQuery && (
              <div className="mb-6 text-center">
                <p className="text-sm sm:text-base text-gray-600">
                  {filteredProducts.length > 0 ? (
                    <>
                      Found <span className="font-bold text-emerald-600">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                    </>
                  ) : (
                    <>
                      No results found for "<span className="font-bold">{searchQuery}</span>"
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Search Results Header */}
            {searchQuery && searchQuery.trim().length >= 2 && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Search results for: "{searchQuery}"
                    </h2>
                    <p className="text-sm text-gray-600">
                      Found {filteredProducts.length} products
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 justify-items-center">
              {paginatedProducts.map(product => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {paginatedProducts.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <span className="text-5xl">📦</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No products found</h3>
                <p className="text-gray-500 text-base">
                  {searchQuery ? `Try searching with different keywords` : 'Check back later for fresh products!'}
                </p>
              </div>
            )}

            {/* Modern Pagination Controls */}
            {filteredPagination && filteredPagination.total_pages > 1 && (
              <div className="mt-10 pt-8 border-t border-gray-200">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="text-sm sm:text-base text-gray-600 text-center lg:text-left font-medium">
                    Showing <span className="text-emerald-600 font-bold">{((currentPage - 1) * 20) + 1}</span> to <span className="text-emerald-600 font-bold">{Math.min(currentPage * 20, filteredPagination.total_products)}</span> of <span className="text-emerald-600 font-bold">{filteredPagination.total_products}</span> products
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Previous Button with Gradient */}
                    <button
                      onClick={handlePrevPage}
                      disabled={!filteredPagination.has_prev}
                      className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 min-h-[48px] rounded-xl font-semibold transition-all duration-300 touch-manipulation ${
                        !filteredPagination.has_prev
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                      }`}
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                      <span className="hidden xs:inline">Previous</span>
                      <span className="xs:hidden">Prev</span>
                    </button>

                    {/* Page Numbers with Modern Design */}
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {Array.from({ length: Math.min(5, filteredPagination.total_pages) }, (_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i;
                        if (pageNum > filteredPagination.total_pages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-3 min-h-[48px] min-w-[48px] text-sm font-bold rounded-xl transition-all duration-300 touch-manipulation flex-shrink-0 ${
                              pageNum === currentPage
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-110'
                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-400 hover:scale-105 active:scale-95'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button with Gradient */}
                    <button
                      onClick={handleNextPage}
                      disabled={!filteredPagination.has_next}
                      className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 min-h-[48px] rounded-xl font-semibold transition-all duration-300 touch-manipulation ${
                        !filteredPagination.has_next
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                      }`}
                    >
                      <span className="hidden xs:inline">Next</span>
                      <span className="xs:hidden">Next</span>
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
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
