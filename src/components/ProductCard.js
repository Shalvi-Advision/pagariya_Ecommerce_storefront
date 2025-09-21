import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
    pcode_img: image,
    discount_percentage
  } = product;

  // Provide fallbacks for all fields
  const safeId = safeValue(id, 'unknown');
  const safeName = safeValue(name, 'Product Name');
  const safeDescription = safeValue(description, 'No description available');
  const safeBrandName = safeValue(brand_name, '');
  const safePackageUnit = safeValue(package_unit, 'unit');
  const safeImage = safeValue(image, '');

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
    if (safeStoreQuantity > 0 && quantity <= safeMaxQuantity) {
      setShowQuantitySelector(true);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= safeMaxQuantity) {
      setQuantity(newQuantity);
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
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 w-full max-w-sm mx-auto flex flex-col" style={{ minHeight: '420px' }}>
      {/* Image Container */}
      <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 h-40 flex items-center justify-center p-6 flex-shrink-0">
        <Link to={`/product/${safeId}`} className="block w-full h-full flex items-center justify-center">
          {!imageError ? (
            <img
              src={safeImage}
              alt={safeName}
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

        {/* Stock Status Badge */}
        <div className="absolute top-3 right-3">
          {safeStoreQuantity > 0 ? (
            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
              In Stock
            </div>
          ) : (
            <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold">
              Out of Stock
            </div>
          )}
        </div>

        {/* Discount Badge */}
        {safeDiscountPercentage > 0 && (
          <div className="absolute top-3 left-3">
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              {safeDiscountPercentage}% OFF
            </div>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-3 pb-4 flex flex-col flex-1 min-h-0">
        {/* Content area */}
        <div className="flex flex-col justify-between flex-1">
          <div className="space-y-2 flex-shrink-0">
            {/* Brand Name */}
            {safeBrandName && (
              <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide">
                {safeBrandName}
              </div>
            )}

            {/* Product Name - Fixed height */}
            <Link to={`/product/${safeId}`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-green-600 transition-colors leading-tight h-10 flex items-start">
                {safeName}
              </h3>
            </Link>

            {/* Product Description */}
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {safeDescription}
            </p>

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
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="text-xs text-gray-500 font-medium">MRP</div>
                    <div className="text-sm text-gray-500 line-through">₹{safeMrp}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-500 font-medium">Our Price</div>
                    <div className="text-xl font-bold text-gray-900">₹{safePrice}</div>
                  </div>
                </div>
                {discountAmount > 0 && (
                  <div className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0">
                    ₹{discountAmount} OFF
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">(Inclusive of all taxes)</p>
            </div>
          </div>

          {/* Add to Cart Button or Quantity Selector - Always at bottom */}
          <div className="flex-shrink-0 mt-auto">
            {!showQuantitySelector ? (
              <button
                onClick={handleAddToCart}
                disabled={safeStoreQuantity === 0}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
                  safeStoreQuantity > 0
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCartIcon className="w-4 h-4" />
                {safeStoreQuantity > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Quantity Selector */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  {/* Minus Button */}
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className={`p-2 flex items-center justify-center transition-colors duration-200 ${
                      quantity <= 1
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>

                  {/* Quantity Display */}
                  <div className="bg-white px-4 py-2 min-w-[3rem] flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-900">{quantity}</span>
                  </div>

                  {/* Plus Button */}
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= safeMaxQuantity}
                    className={`p-2 flex items-center justify-center transition-colors duration-200 ${
                      quantity >= safeMaxQuantity
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="bg-white border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 p-2 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-sm"
                >
                  <XMarkIcon className="w-4 h-4" />
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
