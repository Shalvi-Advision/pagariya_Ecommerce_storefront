import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { getPopularCategories } from '../api/merchandisingApi';

const FamousCategories = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeCode, setStoreCode] = useState(null);

  // Color mappings for categories
  const colorMappings = [
    { color: "bg-orange-50", iconColor: "text-orange-600" },
    { color: "bg-blue-50", iconColor: "text-blue-600" },
    { color: "bg-green-50", iconColor: "text-green-600" },
    { color: "bg-red-50", iconColor: "text-red-600" },
    { color: "bg-purple-50", iconColor: "text-purple-600" },
    { color: "bg-yellow-50", iconColor: "text-yellow-600" },
    { color: "bg-pink-50", iconColor: "text-pink-600" },
    { color: "bg-cyan-50", iconColor: "text-cyan-600" },
    { color: "bg-amber-50", iconColor: "text-amber-600" },
    { color: "bg-emerald-50", iconColor: "text-emerald-600" },
    { color: "bg-indigo-50", iconColor: "text-indigo-600" },
    { color: "bg-gray-50", iconColor: "text-gray-600" }
  ];

  // Icon mappings for categories
  const categoryIcons = {
    "Snacks": "🍿",
    "Beverages": "🥤",
    "Dairy": "🥛",
    "Fruits": "🍎",
    "Vegetables": "🥕",
    "Bakery": "🍞",
    "Meat": "🍖",
    "Seafood": "🐟",
    "Frozen": "❄️",
    "Organic": "🌱",
    "Baby": "👶",
    "Personal Care": "💄",
    "Cleaning": "🧽",
    "Kitchen": "🍳",
    "DEFAULT": "📦"
  };

  // Helper function to get store code
  const getStoreCode = () => {
    const locationData = localStorage.getItem('confirmedLocation');

    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        // Check both field names: store_code and storeCode
        const code = location?.store?.store_code || location?.store?.storeCode || null;
        return code;
      } catch (error) {
        console.error('Failed to parse location data:', error);
      }
    }
    return null;
  };

  // Helper function to get icon for category
  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return categoryIcons.DEFAULT;

    // Try to find a matching icon
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (categoryName.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return categoryIcons.DEFAULT;
  };

  // Initialize and listen for store code changes
  useEffect(() => {
    const updateStoreCode = () => {
      const code = getStoreCode();
      setStoreCode(code);
    };

    // Initial load
    updateStoreCode();

    // Listen for storage changes (when store code is updated)
    const handleStorageChange = (e) => {
      if (e.key === 'confirmedLocation' || e.key === null) {
        updateStoreCode();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event listener for same-tab updates
    const handleLocationUpdate = () => {
      updateStoreCode();
    };
    window.addEventListener('locationUpdated', handleLocationUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('locationUpdated', handleLocationUpdate);
    };
  }, []);

  useEffect(() => {
    // Only fetch if we have a store code
    if (!storeCode) {
      setLoading(false);
      return;
    }

    const fetchFamousCategories = async () => {
      try {
        setLoading(true);
        const response = await getPopularCategories({ store_code: storeCode });

        if (response.success && response.data && response.data.length > 0) {
          // Filter sections where is_active === true
          // If is_active field doesn't exist, we'll show all sections (for backward compatibility)
          const hasActiveField = response.data.some(section => 'is_active' in section);
          let activeSections;
          
          if (hasActiveField) {
            // Filter by is_active === true only if the field exists
            activeSections = response.data.filter(section => section.is_active === true);
          } else {
            // If is_active field doesn't exist, show all sections
            activeSections = response.data;
          }

          // Sort filtered sections by sequence (ascending order)
          const sortedSections = activeSections.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

          // Process each section
          const processedSections = sortedSections.map((section) => {
            // Extract and format subcategories
            // Try multiple possible field names for subcategories
            const subcategoriesData = section.subcategories || section.categories || section.sub_categories || [];
            
            const categoriesList = subcategoriesData.map((item, index) => {
              const colorMapping = colorMappings[index % colorMappings.length];
              
              // Try multiple possible structures for subcategory details
              const details = item.subcategory_details || item.subcategory || item.details || item || {};
              
              // Try multiple possible field names for ID
              const categoryId = item.sub_category_id || 
                                details.idsub_category_master || 
                                details.sub_category_id || 
                                details.id ||
                                item.id ||
                                `category_${index}`;
              
              // Try multiple possible field names for name
              const categoryName = details.sub_category_name || 
                                  details.name || 
                                  item.name || 
                                  item.sub_category_name ||
                                  'Category';
              
              // Try multiple possible field names for image
              const imageLink = details.image_link || 
                              details.image_url || 
                              details.image || 
                              item.image_link ||
                              item.image_url ||
                              null;

              return {
                id: categoryId,
                name: categoryName,
                icon: getCategoryIcon(categoryName),
                image_link: imageLink,
                color: colorMapping.color,
                iconColor: colorMapping.iconColor,
                redirect_url: item.redirect_url || item.url || '#'
              };
            });

            return {
              ...section,
              backgroundColor: section.background_color || '#EFEFEF',
              categoriesList
            };
          });

          setSections(processedSections);
        } else {
          setSections([]);
        }
      } catch (error) {
        console.error('Error fetching famous categories:', error);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFamousCategories();
  }, [storeCode]);

  // Don't render if no sections
  if (!loading && sections.length === 0) {
    return null;
  }

  return (
    <>
      {loading ? (
        <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-violet-50/50 to-fuchsia-50/50"></div>
          <div className="relative container mx-auto px-4">
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-transparent border-t-purple-500 border-r-violet-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-violet-400/20 rounded-full blur-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        sections.map((section, sectionIndex) => (
          <div key={section._id || sectionIndex} className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
            {/* Modern Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-violet-50/50 to-fuchsia-50/50"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>

            <div className="relative container mx-auto px-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 lg:p-10 shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      
                      <span className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-wider"></span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                        {section.title || 'Famous Categories'}
                      </span>
                    </h2>
                    {section.description && (
                      <p className="text-gray-600 text-sm sm:text-base">{section.description}</p>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span>Trending Now</span>
                  </div>
                </div>

                <div className="relative">
                  {section.categoriesList && section.categoriesList.length > 0 ? (
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {section.categoriesList.map((category, index) => {
                      // Handle redirect URLs
                      const handleClick = (e) => {
                        if (category.redirect_url && category.redirect_url !== '#') {
                          // Check if it's a deep link
                          if (category.redirect_url.startsWith('app://')) {
                            e.preventDefault();
                            // Handle deep link
                          } else if (category.redirect_url.startsWith('http')) {
                            // External link
                            e.preventDefault();
                            window.location.href = category.redirect_url;
                          }
                          // Otherwise let the Link component handle it
                        }
                      };

                      const CategoryComponent = category.redirect_url && !category.redirect_url.startsWith('app://') && !category.redirect_url.startsWith('http') ? Link : 'div';
                      const categoryProps = CategoryComponent === Link ? { to: category.redirect_url } : {};
                      
                      return (
                        <CategoryComponent
                          key={category.id || index}
                          {...categoryProps}
                          onClick={handleClick}
                          className="flex-shrink-0 w-32 h-56 bg-transparent transition-all duration-300 cursor-pointer group overflow-visible"
                        >
                          <div className="flex flex-col items-center justify-center h-full pt-4 pb-2">
                            <div className={`w-32 h-32 flex-shrink-0 ${category.color} flex items-center justify-center mb-3 transition-all duration-300 relative overflow-hidden rounded-xl`}>
                              {category.image_link ? (
                                <img 
                                  src={category.image_link} 
                                  alt={category.name}
                                  className="w-full h-full object-cover drop-shadow transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const iconElement = e.target.parentElement.querySelector('.fallback-icon');
                                    if (iconElement) iconElement.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`fallback-icon absolute inset-0 z-10 bg-gradient-to-br from-white to-gray-100 flex items-center justify-center transition-transform duration-300 rounded-xl ${category.image_link ? 'hidden' : 'flex'}`}
                              >
                                <span className={`text-5xl ${category.iconColor} w-full h-full flex items-center justify-center`}>
                                  {category.icon}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-gray-800 text-center leading-tight group-hover:text-purple-600 transition-colors duration-200 px-2 line-clamp-2 flex items-center justify-center flex-1">
                              {category.name}
                            </span>
                          </div>
                        </CategoryComponent>
                      );
                    })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No categories available</p>
                    </div>
                  )}

                  {/* Enhanced Scroll Arrow with Gradient */}
                  {section.categoriesList && section.categoriesList.length > 0 && (
                    <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-full p-3 shadow hover:shadow-md hover:scale-105 transition-all duration-200 group">
                      <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hide scrollbar */}
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </div>
        ))
      )}
    </>
  );
};

export default FamousCategories;

