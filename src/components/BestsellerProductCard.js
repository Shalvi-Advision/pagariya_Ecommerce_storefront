import React, { useState, useEffect } from 'react';
import { HeartIcon as HeartOutline, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useFavorite } from '../context/FavoriteContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { createCartItemFromProduct, isStoreEnabled, getStoreMessage } from '../utils/cartUtils';
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

const BestsellerProductCard = ({ product }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const { toggleFavorite, isFavorite: checkFavorite } = useFavorite();
  const { addItem, updateQuantity, items: cartItems } = useCart();
  const { showError } = useToast();

  // Check store status on mount and when location changes
  useEffect(() => {
    const checkStoreStatus = () => {
      setStoreEnabled(isStoreEnabled());
    };
    
    checkStoreStatus();
    
    // Listen for location updates
    window.addEventListener('locationUpdated', checkStoreStatus);
    
    return () => {
      window.removeEventListener('locationUpdated', checkStoreStatus);
    };
  }, []);

  // Extract product data with safe defaults
  const {
    id,
    p_code,
    product_name,
    image_url,
    pcode_img,
    product_mrp,
    our_price,
    discount_percentage,
    package_size,
    package_unit,
    brand_name
  } = product || {};

  const productId = p_code || id || 'unknown';
  const displayName = product_name || 'Product';
  const displayImage = image_url || pcode_img || '/images/logo.jpg';
  const displayMrp = product_mrp || 0;
  const displayPrice = our_price || 0;
  const discount = discount_percentage || 0;
  const maxQuantity = product?.max_quantity_allowed || 10;

  // Sync quantity selector state with cart items
  useEffect(() => {
    const cartItem = cartItems.find(item => (item.p_code || item.id) === productId);
    if (cartItem) {
      setShowQuantitySelector(true);
      setQuantity(cartItem.quantity);
    } else {
      setShowQuantitySelector(false);
      setQuantity(1);
    }
  }, [cartItems, productId]);
  // Format weight with decimal (e.g., "25.0 GM", "500.0 GM")
  const weight = package_size && package_unit 
    ? `${parseFloat(package_size).toFixed(1)} ${package_unit.toUpperCase()}` 
    : '1.0 UNIT';

  // Calculate discount percentage if not provided
  const calculatedDiscount = discount > 0 
    ? discount 
    : displayMrp > 0 && displayPrice < displayMrp
      ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
      : 0;

  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toggleFavorite({
      ...product,
      p_code: productId,
      _id: productId,
      product_name: displayName,
      our_price: displayPrice,
      image_url: displayImage,
      pcode_img: displayImage,
      brand_name: brand_name || '',
      package_size: package_size || '',
      package_unit: package_unit || '',
      product_mrp: displayMrp,
      discount_percentage: calculatedDiscount
    });
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if store is enabled
    if (!storeEnabled) {
      const storeMessage = getStoreMessage();
      showError(storeMessage || 'This store is currently not accepting online orders. Please try again later.');
      return;
    }
    
    try {
      setAddingToCart(true);
      
      // Create cart item from product
      const cartItem = createCartItemFromProduct(product, 1);
      
      // Add to cart using context
      await addItem(cartItem, 1);
      
      // Show quantity selector after adding to cart
      setShowQuantitySelector(true);
      setQuantity(1);
      
      // Success - no toast message (same as CategoryPage)
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.code === 'STORE_DISABLED') {
        showError(error.message);
      } else {
        showError('Failed to add item to cart. Please try again.');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  // Handle quantity change
  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
      
      try {
        // Update cart with exact quantity (not adding to existing)
        updateQuantity(productId, newQuantity);
      } catch (error) {
        console.error('Error updating cart quantity:', error);
        showError('Failed to update quantity');
      }
    }
  };

  const favoriteStatus = checkFavorite(productId) || isFavorite;

  return (
    <div 
      className="rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col w-[180px] sm:w-[200px] flex-shrink-0"
      style={{ backgroundColor: COLORS.white }}
    >
      {/* Product Image Container */}
      <div className="relative flex items-center justify-center p-3 pt-4" style={{ backgroundColor: COLORS.white }}>
        {/* Favorite Icon - Top Left */}
        <button
          onClick={handleFavoriteToggle}
          className="absolute top-2 left-2 z-20 p-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
          style={{
            backgroundColor: hexToRgba(COLORS.white, 0.9)
          }}
        >
          {favoriteStatus ? (
            <HeartSolid className="w-4 h-4" style={{ color: COLORS.error[500] }} />
          ) : (
            <HeartOutline 
              className="w-4 h-4 transition-colors" 
              style={{ color: COLORS.gray[400] }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.error[500];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.gray[400];
              }}
            />
          )}
        </button>

        {/* Discount Badge - Top Right */}
        {calculatedDiscount > 0 && (
          <div 
            className="absolute top-2 right-2 z-20 text-white text-xs px-2.5 py-1 rounded font-bold shadow-md"
            style={{ backgroundColor: COLORS.warning[500] }}
          >
            {calculatedDiscount}% OFF
          </div>
        )}

        {/* Product Image */}
        <div className="w-full flex flex-col items-center">
          <img
            src={displayImage}
            alt={displayName}
            className="w-24 h-24 object-contain mb-2"
            onError={(e) => {
              e.target.src = '/images/logo.jpg';
            }}
          />
          {/* Placeholder for prepared dish image - can be added later */}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 flex-grow flex flex-col">
        {/* Product Name */}
        <h3 className="text-xs mb-1 line-clamp-2 min-h-[2rem] font-medium" style={{ color: COLORS.gray[900] }}>
          {displayName}
        </h3>

        {/* Weight */}
        <p className="text-xs mb-2" style={{ color: COLORS.gray[600] }}>
          {weight}
        </p>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold" style={{ color: COLORS.gray[900] }}>₹{displayPrice}</span>
            {displayMrp > displayPrice && (
              <span className="text-xs line-through" style={{ color: COLORS.gray[400] }}>₹{displayMrp}</span>
            )}
          </div>
        </div>

        {/* Add to Cart Button or Quantity Selector */}
        <div className="w-full mt-auto" style={{ minHeight: '36px' }}>
          {!showQuantitySelector ? (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !storeEnabled}
              title={!storeEnabled ? (getStoreMessage() || 'Store is not accepting orders') : 'Add to cart'}
              className="w-full h-9 rounded text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 text-white shadow-md hover:shadow-lg"
              style={{
                background: (addingToCart || !storeEnabled)
                  ? COLORS.gray[400]
                  : `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                cursor: (addingToCart || !storeEnabled) ? 'not-allowed' : 'pointer',
                opacity: (addingToCart || !storeEnabled) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!addingToCart && storeEnabled) {
                  e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[700]}, ${COLORS.success[700]})`;
                }
              }}
              onMouseLeave={(e) => {
                if (!addingToCart && storeEnabled) {
                  e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                }
              }}
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ADDING...</span>
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="w-4 h-4" />
                  <span>{!storeEnabled ? 'UNAVAILABLE' : 'ADD'}</span>
                </>
              )}
            </button>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              {/* Quantity Selector */}
              <div 
                className="flex items-stretch border-2 rounded-lg overflow-hidden shadow-md w-full transition-all duration-200 h-9"
                style={{
                  background: `linear-gradient(to right, ${COLORS.primary[50]}, ${COLORS.success[50]})`,
                  borderColor: COLORS.primary[200]
                }}
              >
                {/* Minus Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(quantity - 1);
                  }}
                  disabled={quantity <= 1}
                  className="flex items-center justify-center px-2 sm:px-3 transition-all duration-200 h-full"
                  style={{
                    backgroundColor: quantity <= 1
                      ? COLORS.gray[200]
                      : `linear-gradient(to bottom right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                    color: quantity <= 1
                      ? COLORS.gray[400]
                      : COLORS.white,
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (quantity > 1) {
                      e.currentTarget.style.background = `linear-gradient(to bottom right, ${COLORS.primary[700]}, ${COLORS.success[700]})`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (quantity > 1) {
                      e.currentTarget.style.background = `linear-gradient(to bottom right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                    }
                  }}
                >
                  <MinusIcon className="w-4 h-4 font-bold" strokeWidth={3} />
                </button>

                {/* Quantity Display */}
                <div 
                  className="bg-white px-2 sm:px-4 flex-1 flex items-center justify-center border-x-2 h-full"
                  style={{
                    borderColor: COLORS.primary[200]
                  }}
                >
                  <span className="text-sm sm:text-base font-bold" style={{ color: COLORS.primary[700] }}>
                    {quantity}
                  </span>
                </div>

                {/* Plus Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(quantity + 1);
                  }}
                  disabled={quantity >= maxQuantity}
                  className="flex items-center justify-center px-2 sm:px-3 transition-all duration-200 h-full"
                  style={{
                    backgroundColor: quantity >= maxQuantity
                      ? COLORS.gray[200]
                      : `linear-gradient(to bottom right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                    color: quantity >= maxQuantity
                      ? COLORS.gray[400]
                      : COLORS.white,
                    cursor: quantity >= maxQuantity ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (quantity < maxQuantity) {
                      e.currentTarget.style.background = `linear-gradient(to bottom right, ${COLORS.primary[700]}, ${COLORS.success[700]})`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (quantity < maxQuantity) {
                      e.currentTarget.style.background = `linear-gradient(to bottom right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                    }
                  }}
                >
                  <PlusIcon className="w-4 h-4 font-bold" strokeWidth={3} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestsellerProductCard;

