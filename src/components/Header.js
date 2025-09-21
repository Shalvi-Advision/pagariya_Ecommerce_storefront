import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import { useResponsive } from '../hooks/useResponsive';
import Button from './Button';
import CategoriesDrawer from './CategoriesDrawer';
import { fetchCategories } from '../api/productsApi';
import {
  MapPinIcon,
  BellIcon,
  ShoppingCartIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const { openDrawer } = useCartDrawer();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local UI state
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState({
    pincode: '400003',
    area: 'Mumbai',
    fullAddress: 'Mumbai, Maharashtra, India'
  });
  const currentCategory = useMemo(() => searchParams.get('category') || 'all', [searchParams]);

  // Recent searches data - using Mumbai locations
  const [recentSearches] = useState([
    {
      id: 1,
      pincode: '400407',
      area: 'Panvel',
      fullAddress: 'Panvel, Navi Mumbai, Maharashtra, India'
    },
    {
      id: 2,
      pincode: '400001',
      area: 'Fort',
      fullAddress: 'Fort, Mumbai, Maharashtra, India'
    },
    {
      id: 3,
      pincode: '400003',
      area: 'Marine Lines',
      fullAddress: 'Marine Lines, Mumbai, Maharashtra, India'
    },
    {
      id: 4,
      pincode: '400004',
      area: 'Bandra',
      fullAddress: 'Bandra, Mumbai, Maharashtra, India'
    },
    {
      id: 5,
      pincode: '400401',
      area: 'Vashi',
      fullAddress: 'Vashi, Navi Mumbai, Maharashtra, India'
    }
  ]);

  // Mock location search results
  const [locationSearchResults, setLocationSearchResults] = useState([]);

  // Comprehensive Mumbai pin codes and areas
  const mumbaiLocations = [
    // South Mumbai
    { id: 1, pincode: '400001', area: 'Fort', fullAddress: 'Fort, Mumbai, Maharashtra, India' },
    { id: 2, pincode: '400002', area: 'CST', fullAddress: 'Chhatrapati Shivaji Terminus, Mumbai, Maharashtra, India' },
    { id: 3, pincode: '400003', area: 'Marine Lines', fullAddress: 'Marine Lines, Mumbai, Maharashtra, India' },
    { id: 4, pincode: '400004', area: 'Bandra', fullAddress: 'Bandra, Mumbai, Maharashtra, India' },
    { id: 5, pincode: '400005', area: 'Worli', fullAddress: 'Worli, Mumbai, Maharashtra, India' },
    { id: 6, pincode: '400006', area: 'Parel', fullAddress: 'Parel, Mumbai, Maharashtra, India' },
    { id: 7, pincode: '400007', area: 'Byculla', fullAddress: 'Byculla, Mumbai, Maharashtra, India' },
    { id: 8, pincode: '400008', area: 'Mazgaon', fullAddress: 'Mazgaon, Mumbai, Maharashtra, India' },
    { id: 9, pincode: '400009', area: 'Dadar', fullAddress: 'Dadar, Mumbai, Maharashtra, India' },
    { id: 10, pincode: '400010', area: 'Matunga', fullAddress: 'Matunga, Mumbai, Maharashtra, India' },
    { id: 11, pincode: '400011', area: 'Sion', fullAddress: 'Sion, Mumbai, Maharashtra, India' },
    { id: 12, pincode: '400012', area: 'Kurla', fullAddress: 'Kurla, Mumbai, Maharashtra, India' },
    { id: 13, pincode: '400013', area: 'Santacruz', fullAddress: 'Santacruz, Mumbai, Maharashtra, India' },
    { id: 14, pincode: '400014', area: 'Vile Parle', fullAddress: 'Vile Parle, Mumbai, Maharashtra, India' },
    { id: 15, pincode: '400015', area: 'Andheri', fullAddress: 'Andheri, Mumbai, Maharashtra, India' },
    { id: 16, pincode: '400016', area: 'Jogeshwari', fullAddress: 'Jogeshwari, Mumbai, Maharashtra, India' },
    { id: 17, pincode: '400017', area: 'Goregaon', fullAddress: 'Goregaon, Mumbai, Maharashtra, India' },
    { id: 18, pincode: '400018', area: 'Malad', fullAddress: 'Malad, Mumbai, Maharashtra, India' },
    { id: 19, pincode: '400019', area: 'Kandivali', fullAddress: 'Kandivali, Mumbai, Maharashtra, India' },
    { id: 20, pincode: '400020', area: 'Borivali', fullAddress: 'Borivali, Mumbai, Maharashtra, India' },
    { id: 21, pincode: '400021', area: 'Dahisar', fullAddress: 'Dahisar, Mumbai, Maharashtra, India' },
    { id: 22, pincode: '400022', area: 'Mira Road', fullAddress: 'Mira Road, Thane, Maharashtra, India' },
    { id: 23, pincode: '400023', area: 'Bhayandar', fullAddress: 'Bhayandar, Thane, Maharashtra, India' },
    { id: 24, pincode: '400024', area: 'Naigaon', fullAddress: 'Naigaon, Mumbai, Maharashtra, India' },
    { id: 25, pincode: '400025', area: 'Vasai', fullAddress: 'Vasai, Palghar, Maharashtra, India' },
    { id: 26, pincode: '400026', area: 'Virar', fullAddress: 'Virar, Palghar, Maharashtra, India' },
    { id: 27, pincode: '400027', area: 'Nalasopara', fullAddress: 'Nalasopara, Palghar, Maharashtra, India' },
    { id: 28, pincode: '400028', area: 'Boisar', fullAddress: 'Boisar, Palghar, Maharashtra, India' },
    { id: 29, pincode: '400029', area: 'Dahanu', fullAddress: 'Dahanu, Palghar, Maharashtra, India' },
    { id: 30, pincode: '400030', area: 'Talasari', fullAddress: 'Talasari, Palghar, Maharashtra, India' },
    
    // Central Mumbai
    { id: 31, pincode: '400031', area: 'Powai', fullAddress: 'Powai, Mumbai, Maharashtra, India' },
    { id: 32, pincode: '400032', area: 'Vikhroli', fullAddress: 'Vikhroli, Mumbai, Maharashtra, India' },
    { id: 33, pincode: '400033', area: 'Bhandup', fullAddress: 'Bhandup, Mumbai, Maharashtra, India' },
    { id: 34, pincode: '400034', area: 'Mulund', fullAddress: 'Mulund, Mumbai, Maharashtra, India' },
    { id: 35, pincode: '400035', area: 'Thane', fullAddress: 'Thane, Maharashtra, India' },
    { id: 36, pincode: '400036', area: 'Kalyan', fullAddress: 'Kalyan, Thane, Maharashtra, India' },
    { id: 37, pincode: '400037', area: 'Dombivli', fullAddress: 'Dombivli, Thane, Maharashtra, India' },
    { id: 38, pincode: '400038', area: 'Ulhasnagar', fullAddress: 'Ulhasnagar, Thane, Maharashtra, India' },
    { id: 39, pincode: '400039', area: 'Ambernath', fullAddress: 'Ambernath, Thane, Maharashtra, India' },
    { id: 40, pincode: '400040', area: 'Badlapur', fullAddress: 'Badlapur, Thane, Maharashtra, India' },
    
    // Navi Mumbai
    { id: 41, pincode: '400401', area: 'Vashi', fullAddress: 'Vashi, Navi Mumbai, Maharashtra, India' },
    { id: 42, pincode: '400402', area: 'Sanpada', fullAddress: 'Sanpada, Navi Mumbai, Maharashtra, India' },
    { id: 43, pincode: '400403', area: 'Nerul', fullAddress: 'Nerul, Navi Mumbai, Maharashtra, India' },
    { id: 44, pincode: '400404', area: 'Seawoods', fullAddress: 'Seawoods, Navi Mumbai, Maharashtra, India' },
    { id: 45, pincode: '400405', area: 'Belapur', fullAddress: 'Belapur, Navi Mumbai, Maharashtra, India' },
    { id: 46, pincode: '400406', area: 'Kharghar', fullAddress: 'Kharghar, Navi Mumbai, Maharashtra, India' },
    { id: 47, pincode: '400407', area: 'Panvel', fullAddress: 'Panvel, Navi Mumbai, Maharashtra, India' },
    { id: 48, pincode: '400408', area: 'Kamothe', fullAddress: 'Kamothe, Navi Mumbai, Maharashtra, India' },
    { id: 49, pincode: '400409', area: 'New Panvel', fullAddress: 'New Panvel, Navi Mumbai, Maharashtra, India' },
    { id: 50, pincode: '400410', area: 'Uran', fullAddress: 'Uran, Navi Mumbai, Maharashtra, India' },
    
    // Additional Mumbai areas
    { id: 51, pincode: '400050', area: 'Chembur', fullAddress: 'Chembur, Mumbai, Maharashtra, India' },
    { id: 52, pincode: '400051', area: 'Trombay', fullAddress: 'Trombay, Mumbai, Maharashtra, India' },
    { id: 53, pincode: '400052', area: 'Govandi', fullAddress: 'Govandi, Mumbai, Maharashtra, India' },
    { id: 54, pincode: '400053', area: 'Mankhurd', fullAddress: 'Mankhurd, Mumbai, Maharashtra, India' },
    { id: 55, pincode: '400054', area: 'Deonar', fullAddress: 'Deonar, Mumbai, Maharashtra, India' },
    { id: 56, pincode: '400055', area: 'Wadala', fullAddress: 'Wadala, Mumbai, Maharashtra, India' },
    { id: 57, pincode: '400056', area: 'Sewri', fullAddress: 'Sewri, Mumbai, Maharashtra, India' },
    { id: 58, pincode: '400057', area: 'Prabhadevi', fullAddress: 'Prabhadevi, Mumbai, Maharashtra, India' },
    { id: 59, pincode: '400058', area: 'Lower Parel', fullAddress: 'Lower Parel, Mumbai, Maharashtra, India' },
    { id: 60, pincode: '400059', area: 'Elphinstone', fullAddress: 'Elphinstone, Mumbai, Maharashtra, India' },
    
    // More areas
    { id: 61, pincode: '400060', area: 'Chinchpokli', fullAddress: 'Chinchpokli, Mumbai, Maharashtra, India' },
    { id: 62, pincode: '400061', area: 'Lalbaug', fullAddress: 'Lalbaug, Mumbai, Maharashtra, India' },
    { id: 63, pincode: '400062', area: 'Kalachowki', fullAddress: 'Kalachowki, Mumbai, Maharashtra, India' },
    { id: 64, pincode: '400063', area: 'Reay Road', fullAddress: 'Reay Road, Mumbai, Maharashtra, India' },
    { id: 65, pincode: '400064', area: 'Sandhurst Road', fullAddress: 'Sandhurst Road, Mumbai, Maharashtra, India' },
    { id: 66, pincode: '400065', area: 'Masjid', fullAddress: 'Masjid, Mumbai, Maharashtra, India' },
    { id: 67, pincode: '400066', area: 'Pydhonie', fullAddress: 'Pydhonie, Mumbai, Maharashtra, India' },
    { id: 68, pincode: '400067', area: 'Kalbadevi', fullAddress: 'Kalbadevi, Mumbai, Maharashtra, India' },
    { id: 69, pincode: '400068', area: 'Bhuleshwar', fullAddress: 'Bhuleshwar, Mumbai, Maharashtra, India' },
    { id: 70, pincode: '400069', area: 'Girgaon', fullAddress: 'Girgaon, Mumbai, Maharashtra, India' },
    
    // Additional pin codes
    { id: 71, pincode: '400070', area: 'Grant Road', fullAddress: 'Grant Road, Mumbai, Maharashtra, India' },
    { id: 72, pincode: '400071', area: 'Tardeo', fullAddress: 'Tardeo, Mumbai, Maharashtra, India' },
    { id: 73, pincode: '400072', area: 'Nana Chowk', fullAddress: 'Nana Chowk, Mumbai, Maharashtra, India' },
    { id: 74, pincode: '400073', area: 'Kemps Corner', fullAddress: 'Kemps Corner, Mumbai, Maharashtra, India' },
    { id: 75, pincode: '400074', area: 'Breach Candy', fullAddress: 'Breach Candy, Mumbai, Maharashtra, India' },
    { id: 76, pincode: '400075', area: 'Warden Road', fullAddress: 'Warden Road, Mumbai, Maharashtra, India' },
    { id: 77, pincode: '400076', area: 'Haji Ali', fullAddress: 'Haji Ali, Mumbai, Maharashtra, India' },
    { id: 78, pincode: '400077', area: 'Worli Naka', fullAddress: 'Worli Naka, Mumbai, Maharashtra, India' },
    { id: 79, pincode: '400078', area: 'Prabhadevi', fullAddress: 'Prabhadevi, Mumbai, Maharashtra, India' },
    { id: 80, pincode: '400079', area: 'Elphinstone Road', fullAddress: 'Elphinstone Road, Mumbai, Maharashtra, India' },
    
    // More comprehensive list
    { id: 81, pincode: '400080', area: 'Lower Parel', fullAddress: 'Lower Parel, Mumbai, Maharashtra, India' },
    { id: 82, pincode: '400081', area: 'Prabhadevi', fullAddress: 'Prabhadevi, Mumbai, Maharashtra, India' },
    { id: 83, pincode: '400082', area: 'Worli', fullAddress: 'Worli, Mumbai, Maharashtra, India' },
    { id: 84, pincode: '400083', area: 'Haji Ali', fullAddress: 'Haji Ali, Mumbai, Maharashtra, India' },
    { id: 85, pincode: '400084', area: 'Warden Road', fullAddress: 'Warden Road, Mumbai, Maharashtra, India' },
    { id: 86, pincode: '400085', area: 'Breach Candy', fullAddress: 'Breach Candy, Mumbai, Maharashtra, India' },
    { id: 87, pincode: '400086', area: 'Kemps Corner', fullAddress: 'Kemps Corner, Mumbai, Maharashtra, India' },
    { id: 88, pincode: '400087', area: 'Nana Chowk', fullAddress: 'Nana Chowk, Mumbai, Maharashtra, India' },
    { id: 89, pincode: '400088', area: 'Tardeo', fullAddress: 'Tardeo, Mumbai, Maharashtra, India' },
    { id: 90, pincode: '400089', area: 'Grant Road', fullAddress: 'Grant Road, Mumbai, Maharashtra, India' },
    
    // Extended list for better coverage
    { id: 91, pincode: '400090', area: 'Girgaon', fullAddress: 'Girgaon, Mumbai, Maharashtra, India' },
    { id: 92, pincode: '400091', area: 'Bhuleshwar', fullAddress: 'Bhuleshwar, Mumbai, Maharashtra, India' },
    { id: 93, pincode: '400092', area: 'Kalbadevi', fullAddress: 'Kalbadevi, Mumbai, Maharashtra, India' },
    { id: 94, pincode: '400093', area: 'Pydhonie', fullAddress: 'Pydhonie, Mumbai, Maharashtra, India' },
    { id: 95, pincode: '400094', area: 'Masjid', fullAddress: 'Masjid, Mumbai, Maharashtra, India' },
    { id: 96, pincode: '400095', area: 'Sandhurst Road', fullAddress: 'Sandhurst Road, Mumbai, Maharashtra, India' },
    { id: 97, pincode: '400096', area: 'Reay Road', fullAddress: 'Reay Road, Mumbai, Maharashtra, India' },
    { id: 98, pincode: '400097', area: 'Kalachowki', fullAddress: 'Kalachowki, Mumbai, Maharashtra, India' },
    { id: 99, pincode: '400098', area: 'Lalbaug', fullAddress: 'Lalbaug, Mumbai, Maharashtra, India' },
    { id: 100, pincode: '400099', area: 'Chinchpokli', fullAddress: 'Chinchpokli, Mumbai, Maharashtra, India' }
  ];

  useEffect(() => {
    // Load categories for the category bar
    const load = async () => {
      try {
        const cats = await fetchCategories();
        // Combine API categories with additional hardcoded categories
        const additionalCategories = [
          'household items',
          'grocery and staples', 
          'personal care',
          'baby care',
          'beverages',
          'instant food',
          'bakery/dairy',
          'biscuits/snacks'
        ];
        setCategories(['all', ...cats, ...additionalCategories]);
      } catch (e) {
        // If API fails, use hardcoded categories
        const fallbackCategories = [
          'all',
          'household items',
          'grocery and staples', 
          'personal care',
          'baby care',
          'beverages',
          'instant food',
          'bakery/dairy',
          'biscuits/snacks'
        ];
        setCategories(fallbackCategories);
      }
    };
    load();
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
      if (isLocationModalOpen && !event.target.closest('.location-modal-container')) {
        setIsLocationModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isAccountDropdownOpen, isLocationModalOpen]);

  // Handle location search
  useEffect(() => {
    if (locationSearch.trim()) {
      // Filter from comprehensive Mumbai locations
      const searchResults = mumbaiLocations.filter(location => 
        location.pincode.includes(locationSearch) || 
        location.area.toLowerCase().includes(locationSearch.toLowerCase()) ||
        location.fullAddress.toLowerCase().includes(locationSearch.toLowerCase())
      );
      // Limit results to 20 to prevent overwhelming the user
      setLocationSearchResults(searchResults.slice(0, 20));
    } else {
      setLocationSearchResults([]);
    }
  }, [locationSearch]);

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
    const params = {};
    if (search && search.trim()) params.q = search.trim();
    if (cat && cat !== 'all') params.category = cat;
    setSearchParams(params);
    navigate({ pathname: '/', search: `?${new URLSearchParams(params).toString()}` });
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

  const handleLocationClick = () => {
    setIsLocationModalOpen(true);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsLocationModalOpen(false);
    setLocationSearch('');
    setLocationSearchResults([]);
  };

  const handleLocationSearchChange = (e) => {
    setLocationSearch(e.target.value);
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
                onClick={handleLocationClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:border-primary-300 transition-colors"
              >
                <MapPinIcon className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium">{selectedLocation.pincode}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                <span className="ml-1 text-gray-500">{selectedLocation.area}</span>
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
          <div className="flex items-center gap-6 h-12 overflow-x-auto">
            <button
              className="inline-flex items-center gap-2 text-gray-800 hover:text-primary-700 font-medium whitespace-nowrap text-sm"
              onClick={handleAllCategoriesClick}
            >
              <Bars3Icon className="w-5 h-5" />
              All Categories
            </button>
            {categories.slice(1).map((cat) => (
              <button
                key={cat}
                onClick={() => goToCategory(cat)}
                className={`text-sm whitespace-nowrap pb-0.5 border-b-2 transition-colors font-medium ${
                  (currentCategory === cat) || (currentCategory === 'all' && cat === 'all')
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-700 hover:text-primary-700'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
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

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="location-modal-container bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-center">Choose delivery location</h3>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={locationSearch}
                  onChange={handleLocationSearchChange}
                  placeholder="Search for area, street name or pincode.."
                  className="w-full pl-10 pr-4 py-3 border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 overflow-y-auto max-h-96">
              {/* Recent Search Section */}
              {!locationSearch && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">RECENT SEARCH</h4>
                  <div className="space-y-3">
                    {recentSearches.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {location.pincode}, {location.area}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {location.fullAddress}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Popular Areas Section */}
                  <div className="mt-6">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">POPULAR AREAS</h4>
                    <div className="space-y-3">
                      {mumbaiLocations.slice(0, 8).map((location) => (
                        <button
                          key={`popular-${location.id}`}
                          onClick={() => handleLocationSelect(location)}
                          className="w-full flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {location.pincode}, {location.area}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {location.fullAddress}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Search Results */}
              {locationSearch && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">SEARCH RESULTS</h4>
                  <div className="space-y-3">
                    {locationSearchResults.length > 0 ? (
                      locationSearchResults.map((location) => (
                        <button
                          key={location.id}
                          onClick={() => handleLocationSelect(location)}
                          className="w-full flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {location.pincode}, {location.area}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {location.fullAddress}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No locations found</p>
                        <p className="text-xs text-gray-400 mt-1">Try searching with a different term</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
