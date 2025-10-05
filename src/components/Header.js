import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import { usePincode } from '../context/PincodeContext';
import { useResponsive } from '../hooks/useResponsive';
import Button from './Button';
import CategoriesDrawer from './CategoriesDrawer';
import { fetchCategories } from '../api/productsApi';
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
          // Fallback to hardcoded departments (same as CategoriesDrawer fallback)
          const fallbackDepartments = [
            'all',
            'GROCERY & STAPLES',
            'FRUITS & VEGETABLES',
            'DAIRY & BEVERAGES',
            'PACKAGED FOOD',
            'PERSONAL CARE',
            'HOME & KITCHEN',
            'CLEANING SUPPLIES',
            'BABY CARE',
            'PET CARE',
            'HEALTH & WELLNESS',
            'HOUSEHOLD ITEMS',
            'STATIONERY & OFFICE',
            'AUTOMOTIVE',
            'ELECTRONICS',
            'FASHION & CLOTHING',
            'HOME FURNISHING',
            'BOOKS & MEDIA',
            'SPORTS & FITNESS',
            'GARDEN & OUTDOOR',
            'TOYS & GAMES',
            'JEWELRY & WATCHES'
          ];
          setDepartments(fallbackDepartments);
          setCategories(fallbackDepartments); // Keep categories for backward compatibility
        }
      } catch (e) {
        console.error('Error loading departments:', e);
        // Fallback to hardcoded departments
        const fallbackDepartments = [
          'all',
          'GROCERY & STAPLES',
          'FRUITS & VEGETABLES',
          'DAIRY & BEVERAGES',
          'PACKAGED FOOD',
          'PERSONAL CARE',
          'HOME & KITCHEN',
          'CLEANING SUPPLIES',
          'BABY CARE',
          'PET CARE',
          'HEALTH & WELLNESS',
          'HOUSEHOLD ITEMS',
          'STATIONERY & OFFICE',
          'AUTOMOTIVE',
          'ELECTRONICS',
          'FASHION & CLOTHING',
          'HOME FURNISHING',
          'BOOKS & MEDIA',
          'SPORTS & FITNESS',
          'GARDEN & OUTDOOR',
          'TOYS & GAMES',
          'JEWELRY & WATCHES'
        ];
        setDepartments(fallbackDepartments);
        setCategories(fallbackDepartments); // Keep categories for backward compatibility
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (search && search.trim()) params.q = search.trim();
    if (currentCategory && currentCategory !== 'all') params.category = currentCategory;
    setSearchParams(params);
    navigate({ pathname: '/', search: `?${new URLSearchParams(params).toString()}` });
  };

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
      case 'cards':
        navigate('/saved-cards');
        break;
      case 'orders':
        navigate('/orders');
        break;
      case 'saved-list':
        navigate('/saved-list');
        break;
      case 'subscribed-list':
        navigate('/subscribed-list');
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
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between py-3 ${isMobile ? 'gap-2' : 'gap-4'}`}>
          {/* Left: Logo + Location */}
          <div className={`flex items-center ${isMobile ? 'gap-2 min-w-[120px]' : isTablet ? 'gap-3 min-w-[160px]' : 'gap-4 min-w-[200px]'}`}>
            <Link to="/" className={`${isMobile ? 'text-xl' : 'text-2xl'} font-extrabold text-primary-600 tracking-tight`}>
              E-Shop
            </Link>
            {isDesktop && (
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
            )}
          </div>

          {/* Middle: Delivery info (on desktop+) */}
          {isDesktop && (
            <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-primary-500 inline-block"></span>
              <span>
                Earliest <span className="text-primary-600 font-medium">Home Delivery</span> available
              </span>
            </div>
          )}

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-4xl w-full">
            <div className="flex">
              <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded-l-lg px-3 focus-within:ring-2 focus-within:ring-primary-500">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for products"
                  className="w-full py-2 outline-none text-gray-800 placeholder-gray-400"
                />
              </div>
              <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-r-lg font-medium">
                SEARCH
              </button>
            </div>
          </form>

          {/* Right: Actions */}
          <div className={`flex items-center gap-2 justify-end ${isMobile ? 'min-w-[80px]' : isTablet ? 'min-w-[120px]' : 'min-w-[180px]'}`}>
            {/* Desktop Auth Links */}
            {isAuthenticated ? (
              // Authenticated user actions
              <>
                {isDesktop && (
                  <div className="relative account-dropdown-container">
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
                            My Profile
                          </button>
                          <button
                            onClick={() => handleAccountMenuClick('address')}
                            className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            My Address
                          </button>
                          <button
                            onClick={() => handleAccountMenuClick('cards')}
                            className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            My Saved Cards
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
                            My Orders
                          </button>
                          <button
                            onClick={() => handleAccountMenuClick('saved-list')}
                            className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            My Saved List
                          </button>
                          <button
                            onClick={() => handleAccountMenuClick('subscribed-list')}
                            className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            My Subscribed List
                          </button>
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
                )}
                {isMobile && (
                  <button className="inline-flex p-2 rounded-full hover:bg-gray-100">
                    <BellIcon className="w-6 h-6 text-primary-600" />
                  </button>
                )}
              </>
            ) : (
              // Unauthenticated user actions
              <>
                {isDesktop && (
                  <div className="flex items-center gap-2">
                    <Link to="/register" className="text-gray-700 hover:text-primary-700 text-sm font-medium">
                      <span>Register</span>
                    </Link>
                    <Link to="/login" className="text-gray-700 hover:text-primary-700 text-sm font-medium">
                      <span>Login</span>
                    </Link>
                  </div>
                )}
                {isMobile && (
                  <button className="inline-flex p-2 rounded-full hover:bg-gray-100">
                    <BellIcon className="w-6 h-6 text-primary-600" />
                  </button>
                )}
              </>
            )}

            {/* Mobile Location Button */}
            {(isMobile || isTablet) && (
              <button
                onClick={openPincodeModal}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 text-gray-700 hover:border-primary-300 transition-colors"
              >
                <MapPinIcon className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-medium">
                  {isLocationSet ? getLocationDisplayText() : 'Location'}
                </span>
              </button>
            )}

            {/* Mobile/Tablet User Menu */}
            {(isMobile || isTablet) && (
              <div className="relative user-menu-container">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="inline-flex p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="User menu"
              >
                <UserIcon className="w-6 h-6 text-primary-600" />
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
                        <button
                          onClick={() => {
                            handleAccountMenuClick('cards');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          My Saved Cards
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
                        <button
                          onClick={() => {
                            handleAccountMenuClick('saved-list');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          My Saved List
                        </button>
                        <button
                          onClick={() => {
                            handleAccountMenuClick('subscribed-list');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          My Subscribed List
                        </button>
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
                    </>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Favorites Icon */}
            <Link
              to="/favorites"
              className="relative inline-flex p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <HeartIcon className="w-6 h-6 text-primary-600" />
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
              <ShoppingCartIcon className="w-6 h-6 text-primary-600" />
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
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 h-12 overflow-x-auto">
            <button
              className="inline-flex items-center gap-1 sm:gap-2 text-gray-800 hover:text-primary-700 font-medium whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
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
                className={`text-xs sm:text-sm whitespace-nowrap pb-0.5 border-b-2 transition-colors font-medium flex-shrink-0 ${
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
