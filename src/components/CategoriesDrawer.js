import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PRODUCT_IMAGE, onProductImageError } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getActiveDepartments, getActiveCategories, getActiveSubcategories } from '../services/groceryApi';
import { APP_CONSTANTS } from '../constants';
import { usePincode } from '../context/PincodeContext';
import { COLORS } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const CategoriesDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { openPincodeModal } = usePincode();
  const { isMobile } = useResponsive();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState({});
  const [expandedDepartment, setExpandedDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState({});
  const [error, setError] = useState(null);
  const [requiresStoreSelection, setRequiresStoreSelection] = useState(false);
  const [requiresStoreChange, setRequiresStoreChange] = useState(false);
  const [viewMode, setViewMode] = useState('departments'); // 'departments' | 'categories'
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
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

  const handleDepartmentClick = async (department) => {
    const departmentId = department.department_id;
    // Load categories for this department if not already loaded
    if (!categories[departmentId]) {
      await loadCategoriesForDepartment(departmentId);
    }
    // Set selected department
    setSelectedDepartment(department);
    // For mobile: keep in departments view (split screen)
    // For desktop: switch to categories view
    if (!isMobile) {
      setViewMode('categories');
    }
  };

  const handleBackToDepartments = () => {
    setViewMode('departments');
    setSelectedDepartment(null);
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
  const getDefaultImage = () => DEFAULT_PRODUCT_IMAGE;
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
      // Reset view when drawer opens
      setViewMode('departments');
      setSelectedDepartment(null);

      try {
        const response = await getActiveDepartments();
        if (response.success) {
          const departmentsList = response.data || [];
          setDepartments(departmentsList);
          
          // On mobile, automatically select the first department and load its categories
          if (isMobile && departmentsList.length > 0) {
            const firstDepartment = departmentsList[0];
            setSelectedDepartment(firstDepartment);
            // Load categories for the first department
            if (!categories[firstDepartment.department_id]) {
              loadCategoriesForDepartment(firstDepartment.department_id);
            }
          }
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
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modern Backdrop with Blur */}
      <div 
        className="fixed inset-0 backdrop-blur-sm z-40 transition-all duration-300 animate-fade-in"
        style={{
          background: `linear-gradient(to bottom right, ${hexToRgba(COLORS.black, 0.6)}, ${hexToRgba(COLORS.black, 0.5)}, ${hexToRgba(COLORS.black, 0.6)})`
        }}
        onClick={onClose}
      />
      
      {/* Modern Drawer - positioned below the header bar */}
      <div 
        className="fixed top-12 left-0 w-full z-50 shadow-2xl animate-slide-up" 
        style={{ 
          height: 'calc(100vh - 3rem)',
          background: `linear-gradient(to bottom right, ${COLORS.white}, ${COLORS.gray[50]}, ${COLORS.white})`,
          borderTop: `4px solid ${COLORS.primary[500]}`
        }}
      >
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          {/* Header Background Gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: hexToRgba(COLORS.primary[500], 0.05)
            }}
          ></div>
          
          <div 
            className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b backdrop-blur-sm"
            style={{
              borderColor: hexToRgba(COLORS.gray[200], 0.5)
            }}
          >
            <div className="flex items-center gap-3">
              {/* Back Button - Only show in categories view on desktop/tablet */}
              {viewMode === 'categories' && !isMobile && (
                <button
                  onClick={handleBackToDepartments}
                  className="p-2 rounded-xl transition-all duration-300 hover:scale-110 flex-shrink-0"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.primary[50];
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = COLORS.primary[600];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = COLORS.gray[600];
                  }}
                >
                  <ArrowLeftIcon 
                    className="w-6 h-6 transition-colors" 
                    style={{ color: COLORS.gray[600] }}
                  />
                </button>
              )}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ backgroundColor: COLORS.primary[500] }}
              >
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h2
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: COLORS.primary[600] }}
                >
                  Shop by Category
                </h2>
                <p className="text-xs hidden sm:block" style={{ color: COLORS.gray[500] }}>Explore our wide range of products</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-2 rounded-xl transition-all duration-300 hover:scale-110"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.error[50];
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.color = COLORS.error[500];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.color = COLORS.gray[500];
              }}
            >
              <XMarkIcon 
                className="w-6 h-6 transition-colors" 
                style={{ color: COLORS.gray[500] }}
              />
            </button>
          </div>
        </div>

        {/* Modern Categories Grid */}
        <div 
          className="h-full overflow-y-auto custom-scrollbar" 
          style={{ 
            height: 'calc(100vh - 6rem)',
            background: `linear-gradient(to bottom right, ${COLORS.white}, ${COLORS.gray[50]}, ${COLORS.white})`
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
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
                      background: hexToRgba(COLORS.primary[400], 0.2)
                    }}
                  ></div>
                </div>
                <p 
                  className="mt-4 text-base font-semibold bg-clip-text text-transparent"
                  style={{
                    color: COLORS.gray[600],
                    color: COLORS.primary[600]
                  }}
                >
                  Loading categories...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div 
                className="text-center backdrop-blur-lg rounded-3xl p-8 shadow-2xl border mx-4"
                style={{
                  backgroundColor: hexToRgba(COLORS.white, 0.8),
                  borderColor: hexToRgba(COLORS.white, 0.6)
                }}
              >
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: requiresStoreSelection 
                      ? `linear-gradient(to bottom right, ${COLORS.secondary[100]}, ${COLORS.secondary[200]})`
                      : requiresStoreChange
                      ? `linear-gradient(to bottom right, ${COLORS.warning[100]}, ${COLORS.warning[200]})`
                      : `linear-gradient(to bottom right, ${COLORS.error[100]}, ${COLORS.error[200]})`
                  }}
                >
                  <span className="text-4xl">{
                    requiresStoreSelection ? '🏪' :
                    requiresStoreChange ? '📦' :
                    '⚠️'
                  }</span>
                </div>
                <p 
                  className="mb-2 text-base font-semibold"
                  style={{
                    color: requiresStoreSelection 
                      ? COLORS.secondary[600]
                      : requiresStoreChange
                      ? COLORS.warning[600]
                      : COLORS.error[600]
                  }}
                >
                  {requiresStoreSelection ? 'Store Selection Required' :
                   requiresStoreChange ? 'No Products Available' :
                   'Failed to load categories'}
                </p>
                <p className="text-sm mb-4" style={{ color: COLORS.gray[500] }}>{error}</p>
                {requiresStoreSelection || requiresStoreChange ? (
                  <button
                    onClick={() => {
                      openPincodeModal();
                      onClose();
                    }}
                    className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                    style={{
                      background: requiresStoreSelection
                        ? `linear-gradient(to right, ${COLORS.secondary[500]}, ${COLORS.secondary[400]})`
                        : `linear-gradient(to right, ${COLORS.warning[500]}, ${COLORS.warning[400]})`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {requiresStoreSelection ? 'Select Store' : 'Change Store'}
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                    style={{
                      background: COLORS.primary[500]
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'departments' || (viewMode === 'departments' && isMobile) ? (
            /* Mobile: Split Screen | Desktop: Departments View */
            isMobile ? (
              /* Mobile Split Screen Layout - Pagariya Mart style */
              <div className="flex h-full" style={{ background: COLORS.gray[50] }}>
                {/* Left Side - Departments List */}
                <div
                  className="w-[30%] overflow-y-auto border-r"
                  style={{
                    borderColor: COLORS.gray[200],
                    background: COLORS.white,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <div className="py-1">
                    {departments.map((department, index) => {
                      const departmentId = department.department_id;
                      const departmentName = department.department_name;
                      const departmentImage = department.image_link || getDefaultImage();
                      const isSelected = selectedDepartment?.department_id === departmentId;

                      if (!categories[departmentId] && !categoriesLoading[departmentId]) {
                        loadCategoriesForDepartment(departmentId);
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleDepartmentClick(department)}
                          className="w-full flex flex-col items-center py-2 px-1 transition-all duration-200"
                          style={{
                            backgroundColor: isSelected ? COLORS.primary[50] : 'transparent',
                            borderLeft: isSelected ? `3px solid ${COLORS.primary[500]}` : '3px solid transparent'
                          }}
                        >
                          <div
                            className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center mb-1"
                            style={{
                              backgroundColor: COLORS.gray[50],
                              border: `1px solid ${isSelected ? COLORS.primary[200] : COLORS.gray[200]}`
                            }}
                          >
                            <img
                              src={departmentImage}
                              alt={departmentName}
                              className="w-full h-full object-contain p-0.5"
                              onError={(e) => { e.target.src = getDefaultImage(); }}
                            />
                          </div>
                          <span
                            className="text-[9px] font-semibold text-center leading-tight line-clamp-2 w-full px-0.5"
                            style={{ color: isSelected ? COLORS.primary[700] : COLORS.gray[700] }}
                          >
                            {departmentName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side - Categories Grid */}
                <div
                  className="flex-1 overflow-y-auto px-2 pb-4"
                  style={{
                    background: COLORS.gray[50],
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {selectedDepartment ? (() => {
                    const departmentId = selectedDepartment.department_id;
                    const departmentName = selectedDepartment.department_name;
                    const departmentCategories = categories[departmentId] || [];
                    const isLoadingCategories = categoriesLoading[departmentId] || false;

                    if (isLoadingCategories) {
                      return (
                        <div className="flex items-center justify-center py-12">
                          <div
                            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                            style={{ borderColor: COLORS.primary[500] }}
                          ></div>
                        </div>
                      );
                    }

                    if (departmentCategories.length === 0) {
                      return (
                        <div className="flex items-center justify-center py-12">
                          <p className="text-xs" style={{ color: COLORS.gray[500] }}>No categories available</p>
                        </div>
                      );
                    }

                    const uniqueCategories = departmentCategories.filter((category, idx, self) => {
                      const identifier = category.idcategory_master || category.category_name;
                      return idx === self.findIndex(c =>
                        (c.idcategory_master || c.category_name) === identifier
                      );
                    });

                    return (
                      <>
                        {/* Department Name Header Pill */}
                        <div className="py-2 sticky top-0 z-10" style={{ background: COLORS.gray[50] }}>
                          <div
                            className="text-center py-2 px-4 rounded-full text-xs font-semibold mx-auto"
                            style={{
                              backgroundColor: hexToRgba(COLORS.primary[100], 0.6),
                              color: COLORS.primary[700],
                              maxWidth: 'fit-content'
                            }}
                          >
                            {departmentName}
                          </div>
                        </div>

                        {/* Category Cards Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {uniqueCategories.map((category) => {
                            const categoryImage = category.image_link || null;
                            return (
                              <button
                                key={category.idcategory_master || category.category_name}
                                onClick={() => handleCategoryClick(category.category_name, departmentName, category)}
                                className="bg-white rounded-2xl shadow-sm active:scale-95 transition-all duration-200 flex flex-col items-center overflow-hidden"
                                style={{
                                  border: `1px solid ${COLORS.gray[200]}`
                                }}
                              >
                                <div className="w-full flex items-center justify-center p-2 pt-3">
                                  <img
                                    src={categoryImage || getDefaultImage()}
                                    alt={category.category_name || 'Category'}
                                    className="w-16 h-16 object-contain"
                                    onError={(e) => { e.target.src = getDefaultImage(); }}
                                  />
                                </div>
                                <p className="text-[10px] font-medium text-center leading-tight line-clamp-2 px-1.5 pb-2" style={{ color: COLORS.gray[800] }}>
                                  {category.category_name || 'Not Available'}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    );
                  })() : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs" style={{ color: COLORS.gray[500] }}>Select a department</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Desktop: Departments View - 2 Column Grid */
              <div 
                className="p-3 sm:p-4"
                style={{
                  background: `linear-gradient(to bottom right, ${COLORS.gray[50]}, ${COLORS.white})`
                }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                  {departments.map((department, index) => {
                    const departmentId = department.department_id;
                    const departmentName = department.department_name;
                    const departmentImage = department.image_link || getDefaultImage();

                    // Load categories if not already loaded (preload for better UX)
                    if (!categories[departmentId] && !categoriesLoading[departmentId]) {
                      loadCategoriesForDepartment(departmentId);
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleDepartmentClick(department)}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 group"
                        style={{
                          borderColor: COLORS.gray[200],
                          minHeight: '56px' // Touch-friendly minimum height
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.primary[300];
                          e.currentTarget.style.backgroundColor = COLORS.primary[50];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = COLORS.gray[200];
                          e.currentTarget.style.backgroundColor = COLORS.white;
                        }}
                      >
                        {/* Department Icon/Image */}
                        <div 
                          className="w-16 h-16 sm:w-16 sm:h-16 flex-shrink-0 bg-white rounded-lg flex items-center justify-center shadow-sm border mx-auto sm:mx-0 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:shadow-md"
                          style={{
                            borderColor: COLORS.gray[200],
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.15)';
                            e.currentTarget.style.boxShadow = `0 6px 16px ${hexToRgba(COLORS.primary[300], 0.4)}`;
                            e.currentTarget.style.borderColor = COLORS.primary[300];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.borderColor = COLORS.gray[200];
                          }}
                        >
                          <img
                            src={departmentImage}
                            alt={departmentName}
                            className="w-full h-full object-contain p-1 transition-transform duration-300"
                            style={{
                              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            onError={(e) => {
                              e.target.src = getDefaultImage();
                            }}
                          />
                        </div>

                        {/* Department Name */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <h3 
                            className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 sm:truncate"
                          >
                            {departmentName}
                          </h3>
                        </div>

                        {/* Chevron Icon - Hidden on mobile, shown on larger screens */}
                        <ChevronRightIcon 
                          className="hidden sm:block w-5 h-5 flex-shrink-0 transition-colors" 
                          style={{ color: COLORS.gray[400] }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Empty State if no departments */}
                {departments.length === 0 && !loading && !error && (
                  <div className="flex items-center justify-center py-12">
                    <div 
                      className="text-center backdrop-blur-lg rounded-3xl p-8 shadow-2xl border"
                      style={{
                        backgroundColor: hexToRgba(COLORS.white, 0.8),
                        borderColor: hexToRgba(COLORS.white, 0.6)
                      }}
                    >
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{
                          background: `linear-gradient(to bottom right, ${COLORS.gray[100]}, ${COLORS.gray[200]})`
                        }}
                      >
                        <span className="text-4xl">🛒</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.gray[800] }}>No Categories Found</h3>
                      <p className="text-sm" style={{ color: COLORS.gray[600] }}>Categories will appear here once they're available</p>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : viewMode === 'categories' && selectedDepartment ? (
            /* Categories View - Compact List */
            <div 
              className="p-3 sm:p-4"
              style={{
                background: `linear-gradient(to bottom right, ${COLORS.gray[50]}, ${COLORS.white})`
              }}
            >
              {(() => {
                const departmentId = selectedDepartment.department_id;
                const departmentName = selectedDepartment.department_name;
                const departmentCategories = categories[departmentId] || [];
                const isLoadingCategories = categoriesLoading[departmentId] || false;

                if (isLoadingCategories) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div 
                          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                          style={{
                            borderColor: COLORS.primary[500]
                          }}
                        ></div>
                        <p className="mt-4 text-sm" style={{ color: COLORS.gray[600] }}>Loading categories...</p>
                      </div>
                    </div>
                  );
                }

                if (departmentCategories.length === 0) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <p className="text-sm" style={{ color: COLORS.gray[500] }}>No categories available for this department</p>
                      </div>
                    </div>
                  );
                }

                // Filter out duplicate categories
                const uniqueCategories = departmentCategories.filter((category, index, self) => {
                  const identifier = category.idcategory_master || category.category_name;
                  return index === self.findIndex(c =>
                    (c.idcategory_master || c.category_name) === identifier
                  );
                });

                return (
                  <div className="space-y-2">
                    {uniqueCategories.map((category) => (
                      <button
                        key={category.idcategory_master || category.category_name}
                        onClick={() => handleCategoryClick(category.category_name, departmentName, category)}
                        className="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border p-3 sm:p-4 flex items-center gap-3 group text-left"
                        style={{
                          borderColor: COLORS.gray[200],
                          minHeight: '56px' // Touch-friendly minimum height
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.primary[300];
                          e.currentTarget.style.backgroundColor = COLORS.primary[50];
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) icon.style.color = COLORS.primary[600];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = COLORS.gray[200];
                          e.currentTarget.style.backgroundColor = COLORS.white;
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) icon.style.color = COLORS.gray[400];
                        }}
                      >
                        <ChevronRightIcon 
                          className="w-5 h-5 transition-colors flex-shrink-0" 
                          style={{ color: COLORS.gray[400] }}
                        />
                        <span className="flex-1 text-sm sm:text-base font-medium text-gray-900">
                          {category.category_name || 'Not Available'}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : null}
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
          background: ${COLORS.primary[500]};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.primary[600]};
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
};

export default CategoriesDrawer;
