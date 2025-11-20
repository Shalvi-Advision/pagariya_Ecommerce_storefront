import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSeasonalCategories } from '../api/merchandisingApi';

const SeasonalOfferBanner = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSeasonalCategories();
  }, []);

  const loadSeasonalCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 SeasonalOfferBanner: Fetching seasonal categories from API');

      // Call the new seasonal categories API
      const response = await getSeasonalCategories({ season: 'winter' });

      console.log('📊 SeasonalOfferBanner: API Response:', response);
      
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Filter only active sections and sort by sequence
        const activeSections = response.data
          .filter(section => section.is_active === true)
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        
        console.log('✅ SeasonalOfferBanner: Active sections loaded:', activeSections.length);
        setSections(activeSections);
      } else {
        console.warn('⚠️ SeasonalOfferBanner: No active sections found in API response');
        setSections([]);
      }
    } catch (err) {
      console.error('❌ SeasonalOfferBanner: Error loading seasonal categories:', err);
      setError(err.message);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (subcategory) => {
    console.log('🔗 SeasonalOfferBanner: Category clicked:', subcategory);
    const subcategoryId = subcategory.subcategory_details?.idsub_category_master;
    const deptId = subcategory.category_details?.dept_id || '2';
    
    if (subcategoryId) {
      navigate(`/subcategory/${subcategoryId}?dept_id=${deptId}`);
    }
  };

  const handleSeasonalBannerClick = (section) => {
    console.log('🔗 SeasonalOfferBanner: Seasonal banner clicked:', section);
    const redirectUrl = section.redirect_url;
    
    if (redirectUrl && redirectUrl !== '#') {
      if (redirectUrl.startsWith('app://')) {
        // Handle app deep links (log for now)
        console.log('Deep link clicked:', redirectUrl);
      } else if (redirectUrl.startsWith('http')) {
        window.location.href = redirectUrl;
      } else {
        // Assume it's a relative path
        navigate(redirectUrl);
      }
    }
  };

  // Helper function to convert hex to RGB for opacity
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Don't render if no active sections and not loading
  if (!loading && sections.length === 0) {
    return null;
  }

  // Helper function to get responsive banner image
  const getBannerImage = (section) => {
    if (!section.banner_urls) return null;
    
    // Use desktop by default, fallback to mobile
    const isMobile = window.innerWidth < 768;
    const bannerUrl = isMobile 
      ? (section.banner_urls.mobile || section.banner_urls.desktop)
      : (section.banner_urls.desktop || section.banner_urls.mobile);
    
    return bannerUrl;
  };

  // Helper function to get category image
  const getCategoryImage = (subcategory) => {
    return subcategory.image_link || 
           subcategory.subcategory_details?.image_link || 
           subcategory.category_details?.image_link || 
           null;
  };

  // Helper function to get category name
  const getCategoryName = (subcategory) => {
    return subcategory.subcategory_details?.sub_category_name || 
           subcategory.category_details?.category_name || 
           'Category';
  };

  return (
    <div className="relative py-3 sm:py-4 lg:py-5" style={{ backgroundColor: 'transparent' }}>
      {/* Container to constrain the background color from API */}
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Render each section */}
        {sections.map((section, sectionIndex) => {
          const backgroundColor = section.background_color || '#FFFFFF';
          const rgb = hexToRgb(backgroundColor);
          const bgColorRgb = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)` : backgroundColor;
          const bgColorRgb25 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)` : backgroundColor;
          const bgColorRgb90 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)` : backgroundColor;
          const bgColorRgb70 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)` : backgroundColor;
          const bgColorRgb98 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.98)` : backgroundColor;
          
          // Sort subcategories by position if available
          const sortedSubcategories = section.subcategories 
            ? [...section.subcategories].sort((a, b) => (a.position || 0) - (b.position || 0))
            : [];

          const bannerImage = getBannerImage(section);
          const sectionTitle = section.title || 'Seasonal Categories';
          const sectionDescription = section.description || null;

          return (
            <div 
              key={section._id || sectionIndex} 
              className={`relative overflow-hidden rounded-2xl ${sectionIndex > 0 ? 'mt-6' : ''}`} 
              style={{ backgroundColor: bgColorRgb }}
            >
              {/* Dynamic Background with Animated Gradients */}
              <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl -translate-y-1/4 animate-pulse pointer-events-none" style={{ backgroundColor: bgColorRgb25 }}></div>
              <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl translate-y-1/4 animate-pulse pointer-events-none" style={{ backgroundColor: bgColorRgb25, animationDelay: '1s' }}></div>

              {/* Content wrapper */}
              <div className="relative">
                {/* Promotional Banner at the top - Seamlessly integrated */}
                {bannerImage && (
                  <div className="relative w-full">
                    <div 
                      className="relative w-full h-[1600px] sm:h-[180px] lg:h-[240px] xl:h-[320px] overflow-hidden cursor-pointer group" 
                      style={{ borderRadius: '1rem 1rem 0 0' }}
                      onClick={() => handleSeasonalBannerClick(section)}
                    >
                      <img
                        src={bannerImage.startsWith('http') || bannerImage.startsWith('/') ? bannerImage : `${process.env.PUBLIC_URL}${bannerImage}`}
                        alt={sectionTitle}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center center',
                          display: 'block'
                        }}
                        onLoad={() => {
                          console.log('🖼️ SeasonalOfferBanner: Seasonal banner image loaded successfully');
                        }}
                        onError={() => {
                          console.log('❌ SeasonalOfferBanner: Seasonal banner image failed to load');
                        }}
                      />
                      {/* Click indicator */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                          <span className="text-white font-semibold text-sm sm:text-base">View Seasonal Offers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Categories section - Perfectly merged with banner */}
                <div
                  className="relative w-full pt-0 pb-0"
                  style={{
                    background: `linear-gradient(to bottom, ${backgroundColor}, ${bgColorRgb98}, ${bgColorRgb98})`,
                    marginTop: bannerImage ? '-1px' : '0',
                    borderRadius: bannerImage ? '0 0 1rem 1rem' : '1rem',
                    boxShadow: rgb ? `0 20px 25px -5px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15), 0 10px 10px -5px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Section Title */}
                  <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                      {sectionTitle}
                    </h2>
                    {sectionDescription && (
                      <p className="text-gray-600 text-xs sm:text-sm mb-1">
                        {sectionDescription}
                      </p>
                    )}
                  </div>

                  {/* Horizontal Scrollable Categories with Enhanced Spacing */}
                  <div className="p-3 sm:p-4 lg:p-5">
                    <div className="relative">
                      {loading ? (
                        // Loading state
                        <div className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto scrollbar-hide">
                          {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="flex-shrink-0 w-24 sm:w-28 lg:w-32 bg-white rounded-xl overflow-hidden animate-pulse border border-gray-200/50" style={{ 
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                            }}>
                              <div className="w-full h-24 sm:h-28 lg:h-32 bg-gray-200"></div>
                              <div className="p-2 bg-gray-300">
                                <div className="h-3 bg-gray-400 rounded"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : sortedSubcategories.length > 0 ? (
                        <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <div className="flex gap-3 sm:gap-4 lg:gap-5" style={{ width: 'max-content' }}>
                            {sortedSubcategories.map((subcategory, index) => {
                              const categoryImage = getCategoryImage(subcategory);
                              const categoryName = getCategoryName(subcategory);
                              
                              return (
                                <div
                                  key={subcategory.sub_category_id || index}
                                  className="transform transition-all duration-300 hover:scale-105 cursor-pointer flex-shrink-0 category-card-wrapper"
                                  style={{
                                    animationDelay: `${index * 100}ms`,
                                    animation: 'fadeInUp 0.6s ease-out forwards',
                                    opacity: 0
                                  }}
                                  onClick={() => handleCategoryClick(subcategory)}
                                >
                                  {/* Category Card */}
                                  <div className="w-24 sm:w-28 lg:w-32 bg-white rounded-xl overflow-hidden group border border-gray-200/50 category-card flex flex-col" style={{ 
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.3s ease',
                                    height: 'auto'
                                  }}>
                                    {/* Category Image */}
                                    <div className="w-full h-24 sm:h-28 lg:h-32 relative bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                                      {categoryImage ? (
                                        <img
                                          src={categoryImage.startsWith('http') || categoryImage.startsWith('/') ? categoryImage : `${process.env.PUBLIC_URL}${categoryImage}`}
                                          alt={categoryName}
                                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                          onLoad={() => {
                                            console.log('✅ SeasonalOfferBanner: Category image loaded:', categoryName, categoryImage);
                                          }}
                                          onError={(e) => {
                                            console.log('❌ SeasonalOfferBanner: Category image failed to load:', categoryName, categoryImage);
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) {
                                              e.target.nextSibling.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      {/* Fallback placeholder when image fails or is missing */}
                                      <div 
                                        className={`w-full h-full flex items-center justify-center absolute ${categoryImage ? 'hidden' : 'flex'}`}
                                      >
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-md">
                                          <span className="text-white text-lg font-bold">
                                            {index + 1}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Category Name - Fixed height container */}
                                    <div className="p-2 bg-white flex-shrink-0 h-12 sm:h-14 lg:h-16 flex items-center justify-center">
                                      <p className="text-gray-800 text-xs sm:text-sm font-semibold text-center leading-tight line-clamp-2 w-full">
                                        {categoryName}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hide scrollbar and animations */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .category-card-wrapper:hover .category-card {
          box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.25), 0 15px 15px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1) !important;
          border-color: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default SeasonalOfferBanner;
