import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import GroceryProductCard from '../components/GroceryProductCard';
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import groceryApiService from '../services/groceryApi';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // State management
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    type: '',
    properties: '',
    weight: '',
    availability: ''
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await groceryApiService.getCategories();
        if (response.success) {
          setCategories(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Load products when category changes
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        if (categoryName) {
          // Load products for specific category
          const response = await groceryApiService.getProductsByCategory(categoryName, selectedSubcategory);
          if (response.success) {
            setProducts(response.data);
            setSelectedCategory(response.category);
          } else {
            setError(response.message);
          }
        } else {
          // Load all products if no specific category
          const response = await groceryApiService.getAllProducts();
          if (response.success) {
            setProducts(response.data);
            setSelectedCategory(null);
          } else {
            setError(response.message);
          }
        }
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryName, selectedSubcategory]);

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
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        filtered.sort((a, b) => b.discount - a.discount);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Keep original order for relevance
        break;
    }

    return filtered;
  }, [products, filters, sortBy]);

  // Get unique brands from filtered products
  const availableBrands = useMemo(() => {
    const brands = [...new Set(filteredProducts.map(product => product.brand))];
    return brands.sort();
  }, [filteredProducts]);

  // Handle category selection
  const handleCategorySelect = (category) => {
    const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/category/${categorySlug}`);
  };

  // Handle subcategory selection
  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
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
      type: '',
      properties: '',
      weight: '',
      availability: ''
    });
    setSelectedSubcategory(null);
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
            {selectedCategory?.name || 'Categories'}
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
              <h2 className="text-xl font-bold text-gray-800">Grocery</h2>
            </div>
          )}

          {/* Categories List */}
          <div className="overflow-y-auto h-full">
            <div className="p-4 space-y-1">
              {selectedCategory ? (
                // Show only the selected category and its subcategories
                <div>
                  <div className="px-4 py-3 bg-green-50 text-green-700 border-l-4 border-green-500 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{selectedCategory.name}</span>
                      <span className="text-sm text-gray-500">({selectedCategory.count})</span>
                    </div>
                  </div>
                  
                  {/* Back to All Categories Button */}
                  <button
                    onClick={() => navigate('/')}
                    className="w-full text-left px-4 py-2 mt-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    ← Back to All Categories
                  </button>
                  
                  {/* Subcategories */}
                  {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1">
                      {selectedCategory.subcategories.map((subcategory, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={() => handleSubcategorySelect(subcategory)}
                          className={`
                            w-full text-left px-4 py-2 rounded-lg transition-colors text-sm
                            ${selectedSubcategory === subcategory
                              ? 'bg-green-100 text-green-700'
                              : 'text-gray-600 hover:bg-gray-50'
                            }
                          `}
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Show all categories if no specific category selected
                categories.map((category, index) => (
                  <div key={index}>
                    <button
                      onClick={() => handleCategorySelect(category)}
                      className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between text-gray-700 hover:bg-gray-50"
                    >
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-gray-500">({category.count})</span>
                    </button>
                  </div>
                ))
              )}
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
              <span>Grocery</span>
              {selectedCategory && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-gray-900 font-medium">{selectedCategory.name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {selectedCategory?.name || 'All Products'}
            </h1>
            {selectedCategory && (
              <p className="text-gray-600 text-sm mt-1">
                {filteredProducts.length} products found
              </p>
            )}
          </div>

          {/* Filters and Sort */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter Dropdowns */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="px-3 py-2 border border-green-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Brand</option>
                  {availableBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="px-3 py-2 border border-green-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Category</option>
                  <option value="organic">Organic</option>
                  <option value="premium">Premium</option>
                </select>

                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="px-3 py-2 border border-green-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Type</option>
                  <option value="whole">Whole</option>
                  <option value="split">Split</option>
                </select>

                <select
                  value={filters.properties}
                  onChange={(e) => handleFilterChange('properties', e.target.value)}
                  className="px-3 py-2 border border-green-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Properties</option>
                  <option value="unpolished">Unpolished</option>
                  <option value="polished">Polished</option>
                </select>

                <select
                  value={filters.weight}
                  onChange={(e) => handleFilterChange('weight', e.target.value)}
                  className="px-3 py-2 border border-green-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Weight</option>
                  <option value="500g">500g</option>
                  <option value="1kg">1kg</option>
                </select>

                <select
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="px-3 py-2 border border-green-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Availability</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
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

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="p-4 sm:p-6">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <GroceryProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(productData) => {
                      // Handle add to cart logic here
                      console.log('Add to cart:', productData);
                    }}
                  />
                ))}
              </div>
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
