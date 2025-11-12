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
} from '@heroicons/react/24/outline';
import { useFavorite } from '../context/FavoriteContext';

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


  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm font-medium"
              aria-label="About Us"
            >
              <InformationCircleIcon className="w-4 h-4 text-primary-600" />
              <span>About Us</span>
            </Link>
            {/* Mobile About Us Icon */}
            <Link
              to="/about"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
              aria-label="About Us"
              title="About Us"
            >
              <InformationCircleIcon className="w-5 h-5 text-primary-600" />
            </Link>
            {/* Desktop Location Button */}
            <div className="hidden lg:block">
              <button 
                onClick={openPincodeModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:border-primary-300 transition-colors"
              >
                <MapPinIcon className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium">
                  {isLocationSet ? getLocationDisplayText() : 'Select Location'}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                {isLocationSet && getStoreDisplayText() && (
                  <span className="ml-1 text-gray-500 text-xs">
                    {getStoreDisplayText()}
                  </span>
                )}
              </button>
            </div>
          </div>

         

          {/* Search - Responsive with Dropdown */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl lg:max-w-4xl w-full mx-2 sm:mx-4 relative">
            <div className="flex">
              <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded-l-lg px-2 sm:px-3 focus-within:ring-2 focus-within:ring-primary-500 bg-white">
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  placeholder="Search for products..."
                  className="w-full py-2 outline-none text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                  autoComplete="off"
                  aria-label="Search products"
                  aria-autocomplete="list"
                  aria-controls="search-results"
                  aria-expanded={showSearchDropdown}
                />
                {isSearching && (
                  <div className="flex-shrink-0">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-4 py-2 rounded-r-lg font-medium text-xs sm:text-sm transition-colors"
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
                <div className="hidden lg:block relative account-dropdown-container">
                  <button
                    onClick={handleAccountDropdownToggle}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-700 text-sm font-medium p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Hello {user?.name || 'User'}</div>
                      <div className="font-semibold">My Account</div>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Account Dropdown Menu */}
                  {isAccountDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* Account Details Section */}
                      <div className="px-4 py-2">
                        <div className="text-xs text-gray-500 font-medium mb-2">Account Details</div>
                        <button
                          onClick={() => handleAccountMenuClick('profile')}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handleAccountMenuClick('address')}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                           Address
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Lists and Orders Section */}
                      <div className="px-4 py-2">
                        <button
                          onClick={() => handleAccountMenuClick('orders')}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Ready List
                        </button>
                        <button
                          onClick={() => handleAccountMenuClick('orders')}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Orders
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>
                      
                      {/* About Us Section */}
                      <div className="px-4 py-2">
                        <Link
                          to="/about"
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
                          onClick={() => setIsAccountDropdownOpen(false)}
                        >
                          <InformationCircleIcon className="w-4 h-4 text-gray-500" />
                          About Us
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Logout Section */}
                      <div className="px-4 py-2">
                        <button
                          onClick={() => handleAccountMenuClick('logout')}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
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
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/register" className="text-gray-700 hover:text-primary-700 text-sm font-medium">
                    <span>Register</span>
                  </Link>
                  <Link to="/login" className="text-gray-700 hover:text-primary-700 text-sm font-medium">
                    <span>Login</span>
                  </Link>
                </div>
              </>
            )}

            {/* Mobile/Tablet Location Button */}
            <div className="lg:hidden">
              <button
                onClick={openPincodeModal}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 text-gray-700 hover:border-primary-300 transition-colors"
              >
                <MapPinIcon className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-medium hidden sm:inline">
                  {isLocationSet ? getLocationDisplayText() : 'Location'}
                </span>
                <span className="text-xs font-medium sm:hidden">
                  {isLocationSet ? 'Set' : 'Loc'}
                </span>
              </button>
            </div>

            {/* Mobile/Tablet User Menu */}
            <div className="lg:hidden relative user-menu-container">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="inline-flex p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="User menu"
              >
                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              </button>

              {/* Mobile User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-w-[calc(100vw-2rem)]">
                  {isAuthenticated ? (
                    // Authenticated mobile menu
                    <>
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs text-gray-500">Hello {user?.name || 'User'}</p>
                        <p className="text-sm font-semibold text-gray-900">My Account</p>
                      </div>
                      
                      {/* Account Details Section */}
                      <div className="px-4 py-2">
                        <div className="text-xs text-gray-500 font-medium mb-2">Account Details</div>
                        <button
                          onClick={() => {
                            handleAccountMenuClick('profile');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          My Profile
                        </button>
                        <button
                          onClick={() => {
                            handleAccountMenuClick('address');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          My Address
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Lists and Orders Section */}
                      <div className="px-4 py-2">
                        <button
                          onClick={() => {
                            handleAccountMenuClick('orders');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Ready List
                        </button>
                        <button
                          onClick={() => {
                            handleAccountMenuClick('orders');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          My Orders
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>
                      
                      {/* About Us Section */}
                      <div className="px-4 py-2">
                        <Link
                          to="/about"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
                        >
                          <InformationCircleIcon className="w-4 h-4 text-gray-500" />
                          About Us
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Logout Section */}
                      <div className="px-4 py-2">
                        <button
                          onClick={() => {
                            handleAccountMenuClick('logout');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    // Unauthenticated mobile menu
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        Register
                      </Link>
                      <Link
                        to="/about"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center gap-2"
                      >
                        <InformationCircleIcon className="w-4 h-4 text-gray-500" />
                        About Us
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Favorites Icon */}
            <Link
              to="/favorites"
              className="relative inline-flex p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <button 
              onClick={openDrawer}
              className="relative inline-flex p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <ShoppingCartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 h-10 sm:h-12 overflow-x-auto scrollbar-hide">
            <button
              className="inline-flex items-center gap-1 sm:gap-2 text-gray-800 hover:text-primary-700 font-medium whitespace-nowrap text-xs sm:text-sm flex-shrink-0 px-2 py-1 rounded-md hover:bg-gray-50"
              onClick={handleAllCategoriesClick}
            >
              <Bars3Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">All Categories</span>
              <span className="sm:hidden">All</span>
            </button>
            {categories.slice(1).map((cat) => (
              <button
                key={cat}
                onClick={() => goToCategory(cat)}
                className={`text-xs sm:text-sm whitespace-nowrap pb-0.5 border-b-2 transition-colors font-medium flex-shrink-0 px-2 py-1 rounded-md hover:bg-gray-50 ${
                  (currentCategory === cat.toLowerCase().replace(/\s+/g, '-')) || (currentCategory === 'all' && cat === 'all')
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-700 hover:text-primary-700'
                }`}
              >
                {cat === 'all' ? 'All' : cat.replace(/\s+/g, ' ')}
              </button>
            ))}
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
