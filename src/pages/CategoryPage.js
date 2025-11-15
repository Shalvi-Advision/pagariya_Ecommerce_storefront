import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useFavorite } from '../context/FavoriteContext';
import GroceryProductCard from '../components/GroceryProductCard';
import { ChevronDownIcon, Bars3Icon, XMarkIcon, HeartIcon as HeartOutline, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { getProductsOptimized } from '../api/productsApi';
import groceryApiService from '../services/groceryApi';
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

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { addItem, updateQuantity, items: cartItems } = useCart();
  const { showError } = useToast();
  const { isFavorite, toggleFavorite } = useFavorite();
  
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
  const [addingToCart, setAddingToCart] = useState({});
  const [showQuantitySelector, setShowQuantitySelector] = useState({});
  const [quantities, setQuantities] = useState({});
  const [storeEnabled, setStoreEnabled] = useState(true);

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

  // Sync quantity selector state with cart items
  useEffect(() => {
    const newQuantities = {};
    const newShowQuantitySelector = {};
    
    cartItems.forEach(item => {
      const productId = item.p_code || item.id;
      newQuantities[productId] = item.quantity;
      newShowQuantitySelector[productId] = true; // Show selector if item is in cart
    });
    
    setQuantities(newQuantities);
    setShowQuantitySelector(newShowQuantitySelector);
  }, [cartItems]);

  // Convert category slug back to department name
  const getDepartmentNameFromSlug = (slug) => {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Memoized function to load department data
  const loadDepartmentData = useCallback(async () => {
    try {
      setLoading(true);
      const departmentName = getDepartmentNameFromSlug(categoryName);
      
      // Reset state when switching departments
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSubcategories([]);
      setProducts([]);
      
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
          const parsedCategories = JSON.parse(cachedCategories);
          setCategories(parsedCategories);
          console.log('Using cached categories data for', departmentName);

          // Auto-select category if coming from drawer navigation
          if (location.state?.selectedCategoryName && parsedCategories) {
            const categoryToSelect = parsedCategories.find(
              cat => cat.category_name === location.state.selectedCategoryName ||
                     cat.idcategory_master === location.state.selectedCategoryId
            );
            if (categoryToSelect) {
              setSelectedCategory(categoryToSelect);
            }
          } else if (parsedCategories && parsedCategories.length > 0) {
            // Auto-select first category if no specific category was requested
            console.log('✅ Auto-selecting first category from cache:', parsedCategories[0].category_name);
            setSelectedCategory(parsedCategories[0]);
          }

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
            // Load subcategories for this category - will be handled by useEffect after departmentId is set
          }
        } else if (response.data && response.data.length > 0) {
          // Auto-select first category if no specific category was requested
          console.log('✅ Auto-selecting first category:', response.data[0].category_name);
          setSelectedCategory(response.data[0]);
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
  }, [categoryName, location.state]);

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

      // Create "All Products" sentinel that will always be first
      const allProductsSentinel = {
        id: 'all-products',
        idsub_category_master: 'all-products',
        sub_category_name: 'All Products',
        category_id: categoryId,
        main_category_name: selectedCategory?.category_name || 'Products'
      };

      const response = await groceryApiService.getActiveSubcategories(deptId, categoryId);
      if (response.success && response.data && response.data.length > 0) {
        // Always prepend "All Products" sentinel to the subcategories list
        const subcategoriesWithAll = [allProductsSentinel, ...response.data];
        setSubcategories(subcategoriesWithAll);

        // Preserve current selection if it exists and is still valid, otherwise default to "All Products"
        if (selectedSubcategory) {
          const stillExists = subcategoriesWithAll.find(
            sub => sub.idsub_category_master === selectedSubcategory.idsub_category_master
          );
          if (stillExists) {
            console.log('✅ Preserving selected subcategory:', selectedSubcategory.sub_category_name);
            // Keep the current selection
          } else {
            console.log('✅ Previous selection no longer exists, defaulting to All Products');
            setSelectedSubcategory(allProductsSentinel);
          }
        } else {
          console.log('✅ Auto-selecting All Products sentinel');
          setSelectedSubcategory(allProductsSentinel);
        }
      } else {
        // Only "All Products" sentinel if no real subcategories exist
        console.log('No subcategories found, using All Products sentinel only');
        setSubcategories([allProductsSentinel]);
        console.log('✅ Auto-selecting All Products sentinel');
        setSelectedSubcategory(allProductsSentinel);
      }
    } catch (err) {
      console.error('Error loading subcategories:', err);
      // Create "All Products" sentinel on error
      const allProductsSentinel = {
        id: 'all-products',
        idsub_category_master: 'all-products',
        sub_category_name: 'All Products',
        category_id: categoryId,
        main_category_name: selectedCategory?.category_name || 'Products'
      };
      setSubcategories([allProductsSentinel]);
      console.log('✅ Auto-selecting All Products sentinel after error');
      setSelectedSubcategory(allProductsSentinel);
    }
  }, [selectedCategory, selectedSubcategory]);

  // Load department and categories on component mount
  useEffect(() => {
    if (categoryName) {
      loadDepartmentData();
    }
  }, [categoryName, loadDepartmentData]);

  // Load subcategories when both selectedCategory and departmentId are available
  useEffect(() => {
    if (selectedCategory && departmentId) {
      console.log('🔄 Auto-loading subcategories for category:', selectedCategory.category_name, 'departmentId:', departmentId);
      loadSubcategories(departmentId, selectedCategory.idcategory_master);
    }
  }, [selectedCategory, departmentId, loadSubcategories]);

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

      // Check if this is a special subcategory (all-products sentinel or old fallback)
      const isAllProductsSentinel = selectedSubcategory.idsub_category_master === 'all-products';
      const isFallbackSubcategory = selectedSubcategory.idsub_category_master === 'fallback';
      const isAggregatedView = isAllProductsSentinel || isFallbackSubcategory;

      if (!isAggregatedView) {
        // Try the new hierarchy-based endpoint first for specific subcategories
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

      // For "All Products" sentinel or fallback, use search endpoint with category-level filters
      if (isAllProductsSentinel) {
        console.log('Using category-level search for All Products');

        // Call search endpoint WITHOUT sub_category_id to get all products in category
        const categoryResponse = await groceryApiService.searchProducts(
          'a', // Generic search term to get products
          storeCode,
          {
            dept_id: departmentId,
            category_id: selectedCategory.idcategory_master
            // Explicitly NOT including sub_category_id to get all category products
          }
        );

        if (categoryResponse && categoryResponse.data) {
          // Deduplicate products based on p_code or _id
          const uniqueProducts = categoryResponse.data.filter((product, index, self) => {
            const identifier = product.p_code || product._id;
            return identifier && index === self.findIndex(p => (p.p_code || p._id) === identifier);
          });

          setProducts(uniqueProducts);
          setUsingFallbackData(true);
          return;
        }
      }

      // Fallback to old API (either because hierarchy API failed or it's the old fallback subcategory)
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
        // Deduplicate products
        const uniqueProducts = fallbackResponse.data.filter((product, index, self) => {
          const identifier = product.p_code || product._id;
          return identifier && index === self.findIndex(p => (p.p_code || p._id) === identifier);
        });

        setProducts(uniqueProducts);
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
    // First, remove duplicates based on p_code or _id
    const uniqueProducts = products.filter((product, index, self) => {
      const identifier = product.p_code || product._id;
      return identifier && index === self.findIndex(p => (p.p_code || p._id) === identifier);
    });

    let filtered = [...uniqueProducts];

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

  // Handle category selection - subcategories will be loaded automatically via useEffect
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    // Set to "All Products" sentinel - loadSubcategories will update with actual sentinel
    const allProductsSentinel = {
      id: 'all-products',
      idsub_category_master: 'all-products',
      sub_category_name: 'All Products',
      category_id: category.idcategory_master,
      main_category_name: category.category_name
    };
    setSelectedSubcategory(allProductsSentinel); // Default to "All Products" sentinel
    setProductsLoading(true); // Set loading state to show loader instead of "No products found"
    setProducts([]); // Clear products - wait for subcategory selection
    setCurrentPage(1); // Reset to first page when category changes
    // Subcategories will be loaded automatically via useEffect when both selectedCategory and departmentId are available
  }, []);

  // Handle subcategory selection - load products only when subcategory is clicked
  const handleSubcategorySelect = useCallback((subcategory) => {
    setSelectedSubcategory(subcategory);
    setProductsLoading(true); // Set loading state to show loader instead of "No products found"
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

  // Handle add to cart
  const handleAddToCart = async (product) => {
    const productId = product.p_code || product._id;
    
    // Check if store is enabled
    if (!storeEnabled) {
      const storeMessage = getStoreMessage();
      showError(storeMessage || 'This store is currently not accepting online orders. Please try again later.');
      return;
    }
    
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      
      // Initialize quantity to 1 if not set
      const currentQuantity = quantities[productId] || 1;
      
      // Create cart item from product
      const cartItem = createCartItemFromProduct(product, currentQuantity);
      
      // Add to cart using context
      await addItem(cartItem, currentQuantity);
      
      // Show quantity selector after adding to cart
      setShowQuantitySelector(prev => ({ ...prev, [productId]: true }));
      setQuantities(prev => ({ ...prev, [productId]: currentQuantity }));
      
      // Success - no toast message
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.code === 'STORE_DISABLED') {
        showError(error.message);
      } else {
        showError('Failed to add item to cart. Please try again.');
      }
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Handle quantity change
  const handleQuantityChange = async (product, newQuantity) => {
    const productId = product.p_code || product._id;
    const maxQuantity = product.max_quantity_allowed || 10;
    
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
      
      try {
        // Update cart with exact quantity (not adding to existing)
        updateQuantity(productId, newQuantity);
      } catch (error) {
        console.error('Error updating cart quantity:', error);
        showError('Failed to update quantity');
      }
    }
  };

  // Modern Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom right, ${COLORS.primary[50]}, ${COLORS.success[50]}, ${COLORS.primary[100]})`
        }}
      >
        <div className="text-center">
          <div className="relative">
            <div 
              className="w-16 h-16 border-4 border-transparent rounded-full animate-spin"
              style={{
                borderTopColor: COLORS.primary[500],
                borderRightColor: COLORS.success[500],
                borderBottomColor: COLORS.primary[400]
              }}
            ></div>
            <div 
              className="absolute inset-0 w-16 h-16 rounded-full blur-lg animate-pulse"
              style={{
                background: `linear-gradient(to right, ${hexToRgba(COLORS.primary[400], 0.2)}, ${hexToRgba(COLORS.success[400], 0.2)})`
              }}
            ></div>
          </div>
          <p 
            className="mt-4 font-semibold bg-clip-text text-transparent"
            style={{
              color: COLORS.gray[600],
              background: `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  // Modern Error state
  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(to bottom right, ${COLORS.error[50]}, ${COLORS.error[100]}, ${COLORS.error[50]})`
        }}
      >
        <div 
          className="text-center backdrop-blur-lg rounded-3xl p-8 shadow-2xl border max-w-md"
          style={{
            backgroundColor: hexToRgba(COLORS.white, 0.8),
            borderColor: hexToRgba(COLORS.white, 0.6)
          }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: `linear-gradient(to bottom right, ${COLORS.error[100]}, ${COLORS.error[200]})`
            }}
          >
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.gray[900] }}>Error Loading Products</h2>
          <p className="mb-6" style={{ color: COLORS.gray[600] }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
            style={{
              background: `linear-gradient(to right, ${COLORS.primary[500]}, ${COLORS.success[500]})`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[500]}, ${COLORS.success[500]})`;
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.white }}>
      {/* Modern Mobile Header */}
      {isMobile && (
        <div 
          className="relative backdrop-blur-sm border-b px-4 py-3 shadow-sm"
          style={{
            backgroundColor: hexToRgba(COLORS.white, 0.9),
            borderColor: hexToRgba(COLORS.gray[200], 0.5)
          }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary[50];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Bars3Icon className="w-6 h-6" style={{ color: COLORS.gray[700] }} />
            </button>
            <div className="flex items-center gap-2">
              {departmentImage && (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-md"
                  style={{
                    background: `linear-gradient(to bottom right, ${COLORS.primary[50]}, ${COLORS.success[50]})`
                  }}
                >
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
              <h1 
                className="text-lg font-bold bg-clip-text text-transparent"
                style={{
                  background: `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {selectedDepartment || 'Categories'}
              </h1>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div 
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'w-64'}
            border-r transition-transform duration-300 ease-in-out
            ${isMobile ? '' : 'sticky top-0 h-screen overflow-y-auto'}
          `}
          style={{
            backgroundColor: COLORS.white,
            borderColor: COLORS.gray[200]
          }}
        >
          {/* Mobile sidebar header */}
          {isMobile && (
            <div className="relative overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, ${hexToRgba(COLORS.primary[500], 0.1)}, ${hexToRgba(COLORS.success[500], 0.1)}, ${hexToRgba(COLORS.primary[400], 0.1)})`
                }}
              ></div>
              <div 
                className="relative flex items-center justify-between p-4 border-b"
                style={{
                  borderColor: hexToRgba(COLORS.gray[200], 0.5)
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shadow-md"
                    style={{
                      background: `linear-gradient(to bottom right, ${COLORS.primary[50]}, ${COLORS.success[50]})`
                    }}
                  >
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
                  <h2 
                    className="text-lg font-bold bg-clip-text text-transparent"
                    style={{
                      background: `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Subcategories
                  </h2>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.error[50];
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = COLORS.error[500];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = COLORS.gray[600];
                  }}
                >
                  <XMarkIcon className="w-5 h-5 transition-colors" style={{ color: COLORS.gray[600] }} />
                </button>
              </div>
            </div>
          )}

          {/* Desktop sidebar header */}
          {!isMobile && (
            <div style={{ borderBottomColor: COLORS.gray[200] }} className="border-b">
              <div className="p-4">
                <h2 className="text-base font-bold" style={{ color: COLORS.gray[900] }}>{selectedDepartment}</h2>
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
                        className="w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between"
                        style={{
                          backgroundColor: isSelected ? COLORS.primary[50] : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = COLORS.gray[50];
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <span 
                          className="text-sm"
                          style={{
                            color: isSelected ? COLORS.primary[600] : COLORS.gray[700],
                            fontWeight: isSelected ? '600' : 'normal'
                          }}
                        >
                          {category.category_name}
                        </span>
                        {categoryCount > 0 && (
                          <span className="text-xs" style={{ color: COLORS.gray[500] }}>
                            ({categoryCount})
                          </span>
                        )}
                      </button>

                      {/* Nested Subcategories - Only show when category is selected */}
                      {isSelected && subcategories.length > 0 && (
                        <div 
                          className="border-l-2 ml-4"
                          style={{
                            backgroundColor: hexToRgba(COLORS.gray[50], 0.5),
                            borderColor: COLORS.primary[500]
                          }}
                        >
                          {subcategories.map((subcategory) => {
                            const isSubSelected = selectedSubcategory?.idsub_category_master === subcategory.idsub_category_master;
                            return (
                              <button
                                key={subcategory.idsub_category_master}
                                onClick={() => handleSubcategorySelect(subcategory)}
                                className="w-full text-left px-4 py-2 text-sm transition-colors"
                                style={{
                                  backgroundColor: isSubSelected ? COLORS.primary[100] : 'transparent',
                                  color: isSubSelected ? COLORS.primary[700] : COLORS.gray[600],
                                  fontWeight: isSubSelected ? '500' : 'normal'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSubSelected) {
                                    e.currentTarget.style.backgroundColor = COLORS.gray[100];
                                    e.currentTarget.style.color = COLORS.gray[900];
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSubSelected) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = COLORS.gray[600];
                                  }
                                }}
                              >
                                {subcategory.sub_category_name}
                              </button>
                            );
                          })}
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
            className="fixed inset-0 backdrop-blur-sm z-40 animate-fade-in"
            style={{
              background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.black, 0.6)}, ${hexToRgba(COLORS.black, 0.5)}, ${hexToRgba(COLORS.black, 0.6)})`
            }}
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb and Title */}
          <div 
            className="border-b px-4 sm:px-6 py-4"
            style={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.gray[200]
            }}
          >
            <div className="flex items-center text-sm mb-2 flex-wrap" style={{ color: COLORS.gray[500] }}>
              {selectedDepartment && (
                <span style={{ color: COLORS.gray[700] }}>{selectedDepartment}</span>
              )}
              {selectedCategory && (
                <>
                  <span className="mx-2">›</span>
                  <span className="font-medium" style={{ color: COLORS.gray[900] }}>{selectedCategory.category_name}</span>
                </>
              )}
              {selectedSubcategory && (
                <>
                  <span className="mx-2">›</span>
                  <span style={{ color: COLORS.gray[700] }}>{selectedSubcategory.sub_category_name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.gray[900] }}>
              {selectedSubcategory?.sub_category_name || selectedCategory?.category_name || selectedDepartment || 'All Products'}
            </h1>
          </div>

          {/* Filters and Sort Bar */}
          <div 
            className="border-b px-4 sm:px-6 py-3"
            style={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.gray[200]
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="px-4 py-2 rounded-full text-sm transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{
                    backgroundColor: COLORS.white,
                    borderColor: COLORS.gray[300],
                    color: COLORS.gray[700],
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundSize: '1.25rem',
                    backgroundPosition: 'right 0.5rem center'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary[500];
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.gray[300];
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.borderColor = COLORS.gray[400];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.borderColor = COLORS.gray[300];
                    }
                  }}
                >
                  <option value="">Brand</option>
                  {availableBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="px-4 py-2 rounded-full text-sm transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{
                    backgroundColor: COLORS.white,
                    borderColor: COLORS.gray[300],
                    color: COLORS.gray[700],
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundSize: '1.25rem',
                    backgroundPosition: 'right 0.5rem center'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary[500];
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.gray[300];
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.borderColor = COLORS.gray[400];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.borderColor = COLORS.gray[300];
                    }
                  }}
                >
                  <option value="">Category</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: COLORS.gray[700] }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded text-sm transition-all cursor-pointer appearance-none pr-8 bg-no-repeat bg-right"
                  style={{
                    backgroundColor: COLORS.white,
                    borderColor: COLORS.gray[300],
                    color: COLORS.gray[700],
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundSize: '1.25rem',
                    backgroundPosition: 'right 0.5rem center'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary[500];
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.gray[300];
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.borderColor = COLORS.gray[400];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.borderColor = COLORS.gray[300];
                    }
                  }}
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
          <div className="p-4 sm:p-6 relative min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
            {/* Centered Loading State - Shows when loading or no subcategory selected yet */}
            {(productsLoading || !selectedSubcategory) ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div 
                      className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                      style={{
                        borderColor: COLORS.primary[500],
                        borderTopColor: 'transparent'
                      }}
                    ></div>
                    <div 
                      className="absolute inset-0 w-16 h-16 rounded-full blur-lg animate-pulse"
                      style={{
                        backgroundColor: hexToRgba(COLORS.primary[400], 0.2)
                      }}
                    ></div>
                  </div>
                  <p className="font-medium text-lg" style={{ color: COLORS.gray[600] }}>Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {/* Product Cards */}
                  {filteredProducts.map((product, index) => {
                    const uniqueKey = product.p_code || product._id || `${product.product_name}-${index}`;
                    return (
                    <div 
                      key={uniqueKey} 
                      className="group rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: COLORS.white,
                        borderColor: COLORS.gray[200]
                      }}
                      onClick={() => navigate(`/product/${product.p_code || product._id}?dept_id=${product.dept_id || departmentId}&category_id=${product.category_id || selectedCategory?.idcategory_master}&sub_category_id=${product.sub_category_id || selectedSubcategory?.idsub_category_master}`)}
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square flex items-center justify-center overflow-hidden p-4" style={{ backgroundColor: COLORS.white }}>
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite({
                              ...product,
                              p_code: product.p_code || product._id,
                              _id: product.p_code || product._id,
                              product_name: product.product_name,
                              our_price: product.our_price,
                              image_url: product.image_url,
                              brand_name: product.brand_name,
                              package_size: product.package_size,
                              package_unit: product.package_unit,
                              product_mrp: product.product_mrp,
                              discount_percentage: product.discount_percentage,
                              store_quantity: product.store_quantity || 1,
                              max_quantity_allowed: product.max_quantity_allowed || 10
                            });
                          }}
                          className="absolute top-2 right-2 z-20 p-1.5 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                          style={{
                            backgroundColor: hexToRgba(COLORS.white, 0.95)
                          }}
                        >
                          {isFavorite(product.p_code || product._id) ? (
                            <HeartSolid className="w-4 h-4" style={{ color: COLORS.error[500] }} />
                          ) : (
                            <HeartOutline 
                              className="w-4 h-4 transition-colors duration-200" 
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
                        
                        <img
                          src={product.image_url || '/images/logo.jpg'}
                          alt={product.product_name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.target.src = '/images/logo.jpg';
                          }}
                        />
                {product.discount_percentage > 0 && (
                  <div 
                    className="absolute top-2 left-2 text-white text-xs px-2 py-1 rounded font-semibold z-10"
                    style={{ backgroundColor: COLORS.warning[500] }}
                  >
                    ₹ {product.discount_percentage} OFF
                  </div>
                )}
              </div>

                      {/* Product Info */}
                      <div className="p-3 border-t" style={{ borderColor: COLORS.gray[100] }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs mb-1" style={{ color: COLORS.gray[500] }}>MRP <span style={{ color: COLORS.gray[400] }}></span></p>
                            <p className="text-xs line-through" style={{ color: COLORS.gray[400] }}>₹ {product.product_mrp}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs mb-1" style={{ color: COLORS.gray[500] }}>Selling Price <span style={{ color: COLORS.gray[400] }}></span></p>
                            <p className="text-base font-bold" style={{ color: COLORS.gray[900] }}>₹ {product.our_price}</p>
                          </div>
                        </div>

                        <p className="text-xs mb-2" style={{ color: COLORS.gray[500] }}>(Inclusive of all taxes)</p>

                        <h3 className="text-sm mb-2 line-clamp-2 min-h-[2.5rem]" style={{ color: COLORS.gray[900] }}>{product.product_name}</h3>

                        {/* Package Size Display */}
                        {product.package_size && (
                          <div 
                            className="w-full text-xs border rounded px-2 py-1.5 mb-2"
                            style={{
                              borderColor: COLORS.gray[300],
                              backgroundColor: COLORS.white,
                              color: COLORS.gray[700]
                            }}
                          >
                            {product.package_unit && product.package_size.includes(product.package_unit)
                              ? product.package_size
                              : `${product.package_size}${product.package_unit ? ` ${product.package_unit}` : ''}`
                            }
                          </div>
                        )}

                        {/* Add to Cart Button or Quantity Selector */}
                        {!showQuantitySelector[product.p_code || product._id] ? (
                          <button 
                            className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md text-white hover:shadow-lg transform hover:scale-105 active:scale-95"
                            style={{
                              background: (addingToCart[product.p_code || product._id] || !storeEnabled)
                                ? COLORS.gray[400]
                                : `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                              cursor: (addingToCart[product.p_code || product._id] || !storeEnabled) ? 'not-allowed' : 'pointer',
                              opacity: (addingToCart[product.p_code || product._id] || !storeEnabled) ? 0.5 : 1
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent navigation when clicking the button
                              handleAddToCart(product);
                            }}
                            disabled={addingToCart[product.p_code || product._id] || !storeEnabled}
                            title={!storeEnabled ? (getStoreMessage() || 'Store is not accepting orders') : 'Add to cart'}
                            onMouseEnter={(e) => {
                              if (!addingToCart[product.p_code || product._id] && storeEnabled) {
                                e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[700]}, ${COLORS.success[700]})`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!addingToCart[product.p_code || product._id] && storeEnabled) {
                                e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                              }
                            }}
                          >
                            {addingToCart[product.p_code || product._id] ? (
                              <>
                                <div 
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                                ></div>
                                <span>ADDING...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>{!storeEnabled ? 'UNAVAILABLE' : 'ADD'}</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="w-full" onClick={(e) => e.stopPropagation()}>
                            {/* Quantity Selector */}
                            <div 
                              className="flex items-stretch border-2 rounded-lg overflow-hidden shadow-md w-full hover:shadow-lg transition-all duration-200"
                              style={{
                                background: `linear-gradient(to right, ${COLORS.primary[50]}, ${COLORS.success[50]})`,
                                borderColor: COLORS.primary[200]
                              }}
                            >
                              {/* Minus Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(product, (quantities[product.p_code || product._id] || 1) - 1);
                                }}
                                disabled={(quantities[product.p_code || product._id] || 1) <= 1}
                                className="flex items-center justify-center px-3 py-2 transition-all duration-200"
                                style={{
                                  backgroundColor: (quantities[product.p_code || product._id] || 1) <= 1
                                    ? COLORS.gray[200]
                                    : `linear-gradient(to bottom right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                                  color: (quantities[product.p_code || product._id] || 1) <= 1
                                    ? COLORS.gray[400]
                                    : COLORS.white,
                                  cursor: (quantities[product.p_code || product._id] || 1) <= 1 ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  if ((quantities[product.p_code || product._id] || 1) > 1) {
                                    e.currentTarget.style.background = `linear-gradient(to bottom right, ${COLORS.primary[700]}, ${COLORS.success[700]})`;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if ((quantities[product.p_code || product._id] || 1) > 1) {
                                    e.currentTarget.style.background = `linear-gradient(to bottom right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                                  }
                                }}
                              >
                                <MinusIcon className="w-4 h-4 font-bold" strokeWidth={3} />
                              </button>

                              {/* Quantity Display */}
                              <div 
                                className="bg-white px-4 py-2 flex-1 flex items-center justify-center border-x-2"
                                style={{
                                  borderColor: COLORS.primary[200]
                                }}
                              >
                                <span className="text-base font-bold" style={{ color: COLORS.primary[700] }}>
                                  {quantities[product.p_code || product._id] || 1}
                                </span>
                              </div>

                              {/* Plus Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(product, (quantities[product.p_code || product._id] || 1) + 1);
                                }}
                                disabled={(quantities[product.p_code || product._id] || 1) >= (product.max_quantity_allowed || 10)}
                                className="flex items-center justify-center px-3 py-2 transition-all duration-200"
                                style={{
                                  backgroundColor: (quantities[product.p_code || product._id] || 1) >= (product.max_quantity_allowed || 10)
                                    ? COLORS.gray[200]
                                    : `linear-gradient(to bottom right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                                  color: (quantities[product.p_code || product._id] || 1) >= (product.max_quantity_allowed || 10)
                                    ? COLORS.gray[400]
                                    : COLORS.white,
                                  cursor: (quantities[product.p_code || product._id] || 1) >= (product.max_quantity_allowed || 10) ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  if ((quantities[product.p_code || product._id] || 1) < (product.max_quantity_allowed || 10)) {
                                    e.currentTarget.style.background = `linear-gradient(to bottom right, ${COLORS.primary[700]}, ${COLORS.success[700]})`;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if ((quantities[product.p_code || product._id] || 1) < (product.max_quantity_allowed || 10)) {
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
                    );
                  })}
                </div>

                {/* Modern Pagination Controls */}
                {pagination.total_pages > 1 && (
                  <div className="mt-10 pt-8 border-t" style={{ borderColor: COLORS.gray[200] }}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>
                        Showing <span className="font-bold" style={{ color: COLORS.primary[600] }}>{products.length}</span> of <span className="font-bold" style={{ color: COLORS.primary[600] }}>{pagination.total_products}</span> products
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.has_prev}
                          className="px-4 sm:px-6 py-3 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:hover:scale-100"
                          style={{
                            background: !pagination.has_prev 
                              ? COLORS.gray[300]
                              : `linear-gradient(to right, ${COLORS.primary[500]}, ${COLORS.success[500]})`,
                            opacity: !pagination.has_prev ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (pagination.has_prev) {
                              e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pagination.has_prev) {
                              e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[500]}, ${COLORS.success[500]})`;
                            }
                          }}
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1.5">
                          {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                            const pageNum = i + 1;
                            const isActive = currentPage === pageNum;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className="px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300"
                                style={{
                                  background: isActive 
                                    ? `linear-gradient(to right, ${COLORS.primary[500]}, ${COLORS.success[500]})`
                                    : COLORS.white,
                                  color: isActive ? COLORS.white : COLORS.gray[700],
                                  border: isActive ? 'none' : `2px solid ${COLORS.gray[200]}`,
                                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                  boxShadow: isActive ? '0 10px 15px rgba(0, 0, 0, 0.1)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.borderColor = COLORS.primary[400];
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.borderColor = COLORS.gray[200];
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }
                                }}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.has_next}
                          className="px-4 sm:px-6 py-3 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:hover:scale-100"
                          style={{
                            background: !pagination.has_next 
                              ? COLORS.gray[300]
                              : `linear-gradient(to right, ${COLORS.success[500]}, ${COLORS.primary[400]})`,
                            opacity: !pagination.has_next ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (pagination.has_next) {
                              e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.success[600]}, ${COLORS.primary[500]})`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pagination.has_next) {
                              e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.success[500]}, ${COLORS.primary[400]})`;
                            }
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div 
                      className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse"
                      style={{
                        background: `linear-gradient(to bottom right, ${COLORS.primary[400]}, ${COLORS.success[400]})`
                      }}
                    ></div>
                    <div 
                      className="relative w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-xl"
                      style={{
                        background: `linear-gradient(to bottom right, ${COLORS.primary[100]}, ${COLORS.success[100]})`
                      }}
                    >
                      <span className="text-6xl">📦</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: COLORS.gray[900] }}>No Products Found</h3>
                  <p className="mb-6 max-w-md mx-auto" style={{ color: COLORS.gray[600] }}>
                    Try adjusting your filters or browse different subcategories to find what you're looking for
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                    style={{
                      background: `linear-gradient(to right, ${COLORS.primary[500]}, ${COLORS.success[500]})`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[500]}, ${COLORS.success[500]})`;
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
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
          background: ${COLORS.gray[100]};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, ${COLORS.primary[500]}, ${COLORS.success[500]});
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, ${COLORS.primary[600]}, ${COLORS.success[600]});
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default CategoryPage;