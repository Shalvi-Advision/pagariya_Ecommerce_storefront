import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductDetails } from '../services/api';
import { useCart } from '../context/CartContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { APP_CONSTANTS } from '../constants';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const { addItem } = useCart();

  // Debug logging for component lifecycle
  console.log('🔍 ProductDetailsPage Component Rendered');
  console.log('📋 Component State:', {
    id,
    product: product ? 'Product loaded' : 'No product',
    loading,
    error,
    imageLoading,
    quantity
  });
  console.log('🔍 ProductDetailsPage received ID:', id);
  console.log('🔍 ProductDetailsPage ID type:', typeof id);
  console.log('🔍 ProductDetailsPage ID length:', id?.length);

  // Get store and project codes from environment variables
  const STORE_CODE = process.env.REACT_APP_STORE_CODE || "KET"; // Fallback to default
  const PROJECT_CODE = process.env.REACT_APP_PROJECT_CODE || "RET90"; // Fallback to default
  
  // Override with correct values if environment variables are placeholders
  const finalStoreCode = (STORE_CODE === "your_store_code_here") ? "KET" : STORE_CODE;
  const finalProjectCode = (PROJECT_CODE === "your_project_code_here") ? "RET90" : PROJECT_CODE;
  
  // Debug environment variables
  console.log('🔧 Environment variables:', {
    REACT_APP_STORE_CODE: process.env.REACT_APP_STORE_CODE,
    REACT_APP_PROJECT_CODE: process.env.REACT_APP_PROJECT_CODE,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    NODE_ENV: process.env.NODE_ENV
  });
  console.log('🔧 Final codes to use:', {
    finalStoreCode,
    finalProjectCode,
    originalStoreCode: STORE_CODE,
    originalProjectCode: PROJECT_CODE
  });


  useEffect(() => {
    console.log('🔄 useEffect triggered with id:', id);
    if (id) {
      console.log('✅ Valid ID found, calling loadProduct');
      loadProduct();
    } else {
      console.log('❌ No ID found, setting error');
      setError('Invalid product ID');
      setLoading(false);
    }
  }, [id]);

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
      
      console.log('✅ Product ID validation passed:', id);
      console.log('🔍 ProductDetailsPage loadProduct called with:', {
        id,
        finalStoreCode,
        finalProjectCode,
        env: {
          REACT_APP_STORE_CODE: process.env.REACT_APP_STORE_CODE,
          REACT_APP_PROJECT_CODE: process.env.REACT_APP_PROJECT_CODE
        }
      });
      
      console.log('📡 Calling getProductDetails API...');
      const response = await getProductDetails(id, finalStoreCode, finalProjectCode);
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
      // Navigate to cart or show success message
      navigate('/cart');
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering product details for:', product);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Product Image */}
          <div className="flex justify-center">
            <Card className="p-3 sm:p-4 lg:p-8 w-full">
              <div className="relative">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
                  </div>
                )}
                {product.pcode_img ? (
                  <img
                    src={product.pcode_img}
                    alt={product.product_name}
                    className={`w-full h-48 sm:h-64 lg:h-80 xl:h-96 object-contain rounded-lg transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-48 sm:h-64 lg:h-80 xl:h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs sm:text-sm">No Image Available</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Product Name and Brand */}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-4 leading-tight">
                {product.product_name}
              </h1>
              <div className="flex items-center mb-2 sm:mb-3 lg:mb-4">
                <span className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
                  Brand: {product.brand_name || 'Generic Brand'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">Description</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">
                {product.product_description || 'No description available'}
              </p>
            </div>

            {/* Package Size */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">Package Size</h3>
              <span className="inline-block bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {product.package_size} {product.package_unit}
              </span>
            </div>

            {/* Stock Status */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">Availability</h3>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isInStock() 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isInStock() ? `In Stock (${product.store_quantity} available)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-3 sm:pt-4 lg:pt-6">
              <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4 lg:mb-6">
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600">
                    ₹{formatPrice(product.our_price)}
                  </span>
                  {getDiscountPercentage() > 0 && (
                    <span className="text-xs sm:text-sm text-gray-500 line-through">
                      MRP: ₹{formatPrice(product.product_mrp)}
                    </span>
                  )}
                </div>
                {getDiscountPercentage() > 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                    {getDiscountPercentage()}% OFF
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3 sm:mb-4 lg:mb-6">
                <span className="text-sm sm:text-base font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-3 sm:px-4 py-2 text-center min-w-10 sm:min-w-12 text-sm sm:text-base">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity >= (product.max_quantity_allowed || 10)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    Max: {product.max_quantity_allowed || 10}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                <Button
                  onClick={handleAddToCart}
                  size="large"
                  className="flex-1"
                  disabled={!isInStock()}
                >
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
                </Button>
                <Button
                  variant="outline"
                  size="large"
                  onClick={() => navigate('/cart')}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">View Cart</span>
                  <span className="sm:hidden">Cart</span>
                </Button>
              </div>
            </div>

            {/* Product Code */}
            <div className="border-t pt-4">
              <p className="text-xs sm:text-sm text-gray-500">
                Product Code: {product.p_code}
              </p>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">You might also like</h2>
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm sm:text-base">Related products will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
