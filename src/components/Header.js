import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import { usePincode } from '../context/PincodeContext';
import { useResponsive } from '../hooks/useResponsive';
import Button from './Button';
import CategoriesDrawer from './CategoriesDrawer';
import SearchDropdown from './SearchDropdown';
import { fetchCategories, searchProductsAPI } from '../api/productsApi';
import { getActiveDepartments } from '../services/groceryApi';
import { clearMerchandisingCache } from '../api/merchandisingApi';
import pwaUtils from '../utils/pwa';
import {
  MapPinIcon,
  BellIcon,
  ShoppingCartIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserIcon,
  HeartIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useFavorite } from '../context/FavoriteContext';
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

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const { openDrawer } = useCartDrawer();
  const { favorites } = useFavorite();
  const { 
    isLocationSet, 
    getLocationDisplayText, 
    getStoreDisplayText, 
    openPincodeModal 
  } = usePincode();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local UI state
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const currentCategory = useMemo(() => searchParams.get('category') || 'all', [searchParams]);

  // Search dropdown state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Cache clearing state
  const [isClearingCache, setIsClearingCache] = useState(false);


  useEffect(() => {
    // Load departments for the category bar (same as CategoriesDrawer)
    const loadDepartments = async () => {
      try {
        const response = await getActiveDepartments();
        
        if (response.success && response.data && response.data.length > 0) {
          // Use API departments
          const departmentNames = response.data.map(dept => dept.department_name);
          setDepartments(['all', ...departmentNames]);
          setCategories(['all', ...departmentNames]); // Keep categories for backward compatibility
        } else {
          // No departments available
          setDepartments(['all']);
          setCategories(['all']);
        }
      } catch (e) {
        console.error('Error loading departments:', e);
        // Set empty departments
        setDepartments(['all']);
        setCategories(['all']);
      }
    };

    loadDepartments();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown-container')) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isAccountDropdownOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Debounced search function
  const performSearch = useCallback(async (searchTerm) => {
    // Require at least 2 characters for search
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await searchProductsAPI(searchTerm);
      
      if (response.success && response.data && response.data.length > 0) {
        // Only show dropdown if we have actual results
        setSearchResults(response.data);
        setShowSearchDropdown(true);
      } else {
        // Show "no results" state only if search was attempted
        setSearchResults([]);
        setShowSearchDropdown(searchTerm.trim().length >= 2);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      // Don't show dropdown on error
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if we have at least 2 characters
    if (value.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 400); // 400ms debounce
    } else {
      // Clear results and hide dropdown for short searches
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    // Only show dropdown if we have a valid search term (2+ chars) and results
    if (search.trim().length >= 2 && searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  // Close search dropdown
  const closeSearchDropdown = () => {
    setShowSearchDropdown(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Only process if we have a valid search term
    if (!search || search.trim().length < 2) {
      return;
    }
    
    // If there are search results and dropdown is open, navigate to first result
    if (searchResults.length > 0 && showSearchDropdown) {
      const firstProduct = searchResults[0];
      const productId = firstProduct.p_code || firstProduct.id || firstProduct._id;
      if (productId) {
        navigate(`/product/${productId}?dept_id=${firstProduct.dept_id || '2'}&category_id=${firstProduct.category_id || '72'}&sub_category_id=${firstProduct.sub_category_id || '391'}`);
        setShowSearchDropdown(false);
        setSearch(''); // Clear search after navigation
        return;
      }
    }
    
    // If no results in dropdown but have valid search term, 
    // perform traditional search navigation with the search term
    if (search.trim().length >= 2) {
      const params = {};
      params.q = search.trim();
      if (currentCategory && currentCategory !== 'all') params.category = currentCategory;
      setSearchParams(params);
      navigate({ pathname: '/', search: `?${new URLSearchParams(params).toString()}` });
      setShowSearchDropdown(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const goToCategory = (cat) => {
    if (cat && cat !== 'all') {
      // Convert department name to category slug format and navigate to category page
      const categorySlug = cat.toLowerCase().replace(/\s+/g, '-');
      navigate(`/category/${categorySlug}`);
    } else {
      // Navigate to home page for 'all' categories
      const params = {};
      if (search && search.trim()) params.q = search.trim();
      setSearchParams(params);
      navigate({ pathname: '/', search: `?${new URLSearchParams(params).toString()}` });
    }
    setIsDrawerOpen(false); // Close drawer when navigating
  };

  const handleAllCategoriesClick = () => {
    setIsDrawerOpen(true);
  };

  const handleAccountDropdownToggle = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const handleAccountMenuClick = (action) => {
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'address':
        navigate('/address');
        break;

      case 'orders':
        navigate('/orders');
        break;

      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
    setIsAccountDropdownOpen(false);
  };

  const handleClearCache = async () => {
    if (isClearingCache) return;

    setIsClearingCache(true);

    try {
      // Clear IndexedDB merchandising cache
      const indexedDBResult = await clearMerchandisingCache();

      // Clear Service Worker cache
      const swResult = await pwaUtils.clearAllCaches();

      if (indexedDBResult.success || swResult) {
        alert('✅ Cache cleared successfully! The page will reload to fetch fresh data.');
        // Reload page to fetch fresh data
        window.location.reload();
      } else {
        alert('⚠️ Cache clearing completed with some issues. Try refreshing the page manually.');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('❌ Failed to clear cache. Please try again or clear your browser cache manually.');
    } finally {
      setIsClearingCache(false);
    }
  };


  return (
    <header 
      className="sticky top-0 z-50"
      style={{
        backgroundColor: COLORS.white,
        borderBottom: `1px solid ${COLORS.gray[200]}`
      }}
    >
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Top Row: Logo, Location, Profile */}
        <div className="w-full px-1 sm:px-2">
          <div className="flex items-center gap-1.5 py-2">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src={`${process.env.PUBLIC_URL}/images/Main_Logo.jpg`}
                alt="Pagariya Mart"
                className="h-10 w-auto object-contain"
                style={{
                  maxHeight: '50px',
                  maxWidth: '150px',
                  display: 'block'
                }}
                onLoad={() => {
                  console.log('🖼️ Main Logo loaded successfully');
                }}
                onError={() => {
                  console.log('❌ Main Logo failed to load');
                }}
              />
            </Link>

            {/* Location */}
            <button
              onClick={openPincodeModal}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors flex-1 min-w-0"
              style={{
                borderColor: COLORS.gray[200],
                color: COLORS.gray[700]
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary[300];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.gray[200];
              }}
            >
              <MapPinIcon style={{ color: COLORS.primary[600] }} className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-medium truncate min-w-0">
                {isLocationSet ? (
                  <>
                    {getLocationDisplayText()}
                    {getStoreDisplayText() && ` • ${getStoreDisplayText()}`}
                  </>
                ) : (
                  'Set Location'
                )}
              </span>
            </button>

            {/* Profile Icon */}
            <div className="relative user-menu-container flex-shrink-0">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="inline-flex p-2 rounded-full focus:outline-none transition-colors"
                style={{
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[100];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label="User menu"
              >
                <UserIcon style={{ color: COLORS.primary[600] }} className="w-5 h-5" />
              </button>

              {/* Mobile User Dropdown Menu */}
              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg border py-2 z-50 max-w-[calc(100vw-2rem)]"
                  style={{
                    backgroundColor: COLORS.white,
                    borderColor: COLORS.primary[200],
                    boxShadow: `0 10px 15px ${hexToRgba(COLORS.primary[900], 0.1)}`
                  }}
                >
                  {isAuthenticated ? (
                    // Authenticated mobile menu
                    <>
                      <div className="px-4 py-2 border-b" style={{ borderColor: COLORS.primary[200] }}>
                        <p className="text-xs" style={{ color: COLORS.primary[600] }}>Hello {user?.name || 'User'}</p>
                        <p className="text-sm font-semibold" style={{ color: COLORS.primary[700] }}>My Account</p>
                      </div>
                      
                      {/* Account Details Section */}
                      <div className="px-4 py-2">
                        <div className="text-xs font-medium mb-2" style={{ color: COLORS.primary[700] }}>Account Details</div>
                        <button
                          onClick={() => {
                            handleAccountMenuClick('profile');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                          style={{ color: COLORS.gray[700] }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.primary[50];
                            e.currentTarget.style.color = COLORS.primary[700];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = COLORS.gray[700];
                          }}
                        >
                          My Profile
                        </button>
                        <button
                          onClick={() => {
                            handleAccountMenuClick('address');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                          style={{ color: COLORS.gray[700] }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.primary[50];
                            e.currentTarget.style.color = COLORS.primary[700];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = COLORS.gray[700];
                          }}
                        >
                          My Address
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t my-2" style={{ borderColor: COLORS.primary[200] }}></div>

                      {/* Lists and Orders Section */}
                      <div className="px-4 py-2">
                        <button
                          onClick={() => {
                            handleAccountMenuClick('orders');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                          style={{ color: COLORS.gray[700] }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.primary[50];
                            e.currentTarget.style.color = COLORS.primary[700];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = COLORS.gray[700];
                          }}
                        >
                          Ready List
                        </button>
                        <button
                          onClick={() => {
                            handleAccountMenuClick('orders');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                          style={{ color: COLORS.gray[700] }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.primary[50];
                            e.currentTarget.style.color = COLORS.primary[700];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = COLORS.gray[700];
                          }}
                        >
                          My Orders
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t my-2" style={{ borderColor: COLORS.primary[200] }}></div>
                      
                      {/* About Us Section */}
                      <div className="px-4 py-2">
                        <Link
                          to="/about"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors flex items-center gap-2"
                          style={{ color: COLORS.gray[700] }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.primary[50];
                            e.currentTarget.style.color = COLORS.primary[700];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = COLORS.gray[700];
                          }}
                        >
                          <InformationCircleIcon style={{ color: COLORS.primary[600] }} className="w-4 h-4" />
                          About Us
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="border-t my-2" style={{ borderColor: COLORS.primary[200] }}></div>

                      {/* Clear Cache Section */}
                      <div className="px-4 py-2">
                        <button
                          onClick={() => {
                            handleClearCache();
                            setIsUserMenuOpen(false);
                          }}
                          disabled={isClearingCache}
                          className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                          style={{ 
                            color: COLORS.gray[700],
                            opacity: isClearingCache ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!isClearingCache) {
                              e.currentTarget.style.backgroundColor = COLORS.primary[50];
                              e.currentTarget.style.color = COLORS.primary[700];
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = COLORS.gray[700];
                          }}
                        >
                          <ArrowPathIcon style={{ color: COLORS.primary[600] }} className={`w-4 h-4 ${isClearingCache ? 'animate-spin' : ''}`} />
                          {isClearingCache ? 'Clearing Cache...' : 'Clear Cache'}
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t my-2" style={{ borderColor: COLORS.primary[200] }}></div>

                      {/* Logout Section */}
                      <div className="px-4 py-2">
                        <button
                          onClick={() => {
                            handleAccountMenuClick('logout');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                          style={{ color: COLORS.gray[700] }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.primary[50];
                            e.currentTarget.style.color = COLORS.primary[700];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = COLORS.gray[700];
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    // Unauthenticated mobile menu - Show Login and Register
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm focus:outline-none transition-colors"
                        style={{ color: COLORS.gray[700] }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.primary[50];
                          e.currentTarget.style.color = COLORS.primary[700];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = COLORS.gray[700];
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.primary[50];
                          e.currentTarget.style.color = COLORS.primary[700];
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = COLORS.gray[700];
                        }}
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm focus:outline-none transition-colors"
                        style={{ color: COLORS.gray[700] }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.primary[50];
                          e.currentTarget.style.color = COLORS.primary[700];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = COLORS.gray[700];
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.primary[50];
                          e.currentTarget.style.color = COLORS.primary[700];
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = COLORS.gray[700];
                        }}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Search, About Us, Cart */}
        <div className="border-t" style={{ borderColor: COLORS.gray[200] }}>
          <div className="container mx-auto px-2 sm:px-4">
            <div className="flex items-center gap-2 py-2">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <div className="flex">
                  <div 
                    className="flex items-center gap-2 flex-1 border rounded-l-lg px-2 bg-white"
                    style={{
                      borderColor: COLORS.gray[300]
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <MagnifyingGlassIcon style={{ color: COLORS.gray[500] }} className="w-4 h-4 flex-shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={handleSearchChange}
                      onFocus={handleSearchFocus}
                      placeholder="Search..."
                      className="w-full py-1.5 outline-none text-sm"
                      style={{
                        color: COLORS.gray[800]
                      }}
                      autoComplete="off"
                      aria-label="Search products"
                      aria-autocomplete="list"
                      aria-controls="search-results"
                      aria-expanded={showSearchDropdown}
                    />
                    {isSearching && (
                      <div className="flex-shrink-0">
                        <div 
                          className="animate-spin rounded-full h-3 w-3 border-b-2"
                          style={{ borderColor: COLORS.primary[600] }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    className="text-white px-2 py-1.5 rounded-r-lg font-medium text-xs transition-colors"
                    style={{
                      backgroundColor: COLORS.primary[600]
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.primary[700];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.primary[600];
                    }}
                    aria-label="Search"
                  >
                    🔍
                  </button>
                </div>

                {/* Search Dropdown */}
                <SearchDropdown
                  isOpen={showSearchDropdown}
                  products={searchResults}
                  loading={isSearching}
                  searchTerm={search}
                  onClose={closeSearchDropdown}
                  onProductClick={() => setSearch('')}
                />
              </form>

              {/* About Us Icon */}
              <Link
                to="/about"
                className="inline-flex items-center justify-center p-2 rounded-lg border transition-colors flex-shrink-0"
                style={{
                  borderColor: COLORS.gray[200],
                  color: COLORS.gray[700]
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary[300];
                  e.currentTarget.style.color = COLORS.primary[600];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.gray[200];
                  e.currentTarget.style.color = COLORS.gray[700];
                }}
                aria-label="About Us"
                title="About Us"
              >
                <InformationCircleIcon style={{ color: COLORS.primary[600] }} className="w-5 h-5" />
              </Link>

              {/* Cart Icon */}
              <button 
                onClick={openDrawer}
                className="relative inline-flex p-2 rounded-lg focus:outline-none transition-colors flex-shrink-0"
                style={{ color: COLORS.gray[700] }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[100];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label="Shopping Cart"
              >
                <ShoppingCartIcon style={{ color: COLORS.primary[600] }} className="w-5 h-5" />
                {totalItems > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary[600] }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {/* Top bar */}
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between py-2 sm:py-3 gap-2 sm:gap-4">
            {/* Left: Logo + Location */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img
                  src={`${process.env.PUBLIC_URL}/images/Main_Logo.jpg`}
                  alt="Pagariya Mart"
                  className="h-10 sm:h-10 lg:h-14 w-auto object-contain"
                  style={{
                    maxHeight: '50px',
                    maxWidth: '250px',
                    display: 'block'
                  }}
                  onLoad={() => {
                    console.log('🖼️ Main Logo loaded successfully');
                  }}
                  onError={() => {
                    console.log('❌ Main Logo failed to load');
                  }}
                />
              </Link>
              {/* About Us Button */}
              <Link
                to="/about"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors text-sm font-medium"
                style={{
                  borderColor: COLORS.gray[200],
                  color: COLORS.gray[700]
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary[300];
                  e.currentTarget.style.color = COLORS.primary[600];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.gray[200];
                  e.currentTarget.style.color = COLORS.gray[700];
                }}
                aria-label="About Us"
              >
                <InformationCircleIcon style={{ color: COLORS.primary[600] }} className="w-4 h-4" />
                <span>About Us</span>
              </Link>
              {/* Desktop Location Button */}
              <div>
                <button 
                  onClick={openPincodeModal}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors"
                  style={{
                    borderColor: COLORS.gray[200],
                    color: COLORS.gray[700]
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary[300];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.gray[200];
                  }}
                >
                  <MapPinIcon style={{ color: COLORS.primary[600] }} className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {isLocationSet ? getLocationDisplayText() : 'Select Location'}
                  </span>
                  <ChevronDownIcon style={{ color: COLORS.gray[500] }} className="w-4 h-4" />
                  {isLocationSet && getStoreDisplayText() && (
                    <span className="ml-1 text-xs" style={{ color: COLORS.gray[500] }}>
                      {getStoreDisplayText()}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search - Responsive with Dropdown */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl lg:max-w-4xl w-full mx-2 sm:mx-4 relative">
              <div className="flex">
                <div 
                  className="flex items-center gap-2 flex-1 border rounded-l-lg px-2 sm:px-3 bg-white"
                  style={{
                    borderColor: COLORS.gray[300]
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <MagnifyingGlassIcon style={{ color: COLORS.gray[500] }} className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    placeholder="Search for products..."
                    className="w-full py-2 outline-none text-sm sm:text-base"
                    style={{
                      color: COLORS.gray[800]
                    }}
                    autoComplete="off"
                    aria-label="Search products"
                    aria-autocomplete="list"
                    aria-controls="search-results"
                    aria-expanded={showSearchDropdown}
                  />
                  {isSearching && (
                    <div className="flex-shrink-0">
                      <div 
                        className="animate-spin rounded-full h-4 w-4 border-b-2"
                        style={{ borderColor: COLORS.primary[600] }}
                      ></div>
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="text-white px-3 sm:px-4 py-2 rounded-r-lg font-medium text-xs sm:text-sm transition-colors"
                  style={{
                    backgroundColor: COLORS.primary[600]
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.primary[700];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.primary[600];
                  }}
                  aria-label="Search"
                >
                  <span className="hidden sm:inline">SEARCH</span>
                  <span className="sm:hidden">🔍</span>
                </button>
              </div>

              {/* Search Dropdown */}
              <SearchDropdown
                isOpen={showSearchDropdown}
                products={searchResults}
                loading={isSearching}
                searchTerm={search}
                onClose={closeSearchDropdown}
                onProductClick={() => setSearch('')}
              />
            </form>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2 justify-end min-w-0 flex-shrink-0">
              {/* Desktop Auth Links */}
              {isAuthenticated ? (
                // Authenticated user actions
                <>
                  <div className="relative account-dropdown-container">
                    <button
                      onClick={handleAccountDropdownToggle}
                      className="flex items-center gap-2 text-sm font-medium p-2 rounded-lg transition-colors"
                      style={{
                        color: COLORS.gray[700]
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.primary[700];
                        e.currentTarget.style.backgroundColor = COLORS.gray[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.gray[700];
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="text-right">
                        <div className="text-xs" style={{ color: COLORS.gray[500] }}>Hello {user?.name || 'User'}</div>
                        <div className="font-semibold">My Account</div>
                      </div>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Account Dropdown Menu */}
                    {isAccountDropdownOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg border py-2 z-50"
                        style={{
                          backgroundColor: COLORS.white,
                          borderColor: COLORS.primary[200],
                          boxShadow: `0 10px 15px ${hexToRgba(COLORS.primary[900], 0.1)}`
                        }}
                      >
                        {/* Account Details Section */}
                        <div className="px-4 py-2">
                          <div className="text-xs font-medium mb-2" style={{ color: COLORS.primary[700] }}>Account Details</div>
                          <button
                            onClick={() => handleAccountMenuClick('profile')}
                            className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                            style={{ color: COLORS.gray[700] }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = COLORS.primary[50];
                              e.currentTarget.style.color = COLORS.primary[700];
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = COLORS.gray[700];
                            }}
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => handleAccountMenuClick('address')}
                            className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                            style={{ color: COLORS.gray[700] }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = COLORS.primary[50];
                              e.currentTarget.style.color = COLORS.primary[700];
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = COLORS.gray[700];
                            }}
                          >
                             Address
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t my-2" style={{ borderColor: COLORS.primary[200] }}></div>

                        {/* Lists and Orders Section */}
                        <div className="px-4 py-2">
                          <button
                            onClick={() => handleAccountMenuClick('orders')}
                            className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                            style={{ color: COLORS.gray[700] }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = COLORS.primary[50];
                              e.currentTarget.style.color = COLORS.primary[700];
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = COLORS.gray[700];
                            }}
                          >
                            Ready List
                          </button>
                          <button
                            onClick={() => handleAccountMenuClick('orders')}
                            className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                            style={{ color: COLORS.gray[700] }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = COLORS.primary[50];
                              e.currentTarget.style.color = COLORS.primary[700];
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = COLORS.gray[700];
                            }}
                          >
                            Orders
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t my-2" style={{ borderColor: COLORS.primary[200] }}></div>
                        
                        {/* About Us Section */}
                        <div className="px-4 py-2">
                          <Link
                            to="/about"
                            className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors flex items-center gap-2"
                            style={{ color: COLORS.gray[700] }}
                            onClick={() => setIsAccountDropdownOpen(false)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = COLORS.primary[50];
                              e.currentTarget.style.color = COLORS.primary[700];
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = COLORS.gray[700];
                            }}
                          >
                            <InformationCircleIcon style={{ color: COLORS.primary[600] }} className="w-4 h-4" />
                              About Us
                          </Link>
                        </div>

                        {/* Divider */}
                        <div className="border-t my-2" style={{ borderColor: COLORS.primary[200] }}></div>

                        {/* Clear Cache Section */}
                        <div className="px-4 py-2">
                          <button
                            onClick={() => {
                              handleClearCache();
                              setIsAccountDropdownOpen(false);
                            }}
                            disabled={isClearingCache}
                            className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                            style={{ 
                              color: COLORS.gray[700],
                              opacity: isClearingCache ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!isClearingCache) {
                                e.currentTarget.style.backgroundColor = COLORS.primary[50];
                                e.currentTarget.style.color = COLORS.primary[700];
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = COLORS.gray[700];
                            }}
                          >
                            <ArrowPathIcon style={{ color: COLORS.primary[600] }} className={`w-4 h-4 ${isClearingCache ? 'animate-spin' : ''}`} />
                              {isClearingCache ? 'Clearing Cache...' : 'Clear Cache'}
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t my-2" style={{ borderColor: COLORS.primary[200] }}></div>

                        {/* Logout Section */}
                        <div className="px-4 py-2">
                          <button
                            onClick={() => handleAccountMenuClick('logout')}
                            className="w-full text-left px-2 py-2 text-sm rounded-md transition-colors"
                            style={{ color: COLORS.gray[700] }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = COLORS.primary[50];
                              e.currentTarget.style.color = COLORS.primary[700];
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = COLORS.gray[700];
                            }}
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Unauthenticated user actions
                <>
                  <div className="flex items-center gap-2">
                    <Link 
                      to="/register" 
                      className="text-sm font-medium transition-colors"
                      style={{ color: COLORS.gray[700] }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.primary[700];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.gray[700];
                      }}
                    >
                      <span>Register</span>
                    </Link>
                    <Link 
                      to="/login" 
                      className="text-sm font-medium transition-colors"
                      style={{ color: COLORS.gray[700] }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.primary[700];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.gray[700];
                      }}
                    >
                      <span>Login</span>
                    </Link>
                  </div>
                </>
              )}

              {/* Favorites Icon */}
              <Link
                to="/favorites"
                className="relative inline-flex p-2 rounded-full focus:outline-none transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[100];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <HeartIcon style={{ color: COLORS.primary[600] }} className="w-5 h-5 sm:w-6 sm:h-6" />
                {favorites.length > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary[600] }}
                  >
                    {favorites.length}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <button 
                onClick={openDrawer}
                className="relative inline-flex p-2 rounded-full focus:outline-none transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[100];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <ShoppingCartIcon style={{ color: COLORS.primary[600] }} className="w-5 h-5 sm:w-6 sm:h-6" />
                {totalItems > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary[600] }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div 
        className="border-t"
        style={{
          borderColor: COLORS.gray[200],
          backgroundColor: COLORS.white
        }}
      >
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 h-10 sm:h-12 overflow-x-auto scrollbar-hide">
            <button
              className="inline-flex items-center gap-1 sm:gap-2 font-medium whitespace-nowrap text-xs sm:text-sm flex-shrink-0 px-2 py-1 rounded-md transition-colors"
              style={{ color: COLORS.gray[800] }}
              onClick={handleAllCategoriesClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary[700];
                e.currentTarget.style.backgroundColor = COLORS.gray[50];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.gray[800];
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Bars3Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">All Categories</span>
              <span className="sm:hidden">All</span>
            </button>
            {categories.slice(1).map((cat) => {
              const isActive = (currentCategory === cat.toLowerCase().replace(/\s+/g, '-')) || (currentCategory === 'all' && cat === 'all');
              return (
                <button
                  key={cat}
                  onClick={() => goToCategory(cat)}
                  className="text-xs sm:text-sm whitespace-nowrap pb-0.5 border-b-2 transition-colors font-medium flex-shrink-0 px-2 py-1 rounded-md"
                  style={{
                    borderColor: isActive ? COLORS.primary[600] : 'transparent',
                    color: isActive ? COLORS.primary[700] : COLORS.gray[700]
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = COLORS.primary[700];
                      e.currentTarget.style.backgroundColor = COLORS.gray[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = COLORS.gray[700];
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {cat === 'all' ? 'All' : cat.replace(/\s+/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categories Drawer */}
      <CategoriesDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

    </header>
  );
};

export default Header;
