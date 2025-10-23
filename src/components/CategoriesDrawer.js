import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getActiveDepartments, getActiveCategories, getActiveSubcategories } from '../services/groceryApi';
import { APP_CONSTANTS } from '../constants';
import { usePincode } from '../context/PincodeContext';

const CategoriesDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { openPincodeModal } = usePincode();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState({});
  const [expandedDepartment, setExpandedDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState({});
  const [error, setError] = useState(null);
  const [requiresStoreSelection, setRequiresStoreSelection] = useState(false);
  const [requiresStoreChange, setRequiresStoreChange] = useState(false);
  
  const handleCategoryClick = (categoryName, departmentName, categoryData) => {
    // Navigate to department page (CategoryPage) with department slug
    const departmentSlug = departmentName.toLowerCase().replace(/\s+/g, '-');
    // Pass category info via state so CategoryPage can auto-select it
    navigate(`/category/${departmentSlug}`, {
      state: {
        selectedCategoryName: categoryName,
        selectedCategoryId: categoryData?.idcategory_master
      }
    });
    onClose();
  };

  const handleDepartmentClick = (departmentId) => {
    if (expandedDepartment === departmentId) {
      setExpandedDepartment(null);
    } else {
      setExpandedDepartment(departmentId);
      // Load categories for this department if not already loaded
      if (!categories[departmentId]) {
        loadCategoriesForDepartment(departmentId);
      }
    }
  };

  // Icon mapping for departments
  const getDepartmentIcon = (departmentName) => {
    const iconMap = {
      'GROCERY & STAPLES': '🛒',
      'FRUITS & VEGETABLES': '🥕',
      'DAIRY & BEVERAGES': '🥛',
      'PACKAGED FOOD': '📦',
      'PERSONAL CARE': '💄',
      'HOME & KITCHEN': '🏠',
      'CLEANING SUPPLIES': '🧽',
      'BABY CARE': '👶',
      'PET CARE': '🐾',
      'HEALTH & WELLNESS': '💊',
      'HOUSEHOLD ITEMS': '🏠',
      'STATIONERY & OFFICE': '✏️',
      'AUTOMOTIVE': '🚗',
      'ELECTRONICS': '📱',
      'FASHION & CLOTHING': '👕',
      'HOME FURNISHING': '🛏️',
      'BOOKS & MEDIA': '📚',
      'SPORTS & FITNESS': '⚽',
      'GARDEN & OUTDOOR': '🌱',
      'TOYS & GAMES': '🎮',
      'JEWELRY & WATCHES': '💍'
    };
    return iconMap[departmentName] || '📦';
  };

  // Default fallback values
  const getDefaultImage = () => '/images/logo.jpg';
  const getDefaultBgColor = () => '#f3f4f6';

  // Load categories for a specific department
  const loadCategoriesForDepartment = useCallback(async (departmentId) => {
    setCategoriesLoading(prev => ({ ...prev, [departmentId]: true }));
    
    try {
      const response = await getActiveCategories(departmentId);
      if (response.success) {
        setCategories(prev => ({
          ...prev,
          [departmentId]: response.data || []
        }));
      } else {
        console.error('Failed to load categories for department:', departmentId, response.message);
        setCategories(prev => ({
          ...prev,
          [departmentId]: []
        }));
      }
    } catch (err) {
      console.error('Error loading categories for department:', departmentId, err);
      setCategories(prev => ({
        ...prev,
        [departmentId]: []
      }));
    } finally {
      setCategoriesLoading(prev => ({ ...prev, [departmentId]: false }));
    }
  }, []);

  // Load departments from API
  useEffect(() => {
    const loadDepartments = async () => {
      if (!isOpen) return;

      setLoading(true);
      setError(null);
      setRequiresStoreSelection(false);
      setRequiresStoreChange(false);

      try {
        const response = await getActiveDepartments();
        if (response.success) {
          setDepartments(response.data || []);
        } else {
          // Check if store selection is required
          if (response.requiresStoreSelection) {
            setRequiresStoreSelection(true);
            setError(response.message || 'Please select a store to continue');
          } else if (response.requiresStoreChange) {
            setRequiresStoreChange(true);
            setError(response.message || 'No departments available for your store');
          } else {
            setError(response.message || 'Failed to load departments');
          }
        }
      } catch (err) {
        setError('Failed to load departments');
        console.error('Error loading departments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modern Backdrop with Blur */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-40 transition-all duration-300 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modern Drawer - positioned below the header bar */}
      <div className="fixed top-12 left-0 w-full bg-gradient-to-br from-white via-gray-50 to-white z-50 shadow-2xl border-t-4 border-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-slide-up" style={{ height: 'calc(100vh - 3rem)' }}>
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          {/* Header Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10"></div>
          
          <div className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-200/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  All Categories
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block">Explore our wide range of products</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-2 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Modern Categories Grid */}
        <div className="h-full overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-white custom-scrollbar" style={{ height: 'calc(100vh - 6rem)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-transparent border-t-emerald-500 border-r-teal-500 border-b-cyan-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-full blur-lg animate-pulse"></div>
                </div>
                <p className="mt-4 text-gray-600 text-base font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Loading categories...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/60 mx-4">
                <div className={`w-20 h-20 bg-gradient-to-br ${
                  requiresStoreSelection ? 'from-blue-100 to-cyan-100' :
                  requiresStoreChange ? 'from-amber-100 to-orange-100' :
                  'from-red-100 to-rose-100'
                } rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-4xl">{
                    requiresStoreSelection ? '🏪' :
                    requiresStoreChange ? '📦' :
                    '⚠️'
                  }</span>
                </div>
                <p className={`${
                  requiresStoreSelection ? 'text-blue-600' :
                  requiresStoreChange ? 'text-amber-600' :
                  'text-red-600'
                } mb-2 text-base font-semibold`}>
                  {requiresStoreSelection ? 'Store Selection Required' :
                   requiresStoreChange ? 'No Products Available' :
                   'Failed to load categories'}
                </p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                {requiresStoreSelection || requiresStoreChange ? (
                  <button
                    onClick={() => {
                      openPincodeModal();
                      onClose();
                    }}
                    className={`px-6 py-3 bg-gradient-to-r ${
                      requiresStoreSelection ? 'from-blue-500 to-cyan-500' : 'from-amber-500 to-orange-500'
                    } text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300`}
                  >
                    {requiresStoreSelection ? 'Select Store' : 'Change Store'}
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-50">
              {/* Departments Grid - DMart Style Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                {departments.map((department, index) => {
                  const departmentId = department.department_id;
                  const departmentName = department.department_name;
                  const departmentImage = department.image_link || getDefaultImage();
                  const departmentCategories = categories[departmentId] || [];
                  const isLoadingCategories = categoriesLoading[departmentId] || false;

                  // Load categories if not already loaded
                  if (!categories[departmentId] && !categoriesLoading[departmentId]) {
                    loadCategoriesForDepartment(departmentId);
                  }

                  return (
                    <div key={index} className="flex flex-col">
                      {/* Department Icon & Name */}
                      <div className="flex flex-col items-center mb-3">
                        {/* Department Icon/Image */}
                        <div className="w-16 h-16 mb-2 flex items-center justify-center">
                          {department.image_link ? (
                            <img
                              src={departmentImage}
                              alt={departmentName}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const iconElement = e.target.parentElement.querySelector('.fallback-icon');
                                if (iconElement) iconElement.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`fallback-icon ${department.image_link ? 'hidden' : 'flex'} items-center justify-center`}
                          >
                            <span className="text-5xl">
                              {getDepartmentIcon(departmentName)}
                            </span>
                          </div>
                        </div>

                        {/* Department Name */}
                        <h3 className="text-sm font-bold text-gray-900 text-center uppercase tracking-wide">
                          {departmentName}
                        </h3>
                      </div>

                      {/* Categories List */}
                      <div className="space-y-1">
                        {isLoadingCategories ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : departmentCategories.length > 0 ? (
                          <>
                            {/* Filter out duplicate categories */}
                            {departmentCategories
                              .filter((category, index, self) => {
                                const identifier = category.idcategory_master || category.category_name;
                                return index === self.findIndex(c =>
                                  (c.idcategory_master || c.category_name) === identifier
                                );
                              })
                              .map((category) => (
                                <button
                                  key={category.idcategory_master || category.category_name}
                                  onClick={() => handleCategoryClick(category.category_name, departmentName, category)}
                                  className="block w-full text-left text-sm text-gray-700 hover:text-green-600 hover:underline transition-colors py-0.5"
                                >
                                  {category.category_name || 'Not Available'}
                                </button>
                              ))
                            }
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-xs text-gray-500">No categories</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty State if no categories */}
              {departments.length === 0 && !loading && !error && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/60">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🛒</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Categories Found</h3>
                    <p className="text-sm text-gray-600">Categories will appear here once they're available</p>
                  </div>
                </div>
              )}
            </div>
          )}
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
    </>
  );
};

export default CategoriesDrawer;
