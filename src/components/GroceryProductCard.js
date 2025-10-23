import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const GroceryProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(product.selectedWeight || product.weightOptions[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Extract product data
  const {
    id,
    name,
    subcategory,
    brand,
    mrp,
    price,
    discount,
    weightOptions,
    image,
    image_url,
    pcode_img,
    p_code: pcode
  } = product;

  // Debug logging for image fields
  console.log('🖼️ GroceryProductCard product data:', product);
  console.log('🖼️ GroceryProductCard image field:', image);
  console.log('🖼️ GroceryProductCard image_url field:', image_url);
  console.log('🖼️ GroceryProductCard pcode_img field:', pcode_img);

  // Calculate price per unit
  const getPricePerUnit = (weight) => {
    const weightValue = parseFloat(weight.replace(/[^\d.]/g, ''));
    const unit = weight.includes('kg') ? 'kg' : 'g';
    const pricePerUnit = unit === 'kg' ? (price / weightValue) : (price / (weightValue / 1000));
    return `₹ ${pricePerUnit.toFixed(2)} / 1 ${unit === 'kg' ? 'kg' : 'g'}`;
  };

  const handleAddToCart = () => {
    // Debug logging for pcode
    console.log('🛒 GroceryProductCard Add to Cart clicked - PCode:', pcode || 'N/A', 'Product ID:', id, 'Product Name:', name);
    
    if (onAddToCart) {
      onAddToCart({
        ...product,
        quantity,
        selectedWeight
      });
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleImageLoad = () => {
    console.log('✅ GroceryProductCard image loaded successfully:', image_url || pcode_img || image);
    setImageLoaded(true);
  };

  const handleImageError = (event) => {
    console.log('❌ GroceryProductCard image failed to load:', image_url || pcode_img || image);
    console.log('❌ GroceryProductCard image error event:', event);
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 w-full max-w-sm mx-auto flex flex-col" style={{ minHeight: '420px' }}>
      {/* Image Container */}
      <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 h-40 flex items-center justify-center p-6 flex-shrink-0">
        <Link 
          to={`/product/${pcode || id}`} 
          className="block w-full h-full flex items-center justify-center"
          onClick={() => {
            console.log('🖼️ GroceryProductCard Product Image clicked - PCode:', pcode || 'N/A', 'Product ID:', id, 'Product Name:', name);
          }}
        >
          {!imageError ? (
            <img
              src={image_url || pcode_img || image || '/images/logo.jpg'}
              alt={name}
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-gray-400">📦</span>
            </div>
          )}

          {/* Loading placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
          )}
        </Link>

        {/* Vegetarian Indicator */}
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          {isWishlisted ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
          )}
        </button>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Product Name */}
        <h3 
          className="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2 cursor-pointer hover:text-green-600 transition-colors"
          onClick={() => {
            console.log('🔗 GroceryProductCard Product Name clicked - PCode:', pcode || 'N/A', 'Product ID:', id, 'Product Name:', name);
            // Navigate to product details
            window.location.href = `/product/${pcode || id}`;
          }}
        >
          {name}
        </h3>

        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900">₹ {price}</span>
            <span className="text-sm text-gray-500 line-through">₹ {mrp}</span>
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
              ₹ {discount} OFF
            </div>
          </div>
          <p className="text-xs text-gray-500">(Inclusive of all taxes)</p>
        </div>

        {/* Weight Selector */}
        <div className="mb-4">
          <select
            value={selectedWeight}
            onChange={(e) => setSelectedWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {weightOptions.map((weight, index) => (
              <option key={index} value={weight}>
                {weight} ({getPricePerUnit(weight)})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-lg transition-colors ${
              isWishlisted 
                ? 'bg-red-50 text-red-500' 
                : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <HeartIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCartIcon className="w-4 h-4" />
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroceryProductCard;


