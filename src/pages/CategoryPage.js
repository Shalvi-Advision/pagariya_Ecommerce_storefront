import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import GroceryProductCard from '../components/GroceryProductCard';
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { getProductsOptimized } from '../api/productsApi';
import groceryApiService from '../services/groceryApi';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // State management
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentImage, setDepartmentImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    colour: '',
    material: '',
    capacity: '',
    warranty: '',
    volume: '',
    dimension: ''
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); // For initial page load
  const [productsLoading, setProductsLoading] = useState(false); // For products section only
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_products: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  // Convert category slug back to department name
  const getDepartmentNameFromSlug = (slug) => {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Memoized function to load department data
  const loadDepartmentData = useCallback(async () => {
    try {
      setLoading(true);
      const departmentName = getDepartmentNameFromSlug(categoryName);
      setSelectedDepartment(departmentName);
      
      // Fetch department image from API
      try {
        const departmentsResponse = await groceryApiService.getActiveDepartments();
        if (departmentsResponse.success && departmentsResponse.data) {
          const department = departmentsResponse.data.find(
            dept => dept.department_name.toLowerCase() === departmentName.toLowerCase()
          );
          if (department && department.image_link) {
            setDepartmentImage(department.image_link);
            setDepartmentId(department.department_id);
          }
        }
      } catch (e) {
        console.error('Error fetching department image:', e);
      }
      
      // Use local storage cache if available
      const cachedCategories = localStorage.getItem(`categories_${departmentName}`);
      const cacheTimestamp = localStorage.getItem(`categories_timestamp_${departmentName}`);
      const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
      const cacheValid = cacheAge < 30 * 60 * 1000; // 30 minutes cache validity
      
      if (cachedCategories && cacheValid) {
        try {
          // Use cached categories
          setCategories(JSON.parse(cachedCategories));
          console.log('Using cached categories data for', departmentName);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Error parsing cached categories:', e);
          // Fall through to fetch fresh data
        }
      }
      
      // Load categories for this department
      const response = await groceryApiService.getActiveCategoriesByDepartmentName(departmentName);
      if (response.success) {
        setCategories(response.data);

        // Auto-select category if coming from drawer navigation
        if (location.state?.selectedCategoryName && response.data) {
          const categoryToSelect = response.data.find(
            cat => cat.category_name === location.state.selectedCategoryName ||
                   cat.idcategory_master === location.state.selectedCategoryId
          );
          if (categoryToSelect) {
            setSelectedCategory(categoryToSelect);
            // Load subcategories for this category
            if (departmentId) {
              loadSubcategories(departmentId, categoryToSelect.idcategory_master);
            }
          }
        }

        // Cache the categories
        try {
          localStorage.setItem(`categories_${departmentName}`, JSON.stringify(response.data));
          localStorage.setItem(`categories_timestamp_${departmentName}`, Date.now().toString());
        } catch (e) {
          console.error('Error caching categories:', e);
        }
      } else {
        setCategories([]);
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Error loading department data:', err);
      setError('Failed to load department data');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [categoryName]);

  // Load subcategories for a department and category
  const loadSubcategories = useCallback(async (deptId, categoryId) => {
    try {
      // Don't set loading state - only affects subcategories list, not whole page
      const locationData = localStorage.getItem('confirmedLocation');
      const storeCode = locationData ? JSON.parse(locationData)?.store?.storeCode || JSON.parse(locationData)?.store?.store_code : null;

      if (!storeCode) {
        setError('Please select a store to view subcategories');
        return;
      }

      const response = await groceryApiService.getActiveSubcategories(deptId, categoryId);
      if (response.success && response.data && response.data.length > 0) {
        setSubcategories(response.data);
        // Auto-select first subcategory if available
        setSelectedSubcategory(response.data[0]);
      } else {
        // Create a fallback subcategory if none exist
        console.log('No subcategories found, creating fallback subcategory');
        const fallbackSubcategory = {
          id: 'fallback',
          idsub_category_master: 'fallback',
          sub_category_name: 'All Products',
          category_id: categoryId,
          main_category_name: selectedCategory?.category_name || 'Products'
        };
        setSubcategories([fallbackSubcategory]);
        setSelectedSubcategory(fallbackSubcategory);
      }
    } catch (err) {
      console.error('Error loading subcategories:', err);
      // Create a fallback subcategory on error
      const fallbackSubcategory = {
        id: 'fallback',
        idsub_category_master: 'fallback',
        sub_category_name: 'All Products',
        category_id: categoryId,
        main_category_name: selectedCategory?.category_name || 'Products'
      };
      setSubcategories([fallbackSubcategory]);
      setSelectedSubcategory(fallbackSubcategory);
    }
  }, [selectedCategory]);

  // Load department and categories on component mount
  useEffect(() => {
    if (categoryName) {
      loadDepartmentData();
    }
  }, [categoryName, loadDepartmentData]);

  // Memoized loadProducts function to prevent recreating on every render
  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true); // Only show loading in products section
      setError(null);

      const locationData = localStorage.getItem('confirmedLocation');
      const storeCode = locationData ? JSON.parse(locationData)?.store?.storeCode || JSON.parse(locationData)?.store?.store_code : null;

      console.log('🏪 CategoryPage loadProducts - storeCode:', storeCode);
      console.log('🏪 CategoryPage loadProducts - locationData:', locationData);

      if (!storeCode) {
        setError('Please select a store to view products');
        setProductsLoading(false);
        return;
      }

      if (!departmentId || !selectedCategory || !selectedSubcategory) {
        setProducts([]);
        setProductsLoading(false);
        return;
      }

      // Check if this is a fallback subcategory
      const isFallbackSubcategory = selectedSubcategory.idsub_category_master === 'fallback';

      if (!isFallbackSubcategory) {
        // Try the new hierarchy-based endpoint first
        const response = await groceryApiService.getProducts(
          storeCode,
          departmentId,
          selectedCategory.idcategory_master,
          selectedSubcategory.idsub_category_master
        );

        if (response.success && response.data && response.data.length > 0) {
          // New API returned products
          setProducts(response.data);
          setUsingFallbackData(false);
          return;
        }
      }

      // Fallback to old API (either because hierarchy API failed or it's a fallback subcategory)
      console.log('Using fallback API for products');
      
      // Use search endpoint as fallback with a generic search term
      const fallbackResponse = await groceryApiService.searchProducts(
        'a', // Generic search term to get products
        storeCode,
        {
          dept_id: departmentId,
          category_id: selectedCategory.idcategory_master,
          sub_category_id: isFallbackSubcategory ? "391" : selectedSubcategory.idsub_category_master
        }
      );

      if (fallbackResponse && fallbackResponse.data) {
        setProducts(fallbackResponse.data);
        setUsingFallbackData(true);
      } else {
        // If no products found, show mock data for demonstration
        console.log('No products found in API, showing mock data');
        const mockProducts = [
          {
            id: 'mock1',
            p_code: '2390',
            product_name: 'DOMEX LIME TOILET CLEANER 1 LTR',
            product_description: 'Effective toilet cleaner with lime fragrance',
            package_size: '1',
            package_unit: 'LTR',
            product_mrp: 245,
            our_price: 185,
            brand_name: 'DOMEX',
            store_code: storeCode,
            pcode_status: 'Y',
            dept_id: departmentId,
            category_id: selectedCategory.idcategory_master,
            sub_category_id: selectedSubcategory.idsub_category_master,
            store_quantity: 50,
            max_quantity_allowed: 10,
            pcode_img: 'https://patelrmart.com/mgmt_panel/sites/default/files/products/2390.webp'
          },
          {
            id: 'mock2',
            p_code: '2391',
            product_name: 'DOMEX OCEAN TOILET CLEANER 1LTR',
            product_description: 'Ocean fresh toilet cleaner',
            package_size: '1',
            package_unit: 'LTR',
            product_mrp: 245,
            our_price: 185,
            brand_name: 'DOMEX',
            store_code: storeCode,
            pcode_status: 'Y',
            dept_id: departmentId,
            category_id: selectedCategory.idcategory_master,
            sub_category_id: selectedSubcategory.idsub_category_master,
            store_quantity: 30,
            max_quantity_allowed: 10,
            pcode_img: 'https://patelrmart.com/mgmt_panel/sites/default/files/products/2391.webp'
          }
        ];
        setProducts(mockProducts);
        setUsingFallbackData(true);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      
      // Try fallback API on error
      try {
        console.log('Primary API failed, trying fallback API');
        const fallbackResponse = await groceryApiService.searchProducts(
          'a', // Generic search term
          storeCode,
          {
            dept_id: departmentId || "2",
            category_id: selectedCategory?.idcategory_master || "72",
            sub_category_id: selectedSubcategory?.idsub_category_master || "391"
          }
        );

        if (fallbackResponse && fallbackResponse.data) {
          setProducts(fallbackResponse.data);
          setUsingFallbackData(true);
        } else {
          // Show mock data on complete failure
          console.log('All APIs failed, showing mock data');
          const mockProducts = [
            {
              id: 'mock1',
              p_code: '2390',
              product_name: 'DOMEX LIME TOILET CLEANER 1 LTR',
              product_description: 'Effective toilet cleaner with lime fragrance',
              package_size: '1',
              package_unit: 'LTR',
              product_mrp: 245,
              our_price: 185,
              brand_name: 'DOMEX',
              store_code: storeCode,
              pcode_status: 'Y',
              dept_id: departmentId || "2",
              category_id: selectedCategory?.idcategory_master || "72",
              sub_category_id: selectedSubcategory?.idsub_category_master || "391",
              store_quantity: 50,
              max_quantity_allowed: 10,
              pcode_img: 'https://patelrmart.com/mgmt_panel/sites/default/files/products/2390.webp'
            }
          ];
          setProducts(mockProducts);
          setUsingFallbackData(true);
        }
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr);
        setError('Failed to load products');
        setProducts([]);
      }
    } finally {
      setProductsLoading(false); // Only affects products section
    }
  }, [departmentId, selectedCategory, selectedSubcategory]);
  
  // Load products when subcategory changes
  useEffect(() => {
    if (selectedSubcategory) {
      loadProducts();
    }
  }, [selectedSubcategory, loadProducts]);

  // Filter products based on additional filters and sorting
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply additional filters
    if (filters.brand) {
      filtered = filtered.filter(product => product.brand === filters.brand);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.our_price - b.our_price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.our_price - a.our_price);
        break;
      case 'discount':
        filtered.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.product_name.localeCompare(b.product_name));
        break;
      default:
        // Keep original order for relevance
        break;
    }

    return filtered;
  }, [products, filters, sortBy]);

  // Get unique brands from filtered products
  const availableBrands = useMemo(() => {
    const brands = [...new Set(filteredProducts.map(product => product.brand).filter(Boolean))];
    return brands.sort();
  }, [filteredProducts]);

  // Handle category selection - only load subcategories, don't load products yet
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null); // Reset subcategory
    setProducts([]); // Clear products - wait for subcategory selection
    setCurrentPage(1); // Reset to first page when category changes

    // Load subcategories for this category
    if (departmentId) {
      loadSubcategories(departmentId, category.idcategory_master);
    }
  }, [departmentId, loadSubcategories]);

  // Handle subcategory selection - load products only when subcategory is clicked
  const handleSubcategorySelect = useCallback((subcategory) => {
    setSelectedSubcategory(subcategory);
    setCurrentPage(1); // Reset to first page
    // Products will load automatically via useEffect
  }, []);

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      brand: '',
      category: '',
      colour: '',
      material: '',
      capacity: '',
      warranty: '',
      volume: '',
      dimension: ''
    });
    setSelectedCategory(null);
    setCurrentPage(1);
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Modern Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-transparent border-t-emerald-500 border-r-teal-500 border-b-cyan-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-full blur-lg animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  // Modern Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/60 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Mobile Header */}
      {isMobile && (
        <div className="relative bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-emerald-50 rounded-xl transition-all duration-300 hover:scale-110"
            >
              <Bars3Icon className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              {departmentImage && (
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg flex items-center justify-center overflow-hidden shadow-md">
                  <img 
                    src={departmentImage} 
                    alt={selectedDepartment}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {selectedDepartment || 'Categories'}
              </h1>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'w-64'}
          bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          ${isMobile ? '' : 'sticky top-0 h-screen overflow-y-auto'}
        `}>
          {/* Mobile sidebar header */}
          {isMobile && (
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10"></div>
              <div className="relative flex items-center justify-between p-4 border-b border-gray-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg flex items-center justify-center overflow-hidden shadow-md">
                    {departmentImage ? (
                      <img 
                        src={departmentImage} 
                        alt={selectedDepartment}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span class="text-lg">📂</span>';
                        }}
                      />
                    ) : (
                      <span className="text-lg">📂</span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Subcategories</h2>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop sidebar header */}
          {!isMobile && (
            <div className="border-b border-gray-200">
              <div className="p-4">
                <h2 className="text-base font-bold text-gray-900">{selectedDepartment}</h2>
              </div>
            </div>
          )}

          {/* Categories List with Nested Subcategories */}
          <div className="overflow-y-auto h-full custom-scrollbar">
            <div className="py-2">
              {categories
                .filter((category, index, self) => {
                  // Remove duplicates based on category_id or category_name
                  const identifier = category.idcategory_master || category.category_id || category.category_name;
                  return index === self.findIndex(c =>
                    (c.idcategory_master || c.category_id || c.category_name) === identifier
                  );
                })
                .map((category) => {
                  const isSelected = selectedCategory?.idcategory_master === category.idcategory_master;
                  const categoryCount = category.product_count || subcategories.filter(sub => sub.idcategory_master === category.idcategory_master).length;

                  return (
                    <div key={category.idcategory_master || category.category_id || category.category_name}>
                      {/* Category Button */}
                      <button
                        onClick={() => handleCategorySelect(category)}
                        className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between hover:bg-gray-50 ${
                          isSelected ? 'bg-green-50' : ''
                        }`}
                      >
                        <span className={`text-sm ${
                          isSelected ? 'text-green-600 font-semibold' : 'text-gray-700'
                        }`}>
                          {category.category_name}
                        </span>
                        {categoryCount > 0 && (
                          <span className="text-xs text-gray-500">
                            ({categoryCount})
                          </span>
                        )}
                      </button>

                      {/* Nested Subcategories - Only show when category is selected */}
                      {isSelected && subcategories.length > 0 && (
                        <div className="bg-gray-50/50 border-l-2 border-green-500 ml-4">
                          {subcategories.map((subcategory) => (
                            <button
                              key={subcategory.idsub_category_master}
                              onClick={() => handleSubcategorySelect(subcategory)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                selectedSubcategory?.idsub_category_master === subcategory.idsub_category_master
                                  ? 'bg-green-100 text-green-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              {subcategory.sub_category_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Modern Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-40 animate-fade-in"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb and Title */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span className="hover:text-green-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>Grocery</span>
              {selectedDepartment && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-gray-700">{selectedDepartment}</span>
                </>
              )}
              {selectedCategory && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-gray-900 font-medium">{selectedCategory.category_name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedCategory?.category_name || selectedDepartment || 'All Products'}
            </h1>
          </div>

          {/* Filters and Sort Bar */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.5rem center'}}
                >
                  <option value="">Brand</option>
                  {availableBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.5rem center'}}
                >
                  <option value="">Category</option>
                </select>

                <select
                  value={filters.material}
                  onChange={(e) => handleFilterChange('material', e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.5rem center'}}
                >
                  <option value="">Type</option>
                  <option value="organic">Organic</option>
                  <option value="regular">Regular</option>
                </select>

                <select
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.5rem center'}}
                >
                  <option value="">Properties</option>
                </select>

                <select
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.5rem center'}}
                >
                  <option value="">Weight</option>
                </select>

                <select
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.5rem center'}}
                >
                  <option value="">Availability</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.5rem center'}}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Discount</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="p-4 sm:p-6 bg-gray-50 relative min-h-screen">
            {/* Products Loading Overlay - Only shows when switching categories/subcategories */}
            {productsLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-600 font-medium">Loading products...</p>
                </div>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {/* Product Cards */}
                  {filteredProducts.map((product, index) => (
                    <div key={product._id || product.p_code || index} className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                      {/* Product Image */}
                      <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden p-4">
                        <img
                          src={product.image_url || '/images/logo.jpg'}
                          alt={product.product_name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.target.src = '/images/logo.jpg';
                          }}
                        />
                        {product.discount_percentage > 0 && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded font-semibold">
                            ₹ {product.discount_percentage} OFF
                          </div>
                        )}
                        {/* Vegetarian/Non-Veg indicator */}
                        <div className="absolute top-2 right-2">
                          <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-600"></div>
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 border-t border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">MRP <span className="text-gray-400">DMart</span></p>
                            <p className="text-xs text-gray-400 line-through">₹ {product.product_mrp}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">MRP <span className="text-gray-400">DMart</span></p>
                            <p className="text-base font-bold text-gray-900">₹ {product.our_price}</p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-2">(Inclusive of all taxes)</p>

                        <h3 className="text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">{product.product_name}</h3>

                        {/* Package Size Selector */}
                        {product.package_size && (
                          <select className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-green-500">
                            <option>{product.package_size}</option>
                          </select>
                        )}

                        {/* Add to Cart Button */}
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          ADD TO CART
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modern Pagination Controls */}
                {pagination.total_pages > 1 && (
                  <div className="mt-10 pt-8 border-t border-gray-200">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-sm text-gray-600 font-medium">
                        Showing <span className="text-emerald-600 font-bold">{products.length}</span> of <span className="text-emerald-600 font-bold">{pagination.total_products}</span> products
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.has_prev}
                          className="px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1.5">
                          {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-110'
                                    : 'text-gray-700 bg-white border-2 border-gray-200 hover:border-emerald-400 hover:scale-105'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.has_next}
                          className="px-4 sm:px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <span className="text-6xl">📦</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Products Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Try adjusting your filters or browse different subcategories to find what you're looking for
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #14b8a6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #0d9488);
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default CategoryPage;