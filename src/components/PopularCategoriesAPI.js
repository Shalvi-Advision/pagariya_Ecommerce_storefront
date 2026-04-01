import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { getPopularCategories } from '../api/merchandisingApi';

const PopularCategoriesAPI = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeCode, setStoreCode] = useState(null);

  console.log('🎬 PopularCategoriesAPI: Component mounted/rendered');

  // Color mappings for categories
  const colorMappings = [
    { color: "bg-orange-50", iconColor: "text-orange-600" },
    { color: "bg-blue-50", iconColor: "text-blue-600" },
    { color: "bg-green-50", iconColor: "text-green-600" },
    { color: "bg-red-50", iconColor: "text-red-600" },
    { color: "bg-purple-50", iconColor: "text-purple-600" },
    { color: "bg-yellow-50", iconColor: "text-yellow-600" },
    { color: "bg-pink-50", iconColor: "text-pink-600" },
    { color: "bg-cyan-50", iconColor: "text-primary-500" },
    { color: "bg-amber-50", iconColor: "text-amber-600" },
    { color: "bg-primary-50", iconColor: "text-primary-600" },
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
    console.log('🔍 PopularCategoriesAPI: Getting store code from localStorage');
    const locationData = localStorage.getItem('confirmedLocation');
    console.log('📦 PopularCategoriesAPI: Raw localStorage data:', locationData);

    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        console.log('📍 PopularCategoriesAPI: Parsed location:', location);

        // Check both field names: store_code and storeCode
        const code = location?.store?.store_code || location?.store?.storeCode || null;

        console.log('🏪 PopularCategoriesAPI: Store object:', location?.store);
        console.log('🏪 PopularCategoriesAPI: Extracted store_code:', code);
        return code;
      } catch (error) {
        console.error('❌ PopularCategoriesAPI: Failed to parse location data:', error);
      }
    } else {
      console.warn('⚠️ PopularCategoriesAPI: No confirmedLocation in localStorage');
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
    console.log('🔄 PopularCategoriesAPI: Store code initialization useEffect fired');

    const updateStoreCode = () => {
      console.log('🔄 PopularCategoriesAPI: Updating store code...');
      const code = getStoreCode();
      console.log('✅ PopularCategoriesAPI: Setting storeCode state to:', code);
      setStoreCode(code);
    };

    // Initial load
    updateStoreCode();

    // Listen for storage changes (when store code is updated)
    const handleStorageChange = (e) => {
      console.log('📡 PopularCategoriesAPI: Storage change event:', e.key);
      if (e.key === 'confirmedLocation' || e.key === null) {
        updateStoreCode();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event listener for same-tab updates
    const handleLocationUpdate = () => {
      console.log('📡 PopularCategoriesAPI: locationUpdated event received');
      updateStoreCode();
    };
    window.addEventListener('locationUpdated', handleLocationUpdate);

    return () => {
      console.log('🧹 PopularCategoriesAPI: Cleaning up event listeners');
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('locationUpdated', handleLocationUpdate);
    };
  }, []);

  useEffect(() => {
    console.log('🔄 PopularCategoriesAPI: Fetch useEffect fired, storeCode:', storeCode);

    // Only fetch if we have a store code
    if (!storeCode) {
      console.warn('⏳ PopularCategoriesAPI: Waiting for store code to be set... (storeCode is null/undefined)');
      setLoading(false);
      return;
    }

    const fetchPopularCategories = async () => {
      try {
        setLoading(true);
        console.log(`🚀 PopularCategoriesAPI: Starting fetch for store code: ${storeCode}`);
        const response = await getPopularCategories({ store_code: storeCode });
        console.log('📥 PopularCategoriesAPI: API response received:', response);

        if (response.success && response.data && response.data.length > 0) {
          // Sort sections by sequence
          const sortedSections = response.data.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

          console.log(`✅ PopularCategoriesAPI: Found ${sortedSections.length} section(s), rendering in sequence order`);

          // Process each section
          const processedSections = sortedSections.map(section => {
            // Extract and format subcategories
            const categoriesList = section.subcategories?.map((item, index) => {
              const colorMapping = colorMappings[index % colorMappings.length];
              const details = item.subcategory_details || {};

              return {
                id: item.sub_category_id || details.idsub_category_master,
                name: details.sub_category_name || 'Category',
                icon: getCategoryIcon(details.sub_category_name),
                image_link: details.image_link || null,
                color: colorMapping.color,
                iconColor: colorMapping.iconColor,
                redirect_url: item.redirect_url || '#'
              };
            }) || [];

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
        console.error('Error fetching popular categories:', error);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularCategories();
  }, [storeCode]);

  // Don't render if no sections
  if (!loading && sections.length === 0) {
    return null;
  }

  return (
    <>
      {loading ? (
        <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/50 to-indigo-50/50"></div>
          <div className="relative container mx-auto px-4">
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-transparent border-t-primary-400 border-r-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-primary-300/20 to-blue-400/20 rounded-full blur-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        sections.map((section, sectionIndex) => (
          <div key={section._id || sectionIndex} className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
            {/* Modern Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/50 to-indigo-50/50"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-primary-300/20 to-blue-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>

            <div className="relative container mx-auto px-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-primary-400 to-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs sm:text-sm font-semibold text-primary-500 uppercase tracking-wider">Trending</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-primary-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {section.title || 'Popular Categories'}
                      </span>
                    </h2>
                    {section.description && (
                      <p className="text-gray-600 text-sm sm:text-base">{section.description}</p>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span>Fresh & Fast Delivery</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {section.categoriesList.map((category, index) => {
                  // Handle redirect URLs
                  const handleClick = (e) => {
                    if (category.redirect_url && category.redirect_url !== '#') {
                      // Check if it's a deep link
                      if (category.redirect_url.startsWith('app://')) {
                        e.preventDefault();
                        // Handle deep link - for now just log it
                        console.log('Deep link clicked:', category.redirect_url);
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
                      className="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100/50 shadow-lg hover:shadow-2xl hover:border-cyan-300 hover:scale-110 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex flex-col items-center justify-center h-full p-4">
                        <div className={`w-16 h-16 ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md relative overflow-hidden rounded-xl`}>
                          {category.image_link ? (
                            <img 
                              src={category.image_link} 
                              alt={category.name}
                              className="w-full h-full object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const iconElement = e.target.parentElement.querySelector('.fallback-icon');
                                if (iconElement) iconElement.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`fallback-icon absolute inset-0 z-10 bg-gradient-to-br from-white to-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-xl ${category.image_link ? 'hidden' : 'flex'}`}
                          >
                            <span className={`text-4xl ${category.iconColor} w-full h-full flex items-center justify-center`}>
                              {category.icon}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 text-center leading-tight group-hover:text-primary-500 transition-colors duration-200">
                          {category.name}
                        </span>
                      </div>
                    </CategoryComponent>
                  );
                    })}
                  </div>

                  {/* Enhanced Scroll Arrow with Gradient */}
                  {section.categoriesList.length > 0 && (
                    <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary-400 to-blue-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 group">
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

export default PopularCategoriesAPI;

