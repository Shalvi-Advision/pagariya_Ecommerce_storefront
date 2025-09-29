import React, { useState, useEffect } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { getProducts } from '../api/productsApi';
import { useCart } from '../context/CartContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import ProductCard from './ProductCard';
import Loading from './Loading';

const DealsSection = () => {
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
        console.log('✅ Random products loaded for deals section:', randomProducts.length);
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-center h-64">
              <Loading size="large" text="Loading deals..." />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100">
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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-2 sm:py-3 lg:py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-2 sm:p-3 lg:p-4 shadow-lg border border-gray-100">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Deals You Can't Miss
            </h2>
            <button
              onClick={handleViewAll}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm sm:text-base transition-colors duration-200 group"
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

export default DealsSection;
