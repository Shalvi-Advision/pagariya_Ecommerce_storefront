import React, { useState, useEffect } from 'react';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContextOptimized';
import { Link, useNavigate } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { getFavorites } from '../api/favoritesApi';
import { getProductDetailsByPcode } from '../api/productsApi';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const FavoritesPage = () => {
  const { isFavorite, toggleFavorite } = useFavorite();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});

  // Helper to get store code
  const getStoreCode = () => {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        return location?.store?.store_code || location?.store?.storeCode || 'GRK001';
      } catch (error) {
        console.error('Error parsing location data:', error);
        return 'GRK001';
      }
    }
    return 'GRK001';
  };

  // Fetch favorite products from API
  useEffect(() => {
    const loadFavoriteProducts = async () => {
      setLoading(true);
      try {
        if (!isAuthenticated) {
          // For guest users, use localStorage
          const savedFavorites = localStorage.getItem('favorites');
          if (savedFavorites) {
            const products = JSON.parse(savedFavorites).filter(item => typeof item === 'object' && item !== null);
            setFavoriteProducts(products);
          } else {
            setFavoriteProducts([]);
          }
          setLoading(false);
          return;
        }

        // For authenticated users, fetch from API
        console.log('🔍 Fetching favorites from API...');
        const response = await getFavorites();
        
        if (response.success && response.data && response.data.length > 0) {
          console.log('✅ Favorites API response:', response);
          
          // Extract p_codes from API response
          const favoriteData = response.data;
          console.log('📝 Extracted favorites data:', favoriteData);

          const storeCodeFromStorage = getStoreCode();

          // Fetch each favorite product individually using getProductDetailsByPcode
          console.log('🛍️ Fetching product details for each favorite...');
          const productPromises = favoriteData.map(async (favorite) => {
            try {
              console.log(`🔍 Fetching product details for p_code: ${favorite.p_code}`);
              
              // Use the store_code from the favorite item (saved when it was favorited)
              // This is the correct store where the product exists
              const favoriteStoreCode = favorite.store_code || storeCodeFromStorage;
              
              console.log(`📍 Using store_code: ${favoriteStoreCode} for p_code: ${favorite.p_code}`);
              
              const productResponse = await getProductDetailsByPcode(
                favorite.p_code,
                favoriteStoreCode
              );
              
              if (productResponse.success && productResponse.data) {
                console.log(`✅ Found product details for p_code: ${favorite.p_code}`);
                console.log('📦 Product data:', productResponse.data);
                
                // Ensure the product has the required fields for display
                const product = productResponse.data;
                
                // Map image_url to use pcode_img if available
                if (product.pcode_img && !product.image_url) {
                  product.image_url = product.pcode_img;
                }
                
                // Ensure price field is set for cart compatibility
                if (!product.price && product.our_price) {
                  product.price = product.our_price;
                }
                
                // Ensure package_size and package_unit are properly set
                if (product.package_size && typeof product.package_size === 'string') {
                  const parts = product.package_size.split(/\s+/);
                  product.package_size = parseFloat(parts[0]) || product.package_size;
                  product.package_unit = parts[1] || product.package_unit || 'GM';
                }
                
                console.log('🔧 Processed product for display:', product);
                return product;
              } else {
                console.warn(`⚠️ No product found for p_code: ${favorite.p_code} in store: ${favoriteStoreCode}`);
                console.warn('API Response:', productResponse);
              }
              return null;
            } catch (error) {
              console.error(`❌ Error fetching product for p_code ${favorite.p_code}:`, error);
              return null;
            }
          });

          const fetchedProducts = await Promise.all(productPromises);
          const validProducts = fetchedProducts.filter(p => p !== null);
          
          console.log(`✅ Loaded ${validProducts.length} products out of ${favoriteData.length} favorites`);
          console.log('📋 Products array being set:', validProducts);
          
          if (validProducts.length > 0) {
            console.log('🔍 First product sample:', validProducts[0]);
            console.log('🔍 Product keys:', Object.keys(validProducts[0]));
          }
          
          setFavoriteProducts(validProducts);
          
          // Debug: Log state after setting
          setTimeout(() => {
            console.log('🔄 favoriteProducts state updated:', validProducts.length, 'products');
          }, 100);
        } else {
          console.log('ℹ️ No favorites found in API response');
          setFavoriteProducts([]);
        }
      } catch (error) {
        console.error('Error loading favorite products:', error);
        
        // Fallback to localStorage if API fails
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          const products = JSON.parse(savedFavorites).filter(item => typeof item === 'object' && item !== null);
          setFavoriteProducts(products);
        } else {
          setFavoriteProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteProducts();
  }, [isAuthenticated]);

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

  if (favoriteProducts.length === 0) {
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
                  disabled
                  className="absolute top-2 right-2 z-20 p-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg opacity-70 cursor-not-allowed"
                >
                  <HeartSolid className="w-4 h-4 text-red-500" />
                </button>
                
                <img
                  src={product.image_url || '/images/default_image.jpg'}
                  alt={product.product_name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.target.src = '/images/default_image.jpg';
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
                    <p className="text-xs text-gray-500 mb-1">MRP <span className="text-gray-400">Grahak Peth</span></p>
                    <p className="text-xs text-gray-400 line-through">₹ {product.product_mrp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">MRP <span className="text-gray-400">Grahak Peth</span></p>
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

