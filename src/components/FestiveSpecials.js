import React, { useState, useEffect } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { getProducts } from '../api/productsApi';
import { useCart } from '../context/CartContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import ProductCard from './ProductCard';
import Loading from './Loading';

const FestiveSpecials = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();
  const { openDrawer } = useCartDrawer();

  useEffect(() => {
    loadRandomProducts();
  }, []);

  const loadRandomProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch more products to get a good selection for random picking
      const response = await getProducts({
        page: 1,
        limit: 50, // Fetch more to have better random selection
        dept_id: "2",
        category_id: "72",
        sub_category_id: "391"
      });

      if (response.products && response.products.length > 0) {
        // Shuffle and pick 9 random products
        const shuffled = [...response.products].sort(() => 0.5 - Math.random());
        const randomProducts = shuffled.slice(0, 9);
        setProducts(randomProducts);
        console.log('✅ Random products loaded for festive specials:', randomProducts.length);
      } else {
        setError('No products available');
      }
    } catch (err) {
      console.error('Error loading random products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product, quantity = 1) => {
    addItem(product, quantity);
    openDrawer();
  };

  const handleViewAll = () => {
    // Navigate to products page or scroll to products section
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-2 sm:py-3 lg:py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-2 sm:p-3 lg:p-4 shadow-lg border border-pink-200">
            <div className="flex items-center justify-center h-32">
              <Loading size="large" text="Loading festive specials..." />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-2 sm:py-3 lg:py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-2 sm:p-3 lg:p-4 shadow-lg border border-pink-200">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button 
                onClick={loadRandomProducts}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
      {/* Promotional Banner at the top */}
      <div className="relative w-full mb-4 sm:mb-6 lg:mb-8">
        <div className="relative w-full h-[180px] sm:h-[220px] lg:h-[260px] xl:h-[300px] overflow-hidden rounded-lg">
          <img
            src={`${process.env.PUBLIC_URL}/images/2Promotional_Banners.jpg`}
            alt="Divine Essentials - Promotional Banner"
            className="w-full h-full object-cover object-center"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              display: 'block'
            }}
            onLoad={() => {
              console.log('🖼️ Promotional Banner image loaded successfully');
            }}
            onError={() => {
              console.log('❌ Promotional Banner image failed to load');
            }}
          />
        </div>
      </div>

      {/* Vibrant Festive Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-amber-50/50 to-yellow-50/50"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-primary-400/20 to-amber-400/20 rounded-full blur-3xl -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 rounded-full blur-3xl translate-y-1/4"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary-50/80 to-amber-50/80 backdrop-blur-sm rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-primary-200/60 hover:shadow-2xl transition-all duration-300">
          {/* Enhanced Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-wider">Limited Time</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                <span className="bg-gradient-to-r from-primary-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Festive Specials
                </span>
              </h2>
            </div>
            <button
              onClick={handleViewAll}
              className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-amber-500 text-white px-4 py-2.5 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 group"
            >
              <span>View All</span>
              <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>

          {/* Horizontal Scrollable Products */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 sm:gap-4 pb-2" style={{ width: 'max-content' }}>
                {products.map((product) => (
                  <div
                    key={product._id || product.id}
                    className="flex-shrink-0 w-56 sm:w-64"
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestiveSpecials;
