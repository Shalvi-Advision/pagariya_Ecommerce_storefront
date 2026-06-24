import React, { useEffect, useRef, useCallback, useState } from 'react';
import { DEFAULT_PRODUCT_IMAGE, onProductImageError } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { createCartItemFromProduct, isStoreEnabled, getStoreMessage } from '../utils/cartUtils';
import { COLORS } from '../constants/theme';

const SearchDropdown = ({
  isOpen,
  products,
  loading,
  searchTerm,
  onClose,
  onProductClick
}) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { addItem, updateQuantity, removeItem, items: cartItems } = useCart();
  const { showError } = useToast();

  // Limit to 10 products for display
  const MAX_DISPLAY_PRODUCTS = 10;
  const displayProducts = products.slice(0, MAX_DISPLAY_PRODUCTS);
  const hasMoreProducts = products.length > MAX_DISPLAY_PRODUCTS;

  // Get cart quantity for a product
  const getCartQuantity = useCallback((productId) => {
    const cartItem = cartItems.find(item => (item.p_code || item.id) === productId);
    return cartItem ? cartItem.quantity : 0;
  }, [cartItems]);

  // Handle add to cart
  const handleAddToCart = useCallback(async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isStoreEnabled()) {
      showError(getStoreMessage() || 'Store is not accepting orders');
      return;
    }

    try {
      const cartItem = createCartItemFromProduct(product, 1);
      await addItem(cartItem, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Failed to add item to cart');
    }
  }, [addItem, showError]);

  // Handle quantity change
  const handleQuantityChange = useCallback(async (e, productId, newQuantity) => {
    e.preventDefault();
    e.stopPropagation();

    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  }, [updateQuantity, removeItem]);

  // Handle product click - navigate to product details page
  const handleProductClick = useCallback((product) => {
    if (!product) return;

    const productId = product.p_code || product.pcode || product.id || product._id;
    if (!productId) return;

    const deptId = product.dept_id || product.deptId || product.department_id || '2';
    const categoryId = product.category_id || product.categoryId || '72';
    const subCategoryId = product.sub_category_id || product.subCategoryId || product.subcategory_id || '391';

    const productUrl = `/product/${productId}?dept_id=${deptId}&category_id=${categoryId}&sub_category_id=${subCategoryId}`;

    try {
      navigate(productUrl);
      onClose();
      if (onProductClick) onProductClick(product);
    } catch (error) {
      console.error('Error navigating to product:', error);
    }
  }, [navigate, onClose, onProductClick]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || !displayProducts.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < displayProducts.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && displayProducts[selectedIndex]) {
            handleProductClick(displayProducts[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, displayProducts, selectedIndex, onClose, handleProductClick]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Reset selected index when products change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [products]);

  // Handle "View All" button click
  const handleViewAllClick = () => {
    navigate(`/?q=${encodeURIComponent(searchTerm)}`);
    onClose();
    if (onProductClick) onProductClick(null);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) return;
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput && searchInput.contains(event.target)) return;
      onClose();
    };

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 right-0 sm:left-auto sm:right-auto sm:min-w-full top-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
      role="listbox"
      aria-label="Search results"
      style={{ maxWidth: '100vw', width: '100%' }}
    >
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8 px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            <p className="text-sm text-gray-600">Searching products...</p>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!loading && searchTerm && searchTerm.trim().length >= 2 && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <XCircleIcon className="w-16 h-16 text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-700 mb-2">No products found</p>
          <p className="text-sm text-gray-500 px-4 text-center">
            No products match "<span className="font-semibold">{searchTerm}</span>"
          </p>
          <p className="text-xs text-gray-400 mt-3 text-center px-4">
            Try searching with different keywords
          </p>
        </div>
      )}

      {/* Results List */}
      {!loading && products.length > 0 && (
        <>
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <p className="text-xs font-medium text-gray-600">
              {hasMoreProducts
                ? <>{MAX_DISPLAY_PRODUCTS} of {products.length} products{searchTerm && <span style={{ color: COLORS.primary[600] }}> for "{searchTerm}"</span>}</>
                : <>{products.length} product{products.length !== 1 ? 's' : ''}{searchTerm && <span style={{ color: COLORS.primary[600] }}> for "{searchTerm}"</span>}</>
              }
            </p>
          </div>

          <div
            ref={dropdownRef}
            className="overflow-y-auto max-h-[calc(85vh-150px)] sm:max-h-[calc(80vh-120px)] overscroll-contain"
            style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
          >
            {displayProducts.map((product, index) => {
              const isSelected = index === selectedIndex;
              const productId = product.p_code || product.id || product._id;
              const productImage = product.pcode_img || product.image_url || DEFAULT_PRODUCT_IMAGE;
              const productName = product.product_name || 'Unnamed Product';
              const price = product.our_price || product.product_mrp || 0;
              const cartQty = getCartQuantity(productId);

              return (
                <div
                  key={`${productId}-${index}`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 last:border-b-0 ${
                    isSelected ? 'bg-primary-50' : ''
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Clickable area: image + name + price */}
                  <div
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer active:opacity-70"
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full object-cover"
                        onError={(e) => { onProductImageError(e); }}
                        loading="lazy"
                      />
                    </div>

                    {/* Product Name */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium text-gray-900 line-clamp-2 text-left leading-tight">
                        {productName}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="flex-shrink-0">
                      <p className="text-sm font-bold whitespace-nowrap" style={{ color: COLORS.primary[600] }}>
                        {formatPrice(price)}
                      </p>
                    </div>
                  </div>

                  {/* Add to Cart / Quantity Controls */}
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {cartQty === 0 ? (
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-white transition-all active:scale-90"
                        style={{ backgroundColor: COLORS.primary[600] }}
                      >
                        <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    ) : (
                      <div
                        className="flex items-center rounded-lg overflow-hidden border"
                        style={{ borderColor: COLORS.primary[300] }}
                      >
                        <button
                          onClick={(e) => handleQuantityChange(e, productId, cartQty - 1)}
                          className="w-7 h-7 flex items-center justify-center text-white"
                          style={{ backgroundColor: COLORS.primary[600] }}
                        >
                          <MinusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        <span
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold bg-white"
                          style={{ color: COLORS.primary[700] }}
                        >
                          {cartQty}
                        </span>
                        <button
                          onClick={(e) => handleQuantityChange(e, productId, cartQty + 1)}
                          className="w-7 h-7 flex items-center justify-center text-white"
                          style={{ backgroundColor: COLORS.primary[600] }}
                        >
                          <PlusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Button */}
          {hasMoreProducts && (
            <div className="border-t border-gray-200 p-3 bg-white sticky bottom-0 z-10">
              <button
                onClick={handleViewAllClick}
                className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                style={{ backgroundColor: COLORS.primary[600], minHeight: '44px' }}
              >
                <span>View All {products.length} Results</span>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* Footer Hint - Desktop only */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 hidden sm:block">
            <p className="text-xs text-gray-500 text-center">
              Use <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑</kbd>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs ml-1">↓</kbd> to navigate,
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs ml-1">Enter</kbd> to select
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchDropdown;
