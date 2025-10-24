import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/outline';

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
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  
  // Limit to 10 products for display
  const MAX_DISPLAY_PRODUCTS = 10;
  const displayProducts = products.slice(0, MAX_DISPLAY_PRODUCTS);
  const hasMoreProducts = products.length > MAX_DISPLAY_PRODUCTS;


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
  }, [isOpen, displayProducts, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput && !searchInput.contains(event.target)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleProductClick = (product) => {
    // Use p_code or id for navigation
    const productId = product.p_code || product.id || product._id;
    if (productId) {
      navigate(`/product/${productId}?dept_id=${product.dept_id || '2'}&category_id=${product.category_id || '72'}&sub_category_id=${product.sub_category_id || '391'}`);
      onClose();
      if (onProductClick) onProductClick(product);
    }
  };

  // Format price to Indian Rupee
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[70vh] overflow-hidden"
      role="listbox"
      aria-label="Search results"
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
          <p className="text-lg font-medium text-gray-700 mb-1">No products found</p>
          <p className="text-sm text-gray-500">
            No products match "<span className="font-semibold">{searchTerm}</span>"
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Try searching with different keywords
          </p>
        </div>
      )}

      {/* Results List */}
      {!loading && products.length > 0 && (
        <>
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {hasMoreProducts ? (
                <>
                  Showing {MAX_DISPLAY_PRODUCTS} of {products.length} product{products.length !== 1 ? 's' : ''}
                  {searchTerm && (
                    <span className="text-primary-600"> for "{searchTerm}"</span>
                  )}
                </>
              ) : (
                <>
                  Found {products.length} product{products.length !== 1 ? 's' : ''}
                  {searchTerm && (
                    <span className="text-primary-600"> for "{searchTerm}"</span>
                  )}
                </>
              )}
            </p>
          </div>
          
          <div 
            ref={dropdownRef}
            className="overflow-y-auto max-h-[calc(70vh-120px)] overscroll-contain"
            style={{ scrollbarWidth: 'thin' }}
          >
            {displayProducts.map((product, index) => {
              const isSelected = index === selectedIndex;
              const productId = product.p_code || product.id || product._id;
              const productImage = product.pcode_img || product.image_url || '/images/logo.jpg';
              const productName = product.product_name || 'Unnamed Product';
              const brandName = product.brand_name || product.brand || '';
              const price = product.our_price || product.product_mrp || 0;
              const mrp = product.product_mrp || 0;
              const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

              return (
                <button
                  key={`${productId}-${index}`}
                  onClick={() => handleProductClick(product)}
                  className={`w-full flex items-center gap-4 px-4 py-3 transition-colors border-b border-gray-100 last:border-b-0 ${
                    isSelected 
                      ? 'bg-primary-50 border-l-4 border-l-primary-600' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/logo.jpg';
                      }}
                      loading="lazy"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate mb-1">
                      {productName}
                    </h3>
                    {brandName && (
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">
                        {brandName}
                      </p>
                    )}
                    {product.package_size && (
                      <p className="text-xs text-gray-400">
                        {product.package_size}
                      </p>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-baseline gap-2">
                      <p className="text-base sm:text-lg font-bold text-primary-600">
                        {formatPrice(price)}
                      </p>
                      {discount > 0 && (
                        <span className="hidden sm:inline-block text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                    {mrp > price && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs sm:text-sm text-gray-400 line-through">
                          {formatPrice(mrp)}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* View All Button - Show if there are more products */}
          {hasMoreProducts && (
            <div className="border-t border-gray-200 p-3 bg-white">
              <button
                onClick={handleViewAllClick}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <span>View All {products.length} Results</span>
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Footer Hint */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Use <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑</kbd> 
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs ml-1">↓</kbd> to navigate, 
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs ml-1">Enter</kbd> to select, 
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs ml-1">Esc</kbd> to close
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchDropdown;

