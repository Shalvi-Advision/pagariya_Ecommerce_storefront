import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import GroceryProductCard from '../components/GroceryProductCard';
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { getProducts } from '../api/productsApi';
import groceryApiService from '../services/groceryApi';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // State management
  const [selectedDepartment, setSelectedDepartment] = useState(null);
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
  const [loading, setLoading] = useState(true);
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

  // Convert category slug back to department name
  const getDepartmentNameFromSlug = (slug) => {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Load department and categories on component mount
  useEffect(() => {
    const loadDepartmentData = async () => {
      try {
        setLoading(true);
        const departmentName = getDepartmentNameFromSlug(categoryName);
        setSelectedDepartment(departmentName);
        
        // Load categories for this department
        const response = await groceryApiService.getActiveCategoriesByDepartmentName(departmentName);
        if (response.success) {
          setCategories(response.data);
        } else {
          // Fallback to dummy categories if API fails
          setCategories([
            { category_name: 'Cooker', category_id: 1, product_count: 45 },
            { category_name: 'Kadai / Handi / Pans', category_id: 2, product_count: 78 },
            { category_name: 'Cookware Sets', category_id: 3, product_count: 32 },
            { category_name: 'Pressure Cookers', category_id: 4, product_count: 56 },
            { category_name: 'Non-Stick Cookware', category_id: 5, product_count: 67 },
            { category_name: 'Stainless Steel Cookware', category_id: 6, product_count: 43 }
          ]);
        }
      } catch (err) {
        console.error('Error loading department data:', err);
        setError('Failed to load department data');
      } finally {
        setLoading(false);
      }
    };

    if (categoryName) {
      loadDepartmentData();
    }
  }, [categoryName]);

  // Load products when category changes
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use productsApi to fetch products
        const response = await getProducts({
          page: currentPage,
          limit: 20,
          dept_id: "2", // Default department ID
          category_id: selectedCategory?.category_id?.toString() || "72", // Use selected category or default
          sub_category_id: "391" // Default sub-category ID
        });

        if (response) {
          setProducts(response.products || []);
          setPagination(response.pagination || {
            page: currentPage,
            limit: 20,
            total_products: response.products?.length || 0,
            total_pages: 1,
            has_next: false,
            has_prev: false
          });
        } else {
          setError('Failed to load products');
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCategory, currentPage]);

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

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when category changes
  };

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {selectedDepartment || 'Categories'}
          </h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80' : 'w-80'}
          bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          ${isMobile ? '' : 'sticky top-0 h-screen'}
        `}>
          {/* Mobile sidebar header */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Desktop sidebar header */}
          {!isMobile && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">{selectedDepartment}</h2>
            </div>
          )}

          {/* Categories List */}
          <div className="overflow-y-auto h-full">
            <div className="p-4 space-y-1">
              {categories.map((category, index) => (
                <div key={index}>
                  <button
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory?.category_id === category.category_id
                        ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{category.category_name}</span>
                    <span className="text-sm text-gray-500">({category.product_count || 0})</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb and Title */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>Home</span>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">{selectedDepartment}</span>
              {selectedCategory && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-gray-900 font-medium">{selectedCategory.category_name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {selectedCategory?.category_name || selectedDepartment || 'All Products'}
            </h1>
          </div>

          {/* Filters and Sort */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter Dropdowns */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Brand</option>
                  {availableBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Category</option>
                  <option value="pressure-cooker">Pressure Cooker</option>
                  <option value="kadai">Kadai</option>
                  <option value="handi">Handi</option>
                  <option value="pans">Pans</option>
                </select>

                <select
                  value={filters.colour}
                  onChange={(e) => handleFilterChange('colour', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Colour</option>
                  <option value="silver">Silver</option>
                  <option value="black">Black</option>
                  <option value="gold">Gold</option>
                  <option value="copper">Copper</option>
                </select>

                <select
                  value={filters.material}
                  onChange={(e) => handleFilterChange('material', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Material</option>
                  <option value="stainless-steel">Stainless Steel</option>
                  <option value="aluminum">Aluminum</option>
                  <option value="cast-iron">Cast Iron</option>
                  <option value="non-stick">Non-Stick</option>
                </select>

                <select
                  value={filters.capacity}
                  onChange={(e) => handleFilterChange('capacity', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Capacity</option>
                  <option value="1.5L">1.5 L</option>
                  <option value="3L">3 L</option>
                  <option value="5.5L">5.5 L</option>
                  <option value="7L">7 L</option>
                </select>

                <select
                  value={filters.warranty}
                  onChange={(e) => handleFilterChange('warranty', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Warranty</option>
                  <option value="1-year">1 Year</option>
                  <option value="2-year">2 Year</option>
                  <option value="5-year">5 Year</option>
                </select>

                <select
                  value={filters.volume}
                  onChange={(e) => handleFilterChange('volume', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Volume</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>

                <select
                  value={filters.dimension}
                  onChange={(e) => handleFilterChange('dimension', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Dimension</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          <div className="p-4 sm:p-6">
            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Promotional Banner - takes 2 grid spaces */}
                  <div className="sm:col-span-2 bg-green-600 rounded-lg p-6 text-white flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Now, Save EXTRA with the new GST rate benefits.</h3>
                      <p className="text-green-100 mb-4">Get amazing discounts on your favorite products</p>
                      <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                        SEE HOW
                      </button>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">G</div>
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">S</div>
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">T</div>
                      </div>
                    </div>
                  </div>

                  {/* Product Cards */}
                  {filteredProducts.map((product, index) => (
                    <div key={product._id || product.p_code || index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <img 
                          src={product.image_url || '/images/placeholder-product.jpg'} 
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/images/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{product.product_name}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-gray-900">₹{product.our_price}</span>
                          <span className="text-sm text-gray-500 line-through">₹{product.product_mrp}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            {product.discount_percentage || 0}% OFF
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          {product.package_size || '1 U'}
                        </div>
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                          ADD TO CART
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.total_pages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.has_prev}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-green-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Products count info */}
                <div className="mt-4 text-center text-sm text-gray-500">
                  Showing {products.length} of {pagination.total_products} products
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or browse different categories
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;