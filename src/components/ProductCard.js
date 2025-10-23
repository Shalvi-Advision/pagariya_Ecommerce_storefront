import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, MinusIcon, PlusIcon, XMarkIcon, HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useFavorite } from '../context/FavoriteContext';

// Utility function to safely render values (with fallbacks)
const safeValue = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  return value;
};

const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorite();

  // Debug: Log the raw product data
  console.log('🔍 ProductCard received product data:', product);
  console.log('🔍 ProductCard product keys:', Object.keys(product || {}));
  console.log('🔍 ProductCard p_code field:', product?.p_code);
  console.log('🔍 ProductCard pcode field:', product?.pcode);
  console.log('🔍 ProductCard _id field:', product?._id);
  console.log('🖼️ ProductCard image_url field:', product?.image_url);
  console.log('🖼️ ProductCard pcode_img field:', product?.pcode_img);

  // Extract product data with fallbacks (conversion is handled in API layer)
  const {
    _id: id,
    product_name: name,
    product_description: description,
    package_size,
    package_unit,
    product_mrp: mrp,
    our_price: price,
    brand_name,
    store_quantity,
    max_quantity_allowed,
    image_url: image,
    pcode_img: fallbackImage,
    discount_percentage,
    p_code: pcode
  } = product;

  // Provide fallbacks for all fields
  const safeId = safeValue(id, 'unknown');
  const safeName = safeValue(name, 'Product Name');
  const safeDescription = safeValue(description, 'No description available');
  const safeBrandName = safeValue(brand_name, '');
  const safePackageUnit = safeValue(package_unit, 'unit');
  const safeImage = safeValue(image, fallbackImage || '/images/logo.jpg');
  const safePcode = safeValue(pcode, safeId); // Use pcode if available, fallback to id

  // Debug: Log the final image URL being used
  console.log('🖼️ ProductCard final image URL:', safeImage);

  // Debug: Log the navigation URL
  console.log('🔗 ProductCard navigation URL will be:', `/product/${safePcode}`);
  console.log('🔗 ProductCard safePcode:', safePcode);
  console.log('🔗 ProductCard safeId:', safeId);

  // Ensure numeric values have defaults
  const safeMrp = mrp || 0;
  const safePrice = price || 0;
  const safeStoreQuantity = store_quantity || 0;
  const safeMaxQuantity = max_quantity_allowed || 10;
  const safeDiscountPercentage = discount_percentage || 0;
  const safePackageSize = package_size || 0;

  // Calculate discount amount if not provided
  const discountAmount = safeDiscountPercentage
    ? Math.round((safeMrp * safeDiscountPercentage) / 100)
    : Math.round(safeMrp - safePrice);

  const handleAddToCart = () => {
    // Debug logging for pcode
    console.log('🛒 ProductCard Add to Cart clicked - PCode:', pcode || 'N/A', 'Product ID:', safeId, 'Product Name:', safeName);
    
    if (safeStoreQuantity > 0 && quantity <= safeMaxQuantity) {
      // Create product object for cart
      const productForCart = {
        id: safeId,
        title: safeName,
        price: safePrice,
        image: safeImage,
        brand: safeBrandName,
        packageSize: `${safePackageSize} ${safePackageUnit}`,
        mrp: safeMrp,
        discountPercentage: safeDiscountPercentage
      };
      
      // Call the parent's onAddToCart function with the product and quantity
      onAddToCart(productForCart, quantity);
      
      // Show quantity selector for further adjustments
      setShowQuantitySelector(true);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= safeMaxQuantity) {
      setQuantity(newQuantity);
      
      // Update cart with new quantity
      const productForCart = {
        id: safeId,
        title: safeName,
        price: safePrice,
        image: safeImage,
        brand: safeBrandName,
        packageSize: `${safePackageSize} ${safePackageUnit}`,
        mrp: safeMrp,
        discountPercentage: safeDiscountPercentage
      };
      
      onAddToCart(productForCart, newQuantity);
    }
  };

  const handleRemoveFromCart = () => {
    setShowQuantitySelector(false);
    setQuantity(1);
  };

  const handleClose = () => {
    setShowQuantitySelector(false);
    setQuantity(1);
  };

  const handleImageLoad = () => {
    console.log('✅ ProductCard image loaded successfully:', safeImage);
    setImageLoaded(true);
  };

  const handleImageError = (event) => {
    console.log('❌ ProductCard image failed to load:', safeImage);
    console.log('❌ Image error event:', event);
    setImageError(true);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/60 w-full max-w-sm mx-auto flex flex-col group hover:scale-105" style={{ minHeight: '420px' }}>
      {/* Image Container - Optimized for 1:1 aspect ratio with Modern Gradient */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 aspect-square w-full flex items-center justify-center p-3 sm:p-4 flex-shrink-0 overflow-hidden">
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (isFavorite(safeId)) {
              removeFromFavorites(safeId);
            } else {
              addToFavorites({
                id: safeId,
                name: safeName,
                price: safePrice,
                image: safeImage,
                brand: safeBrandName,
                packageSize: `${safePackageSize} ${safePackageUnit}`,
                mrp: safeMrp,
                discountPercentage: safeDiscountPercentage
              });
            }
          }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 p-1.5 sm:p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-110"
        >
          {isFavorite(safeId) ? (
            <HeartSolid className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          ) : (
            <HeartOutline className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
          )}
        </button>

        {/* Stock Status Badge with Gradient */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20">
          {safeStoreQuantity > 0 ? (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg backdrop-blur-sm">
              In Stock
            </div>
          ) : (
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg backdrop-blur-sm">
              Out of Stock
            </div>
          )}
        </div>

        {/* Discount Badge with Modern Gradient */}
        {safeDiscountPercentage > 0 && (
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-xl animate-pulse">
              {safeDiscountPercentage}% OFF
            </div>
          </div>
        )}

        {/* Product Image Link */}
        <Link 
          to={`/product/${safePcode}`} 
          className="block w-full h-full flex items-center justify-center relative overflow-hidden rounded-lg"
          onClick={() => {
            console.log('🖼️ ProductCard Product Image clicked - PCode:', safePcode, 'Product ID:', safeId, 'Product Name:', safeName);
          }}
        >
          {!imageError ? (
            <img
              src={safeImage}
              alt={safeName}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                objectPosition: 'center',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl text-gray-500">📦</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">Image not available</p>
              </div>
            </div>
          )}

          {/* Loading placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 rounded-lg"></div>
        </Link>
      </div>

      {/* Content Container */}
      <div className="p-3 sm:p-4 pb-3 sm:pb-4 flex flex-col flex-1 min-h-0">
        {/* Content area */}
        <div className="flex flex-col justify-between flex-1">
          <div className="space-y-2 sm:space-y-2.5 flex-shrink-0">
            {/* Brand Name with Gradient */}
            {safeBrandName && (
              <div className="text-xs bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-bold uppercase tracking-wider">
                {safeBrandName}
              </div>
            )}

            {/* Product Name - Fixed height */}
            <Link 
              to={`/product/${safePcode}`}
              onClick={() => {
                console.log('🔗 ProductCard Product Name clicked - PCode:', safePcode, 'Product ID:', safeId, 'Product Name:', safeName);
              }}
              className="block"
            >
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors leading-tight h-10 sm:h-12">
                {safeName}
              </h3>
            </Link>

            

            {/* Package Size */}
            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md inline-block">
              {safePackageSize} {safePackageUnit}
            </div>

            {/* Stock Information */}
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium ${safeStoreQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {safeStoreQuantity > 0 ? `${safeStoreQuantity} in stock` : 'Out of stock'}
              </span>
              {safeMaxQuantity && safeMaxQuantity !== 10 && (
                <span className="text-gray-500">
                  Max: {safeMaxQuantity}
                </span>
              )}
            </div>

            {/* Pricing Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-left">
                    <div className="text-xs text-gray-500 font-medium">MRP</div>
                    <div className="text-sm text-gray-500 line-through">₹{safeMrp}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-500 font-medium">Our Price</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">₹{safePrice}</div>
                  </div>
                </div>
                {discountAmount > 0 && (
                  <div className="bg-green-100 text-green-700 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold flex-shrink-0">
                    ₹{discountAmount} OFF
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">(Inclusive of all taxes)</p>
            </div>
          </div>

          {/* Add to Cart Button or Quantity Selector - Always at bottom */}
          <div className="flex-shrink-0 mt-3 sm:mt-4">
            {!showQuantitySelector ? (
              <button
                onClick={handleAddToCart}
                disabled={safeStoreQuantity === 0}
                className={`w-full py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
                  safeStoreQuantity > 0
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{safeStoreQuantity > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}</span>
                <span className="sm:hidden">{safeStoreQuantity > 0 ? 'ADD' : 'OUT'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  {/* Minus Button */}
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className={`p-2 sm:p-2.5 flex items-center justify-center transition-colors duration-200 ${
                      quantity <= 1
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <MinusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Quantity Display */}
                  <div className="bg-white px-3 sm:px-4 py-2 sm:py-2.5 min-w-[2.5rem] sm:min-w-[3rem] flex items-center justify-center">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">{quantity}</span>
                  </div>

                  {/* Plus Button */}
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= safeMaxQuantity}
                    className={`p-2 sm:p-2.5 flex items-center justify-center transition-colors duration-200 ${
                      quantity >= safeMaxQuantity
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="bg-white border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 p-2 sm:p-2.5 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-sm"
                >
                  <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
