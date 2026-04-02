import React, { useEffect, useRef, useCallback } from 'react';
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

  // Handle product click - navigate to product details page
  const handleProductClick = useCallback((product) => {
    console.log('🖱️ handleProductClick called with product:', product);
    
    if (!product) {
      console.error('❌ No product provided to handleProductClick');
      return;
    }

    // Extract product ID - try multiple possible field names
    const productId = product.p_code || product.pcode || product.id || product._id;
    
    if (!productId) {
      console.error('❌ Product ID not found in product:', product);
      return;
    }

    // Extract category IDs - try multiple possible field names and provide defaults
    const deptId = product.dept_id || product.deptId || product.department_id || '2';
    const categoryId = product.category_id || product.categoryId || '72';
    const subCategoryId = product.sub_category_id || product.subCategoryId || product.subcategory_id || '391';

    // Build the product details URL with all required parameters
    const productUrl = `/product/${productId}?dept_id=${deptId}&category_id=${categoryId}&sub_category_id=${subCategoryId}`;
    
    console.log('🔍 Navigating to product:', {
      productId,
      deptId,
      categoryId,
      subCategoryId,
      url: productUrl,
      fullProduct: product
    });

    try {
      // Navigate to product details page
      navigate(productUrl);
      console.log('✅ Navigation triggered to:', productUrl);
      
      // Close the dropdown
      onClose();
      
      // Call the onProductClick callback if provided
      if (onProductClick) {
        onProductClick(product);
      }
    } catch (error) {
      console.error('❌ Error navigating to product:', error);
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
      // Don't close if clicking inside the dropdown
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      
      // Don't close if clicking on the search input
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput && searchInput.contains(event.target)) {
        return;
      }
      
      // Close the dropdown if clicking outside
      onClose();
    };

    if (isOpen) {
      // Use click event instead of mousedown to allow button clicks to process first
      // Add listener with a slight delay to ensure button clicks are processed first
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

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
      className="absolute left-0 right-0 sm:left-auto sm:right-auto sm:min-w-full top-full mt-2 bg-white rounded-lg sm:rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
      role="listbox"
      aria-label="Search results"
      style={{
        maxWidth: '100vw',
        width: '100%'
      }}
    >
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8 sm:py-8 px-4 sm:px-4">
          <div className="flex flex-col items-center gap-3 sm:gap-3">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-10 sm:w-10 border-b-2 border-primary-600"></div>
            <p className="text-sm sm:text-sm text-gray-600">Searching products...</p>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!loading && searchTerm && searchTerm.trim().length >= 2 && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 sm:py-8 px-4 sm:px-4">
          <XCircleIcon className="w-16 h-16 sm:w-16 sm:h-16 text-gray-300 mb-3 sm:mb-3" />
          <p className="text-lg sm:text-lg font-medium text-gray-700 mb-2">No products found</p>
          <p className="text-sm sm:text-sm text-gray-500 px-4 text-center">
            No products match "<span className="font-semibold">{searchTerm}</span>"
          </p>
          <p className="text-xs sm:text-xs text-gray-400 mt-3 text-center px-4">
            Try searching with different keywords
          </p>
        </div>
      )}

      {/* Results List */}
      {!loading && products.length > 0 && (
        <>
          <div className="px-4 sm:px-4 py-3 sm:py-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <p className="text-sm sm:text-sm font-medium text-gray-700">
              {hasMoreProducts ? (
                <>
                  <span className="hidden sm:inline">Showing </span>
                  <span className="sm:hidden">{MAX_DISPLAY_PRODUCTS} of </span>
                  {products.length} product{products.length !== 1 ? 's' : ''}
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
            className="overflow-y-auto max-h-[calc(85vh-180px)] sm:max-h-[calc(80vh-120px)] overscroll-contain"
            style={{ 
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {displayProducts.map((product, index) => {
              const isSelected = index === selectedIndex;
              const productId = product.p_code || product.id || product._id;
              const productImage = product.pcode_img || product.image_url || '/images/default_image.jpg';
              const productName = product.product_name || 'Unnamed Product';
              const price = product.our_price || product.product_mrp || 0;

              return (
                <button
                  key={`${productId}-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                  className={`w-full flex items-center gap-3 px-4 sm:px-4 py-3.5 sm:py-3 transition-colors border-b border-gray-100 last:border-b-0 active:bg-gray-100 ${
                    isSelected 
                      ? 'bg-primary-50 border-l-4 border-l-primary-600' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  type="button"
                  style={{
                    minHeight: '60px',
                    touchAction: 'manipulation'
                  }}
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/default_image.jpg';
                      }}
                      loading="lazy"
                    />
                  </div>

                  {/* Product Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 text-left">
                      {productName}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0">
                    <p className="text-base sm:text-lg font-bold text-primary-600 whitespace-nowrap">
                      {formatPrice(price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* View All Button - Show if there are more products */}
          {hasMoreProducts && (
            <div className="border-t border-gray-200 p-3 sm:p-3 bg-white sticky bottom-0 z-10">
              <button
                onClick={handleViewAllClick}
                className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3.5 sm:py-3 px-4 sm:px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:shadow-lg text-base sm:text-base"
                style={{
                  minHeight: '48px',
                  touchAction: 'manipulation'
                }}
              >
                <span className="truncate">View All {products.length} Results</span>
                <svg 
                  className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" 
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
          <div className="px-4 sm:px-4 py-2 sm:py-2 border-t border-gray-200 bg-gray-50 hidden sm:block">
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

