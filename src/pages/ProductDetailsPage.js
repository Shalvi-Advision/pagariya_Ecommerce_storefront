import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getProductDetails } from '../services/api';
import { useCart } from '../context/CartContext';
import { useResponsive } from '../hooks/useResponsive';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { APP_CONSTANTS } from '../constants';
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

const ProductDetailsPage = () => {
  const { id } = useParams(); // This is pcode
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const { addItem } = useCart();
  const { isMobile } = useResponsive();

  // Extract URL parameters
  const dept_id = searchParams.get('dept_id');
  const category_id = searchParams.get('category_id');
  const sub_category_id = searchParams.get('sub_category_id');

  // Debug logging for component lifecycle
  console.log('🔍 ProductDetailsPage Component Rendered');
  console.log('📋 Component State:', {
    id,
    dept_id,
    category_id,
    sub_category_id,
    product: product ? 'Product loaded' : 'No product',
    loading,
    error,
    imageLoading,
    quantity
  });
  console.log('🔍 ProductDetailsPage received ID:', id);
  console.log('🔍 ProductDetailsPage ID type:', typeof id);
  console.log('🔍 ProductDetailsPage ID length:', id?.length);

  // Get store code from localStorage
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


  useEffect(() => {
    console.log('🔄 useEffect triggered with id:', id);
    if (id) {
      // Check if required parameters are present
      if (!dept_id || !category_id || !sub_category_id) {
        console.log('❌ Missing required parameters:', { dept_id, category_id, sub_category_id });
        setError('Missing required product parameters. Please navigate from a product listing.');
        setLoading(false);
        return;
      }
      console.log('✅ Valid ID and parameters found, calling loadProduct');
      loadProduct();
    } else {
      console.log('❌ No ID found, setting error');
      setError('Invalid product ID');
      setLoading(false);
    }
  }, [id, dept_id, category_id, sub_category_id]);

  const loadProduct = async () => {
    console.log('🚀 loadProduct function started');
    try {
      console.log('⏳ Setting loading to true and clearing error');
      setLoading(true);
      setError(null);
      
      // Validate product ID
      if (!id || id.trim() === '') {
        console.log('❌ Product ID validation failed:', id);
        throw new Error('Product ID is required');
      }
      
      // Validate required parameters
      if (!dept_id || !category_id || !sub_category_id) {
        console.log('❌ Missing required parameters:', { dept_id, category_id, sub_category_id });
        throw new Error('Missing required product parameters');
      }
      
      const storeCode = getStoreCode();
      
      console.log('✅ Product ID and parameters validation passed:', { id, dept_id, category_id, sub_category_id, storeCode });
      console.log('🔍 ProductDetailsPage loadProduct called with:', {
        id,
        dept_id,
        category_id,
        sub_category_id,
        storeCode
      });
      
      console.log('📡 Calling getProductDetails API...');
      console.log('📡 API Request Details:', {
        pcode: id,
        dept_id,
        category_id,
        sub_category_id,
        storeCode,
        apiUrl: process.env.REACT_APP_API_URL || 'https://ecommerceapi-web.onrender.com/api'
      });
      
      const response = await getProductDetails(id, dept_id, category_id, sub_category_id, storeCode);
      console.log('📦 getProductDetails API response received:', response);
      
      console.log('🔍 Analyzing API response...');
      console.log('Response exists:', !!response);
      console.log('Response success:', response?.success);
      console.log('Response data exists:', !!response?.data);
      console.log('Response data type:', typeof response?.data);
      console.log('Response data content:', response?.data);
      
      if (response && response.success && response.data) {
        console.log('✅ API response is valid, setting product data');
        console.log('📦 Product data to be set:', response.data);
        setProduct(response.data);
        console.log('✅ Product state updated successfully');
      } else if (response && !response.success) {
        // API returned success: false
        console.error('❌ API returned success: false');
        console.error('❌ Response details:', response);
        throw new Error(response.message || 'Product not found or unavailable');
      } else {
        // Unexpected response structure
        console.error('❌ Unexpected response structure');
        console.error('❌ Response details:', response);
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('❌ Error in loadProduct catch block');
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      console.error('❌ Full error object:', err);
      
      console.log('❌ API failed, setting error message');
      // Provide more specific error messages
      let errorMessage = 'Failed to load product details';
      
      if (err.message) {
        errorMessage = err.message;
        console.log('📝 Using error message:', errorMessage);
      } else if (err.response) {
        console.log('📝 Using HTTP error response');
        // Handle HTTP errors
        if (err.response.status === 404) {
          errorMessage = 'Product not found';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection';
      }
      
      console.log('📝 Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('🏁 loadProduct finally block - setting loading to false');
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      console.log('🛒 Adding to cart:', product);
      // Transform product data to match cart expectations
      const cartItem = {
        id: product.p_code || product._id,
        title: product.product_name,
        price: product.our_price || 0,
        image: product.pcode_img || product.image_url || null,
        brand: product.brand_name || 'Generic Brand',
        description: product.product_description || 'No description available',
        packageSize: product.package_size,
        packageUnit: product.package_unit,
        mrp: product.product_mrp || 0,
        maxQuantity: product.max_quantity_allowed || 10,
        stock: product.store_quantity || 0
      };
      
      console.log('🛒 Cart item:', cartItem);
      addItem(cartItem, quantity);
      // Don't navigate to cart - stay on product page
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    const maxQuantity = product?.max_quantity_allowed || 10;
    setQuantity(prev => Math.max(1, Math.min(maxQuantity, newQuantity)));
  };

  // Helper function to format price
  const formatPrice = (price) => {
    return parseFloat(price || 0).toFixed(2);
  };

  // Helper function to check if product is in stock
  const isInStock = () => {
    return product && product.store_quantity > 0;
  };

  // Helper function to get discount percentage
  const getDiscountPercentage = () => {
    if (!product) return 0;
    return product.discount_percentage || 0;
  };

  console.log('🎨 ProductDetailsPage render - checking conditions');
  console.log('🎨 Loading state:', loading);
  console.log('🎨 Error state:', error);
  console.log('🎨 Product state:', product);
  console.log('🎨 Product exists:', !!product);
  console.log('🎨 Product type:', typeof product);

  if (loading) {
    console.log('🎨 Rendering loading state');
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading size="large" text="Loading product details..." />
      </div>
    );
  }

  if (error) {
    console.log('🎨 Rendering error state:', error);
    return (
      <div 
        className="container mx-auto px-4 py-8"
        style={{ backgroundColor: COLORS.white }}
      >
        <div className="text-center">
          <div 
            className="mb-6 p-6 rounded-xl border max-w-md mx-auto"
            style={{
              backgroundColor: COLORS.error[50],
              borderColor: COLORS.error[200]
            }}
          >
            <p className="mb-4" style={{ color: COLORS.error[600] }}>Error: {error}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={loadProduct}>Try Again</Button>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Current product ID:', id);
                console.log('Store Code:', STORE_CODE);
                console.log('Project Code:', PROJECT_CODE);
              }}
            >
              Debug Info
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    console.log('🎨 Rendering no product state');
    return (
      <div 
        className="container mx-auto px-4 py-8"
        style={{ backgroundColor: COLORS.white }}
      >
        <div className="text-center">
          <p className="mb-4" style={{ color: COLORS.gray[500] }}>Product not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering product details for:', product);

  return (
    <div 
      className="container mx-auto px-2 sm:px-4 py-4 sm:py-8"
      style={{ backgroundColor: COLORS.white }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 lg:gap-8">
          {/* Product Image */}
          <div className="flex justify-center">
            <Card className={`${isMobile ? 'p-2' : 'p-3 sm:p-4 lg:p-8'} w-full`}>
              <div className="relative">
                {imageLoading && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center rounded-lg"
                    style={{ backgroundColor: COLORS.gray[100] }}
                  >
                    <div 
                      className={`animate-spin rounded-full border-b-2 ${isMobile ? 'h-6 w-6' : 'h-8 w-8 sm:h-12 sm:w-12'}`}
                      style={{ borderColor: COLORS.primary[600] }}
                    ></div>
                  </div>
                )}
                {product.pcode_img ? (
                  <img
                    src={product.pcode_img}
                    alt={product.product_name}
                    className={`w-full ${isMobile ? 'h-56' : 'h-48 sm:h-64 lg:h-80 xl:h-96'} object-contain rounded-lg transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className={`w-full ${isMobile ? 'h-56' : 'h-48 sm:h-64 lg:h-80 xl:h-96'} rounded-lg flex items-center justify-center`}
                    style={{ backgroundColor: COLORS.gray[100] }}
                  >
                    <div className="text-center" style={{ color: COLORS.gray[500] }}>
                      <svg 
                        className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12 sm:w-16 sm:h-16'} mx-auto mb-2`}
                        style={{ color: COLORS.gray[400] }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`}>No Image Available</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Product Details */}
          <div className={`${isMobile ? 'space-y-2' : 'space-y-3 sm:space-y-4 lg:space-y-6'}`}>
            {/* Product Name and Brand */}
            <div>
              <h1 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl lg:text-3xl'} font-bold ${isMobile ? 'mb-1' : 'mb-2 sm:mb-4'} leading-tight`} style={{ color: COLORS.gray[900] }}>
                {product.product_name}
              </h1>
              <div className={`flex items-center ${isMobile ? 'mb-1' : 'mb-2 sm:mb-3 lg:mb-4'}`}>
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm lg:text-base'} font-medium`} style={{ color: COLORS.gray[600] }}>
                  Brand: {product.brand_name || 'Generic Brand'}
                </span>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2" style={{ color: COLORS.gray[700] }}>Product details</h3>
              <p className="text-xs sm:text-sm lg:text-base leading-relaxed" style={{ color: COLORS.gray[600] }}>
                {product.product_description || 'No description available'}
              </p>
            </div>

            {/* Pricing */}
            <div className={`border-t ${isMobile ? 'pt-2' : 'pt-3 sm:pt-4 lg:pt-6'}`} style={{ borderColor: COLORS.gray[200] }}>
              <div className={`flex items-center ${isMobile ? 'space-x-2 mb-2' : 'space-x-2 sm:space-x-4 mb-3 sm:mb-4 lg:mb-6'}`}>
                <div className="flex flex-col">
                  <span className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl lg:text-3xl'} font-bold`} style={{ color: COLORS.primary[600] }}>
                    ₹{formatPrice(product.our_price)}
                  </span>
                  {getDiscountPercentage() > 0 && (
                    <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} line-through`} style={{ color: COLORS.gray[500] }}>
                      MRP: ₹{formatPrice(product.product_mrp)}
                    </span>
                  )}
                </div>
                {getDiscountPercentage() > 0 && (
                  <span 
                    className={`px-2 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-medium`}
                    style={{
                      backgroundColor: COLORS.warning[100],
                      color: COLORS.warning[800]
                    }}
                  >
                    {getDiscountPercentage()}% OFF
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4'} ${isMobile ? 'mb-3' : 'mb-3 sm:mb-4 lg:mb-6'}`}>
                <span className={`${isMobile ? 'text-sm' : 'text-sm sm:text-base'} font-medium`} style={{ color: COLORS.gray[700] }}>Quantity:</span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center border rounded-lg"
                    style={{
                      borderColor: COLORS.gray[300],
                      backgroundColor: COLORS.white
                    }}
                  >
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className={`${isMobile ? 'px-3 py-2' : 'px-2 sm:px-3 py-2'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                      style={{
                        color: quantity <= 1 ? COLORS.gray[400] : COLORS.gray[600]
                      }}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      onMouseEnter={(e) => {
                        if (quantity > 1) {
                          e.currentTarget.style.color = COLORS.gray[800];
                          e.currentTarget.style.backgroundColor = COLORS.gray[50];
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (quantity > 1) {
                          e.currentTarget.style.color = COLORS.gray[600];
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      -
                    </button>
                    <span 
                      className={`${isMobile ? 'px-4 py-2 min-w-12' : 'px-3 sm:px-4 py-2 min-w-10 sm:min-w-12'} text-center ${isMobile ? 'text-base' : 'text-sm sm:text-base'}`}
                      style={{ color: COLORS.gray[900] }}
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className={`${isMobile ? 'px-3 py-2' : 'px-2 sm:px-3 py-2'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                      style={{
                        color: quantity >= (product.max_quantity_allowed || 10) ? COLORS.gray[400] : COLORS.gray[600]
                      }}
                      disabled={quantity >= (product.max_quantity_allowed || 10)}
                      aria-label="Increase quantity"
                      onMouseEnter={(e) => {
                        if (quantity < (product.max_quantity_allowed || 10)) {
                          e.currentTarget.style.color = COLORS.gray[800];
                          e.currentTarget.style.backgroundColor = COLORS.gray[50];
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (quantity < (product.max_quantity_allowed || 10)) {
                          e.currentTarget.style.color = COLORS.gray[600];
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                  <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`} style={{ color: COLORS.gray[500] }}>
                    Max: {product.max_quantity_allowed || 10}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex ${isMobile ? 'gap-2' : 'flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4'}`}>
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock()}
                  className={`flex-1 ${isMobile ? 'py-3' : 'py-2.5 sm:py-3'} px-4 ${isMobile ? 'text-sm' : 'sm:px-6 text-sm sm:text-base'} font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md text-white ${isMobile ? '' : 'hover:shadow-lg transform hover:scale-105 active:scale-95'} disabled:cursor-not-allowed`}
                  style={{
                    background: !isInStock() 
                      ? COLORS.gray[400]
                      : `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                    opacity: !isInStock() ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (isInStock() && !isMobile) {
                      e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[700]}, ${COLORS.success[700]})`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isInStock() && !isMobile) {
                      e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                    }
                  }}
                >
                  {isMobile ? (
                    'Add to Cart'
                  ) : (
                    <>
                      <span className="hidden sm:inline">
                        {isInStock() 
                          ? `Add to Cart - ₹${(parseFloat(formatPrice(product.our_price)) * quantity).toFixed(2)}`
                          : 'Out of Stock'
                        }
                      </span>
                      <span className="sm:hidden">
                        {isInStock() 
                          ? `Add - ₹${(parseFloat(formatPrice(product.our_price)) * quantity).toFixed(2)}`
                          : 'Out of Stock'
                        }
                      </span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className={`flex-1 ${isMobile ? 'py-3' : 'py-2.5 sm:py-3'} px-4 ${isMobile ? 'text-sm' : 'sm:px-6 text-sm sm:text-base'} font-semibold transition-all duration-200 border-2 ${isMobile ? '' : 'hover:shadow-md'}`}
                  style={{
                    backgroundColor: COLORS.white,
                    borderColor: isMobile ? COLORS.primary[600] : COLORS.gray[300],
                    color: isMobile ? COLORS.primary[600] : COLORS.gray[700]
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.backgroundColor = COLORS.gray[50];
                      e.currentTarget.style.borderColor = COLORS.primary[400];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.backgroundColor = COLORS.white;
                      e.currentTarget.style.borderColor = COLORS.gray[300];
                    }
                  }}
                >
                  {isMobile ? 'Go to Cart' : (
                    <>
                      <span className="hidden sm:inline">View Cart</span>
                      <span className="sm:hidden">Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8" style={{ color: COLORS.gray[900] }}>You might also like</h2>
          <div className="text-center py-8" style={{ color: COLORS.gray[500] }}>
            <p className="text-sm sm:text-base">Related products will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
