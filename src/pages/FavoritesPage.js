import React, { useState, useEffect } from 'react';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { getFavoritesAPI } from '../api/favoritesApi';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const FavoritesPage = () => {
  const { favorites: favoriteContext, isAuthenticated: contextAuthenticated, isFavorite, toggleFavorite } = useFavorite();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});

  // Fetch favorite products details
  useEffect(() => {
    const loadFavoriteProducts = async () => {
      setLoading(true);
      try {
        // Use favorites from context - they now contain full product data
        if (favoriteContext && Array.isArray(favoriteContext) && favoriteContext.length > 0) {
          // Filter out any non-object items (legacy p_code strings)
          const products = favoriteContext.filter(item => typeof item === 'object' && item !== null);
          setFavoriteProducts(products);
        } else {
          setFavoriteProducts([]);
        }
      } catch (error) {
        console.error('Error loading favorite products:', error);
        setFavoriteProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteProducts();
  }, [favoriteContext]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  if ((favoriteContext?.length === 0 || !favoriteContext) && favoriteProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <HeartIcon className="w-16 h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Favorites List is Empty</h1>
          <p className="text-gray-600 mb-8">
            Start adding products to your favorites list by clicking the heart icon on any product.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Handle add to cart
  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    const productId = product.p_code || product._id;
    
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      await addItem(product, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Failed to add item to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Favorites</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {favoriteProducts.map((product, index) => {
          const uniqueKey = product.p_code || product._id || `${product.product_name}-${index}`;
          return (
            <div 
              key={uniqueKey} 
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/product/${product.p_code || product._id}`)}
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden p-4">
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite({
                      ...product,
                      p_code: product.p_code || product._id,
                      _id: product.p_code || product._id,
                      product_name: product.product_name,
                      our_price: product.our_price,
                      image_url: product.image_url,
                      brand_name: product.brand_name,
                      package_size: product.package_size,
                      package_unit: product.package_unit,
                      product_mrp: product.product_mrp,
                      discount_percentage: product.discount_percentage,
                      store_quantity: product.store_quantity || 1,
                      max_quantity_allowed: product.max_quantity_allowed || 10
                    });
                  }}
                  className="absolute top-2 right-2 z-20 p-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isFavorite(product.p_code || product._id) ? (
                    <HeartSolid className="w-4 h-4 text-red-500" />
                  ) : (
                    <HeartIcon className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
                  )}
                </button>
                
                <img
                  src={product.image_url || '/images/logo.jpg'}
                  alt={product.product_name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.target.src = '/images/logo.jpg';
                  }}
                />
                {product.discount_percentage > 0 && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded font-semibold z-10">
                    ₹ {product.discount_percentage} OFF
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">MRP <span className="text-gray-400">DMart</span></p>
                    <p className="text-xs text-gray-400 line-through">₹ {product.product_mrp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">MRP <span className="text-gray-400">DMart</span></p>
                    <p className="text-base font-bold text-gray-900">₹ {product.our_price}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-2">(Inclusive of all taxes)</p>

                <h3 className="text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">{product.product_name}</h3>

                {/* Package Size Selector */}
                {product.package_size && (
                  <select 
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option>{product.package_size} {product.package_unit}</option>
                  </select>
                )}

                {/* Add to Cart Button */}
                <button 
                  className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1 ${
                    addingToCart[product.p_code || product._id] 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  onClick={(e) => handleAddToCart(product, e)}
                  disabled={addingToCart[product.p_code || product._id]}
                >
                  {addingToCart[product.p_code || product._id] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ADDING...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      ADD TO CART
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FavoritesPage;

