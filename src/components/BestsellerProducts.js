import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BestsellerProductCard from './BestsellerProductCard';
import { getBestSellers } from '../api/merchandisingApi';

const BestsellerProducts = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeCode, setStoreCode] = useState(null);

  console.log('🎬 BestsellerProducts: Component mounted/rendered');

  // Helper function to get store code
  const getStoreCode = () => {
    console.log('🔍 BestsellerProducts: Getting store code from localStorage');
    const locationData = localStorage.getItem('confirmedLocation');
    console.log('📦 BestsellerProducts: Raw localStorage data:', locationData);

    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        console.log('📍 BestsellerProducts: Parsed location:', location);

        // Check both field names: store_code and storeCode
        const code = location?.store?.store_code || location?.store?.storeCode || null;

        console.log('🏪 BestsellerProducts: Store object:', location?.store);
        console.log('🏪 BestsellerProducts: Extracted store_code:', code);
        return code;
      } catch (error) {
        console.error('❌ BestsellerProducts: Failed to parse location data:', error);
      }
    } else {
      console.warn('⚠️ BestsellerProducts: No confirmedLocation in localStorage');
    }
    return null;
  };

  // Initialize and listen for store code changes
  useEffect(() => {
    console.log('🔄 BestsellerProducts: Store code initialization useEffect fired');

    const updateStoreCode = () => {
      console.log('🔄 BestsellerProducts: Updating store code...');
      const code = getStoreCode();
      console.log('✅ BestsellerProducts: Setting storeCode state to:', code);
      setStoreCode(code);
    };

    // Initial load
    updateStoreCode();

    // Listen for storage changes (when store code is updated)
    const handleStorageChange = (e) => {
      console.log('📡 BestsellerProducts: Storage change event:', e.key);
      if (e.key === 'confirmedLocation' || e.key === null) {
        updateStoreCode();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event listener for same-tab updates
    const handleLocationUpdate = () => {
      console.log('📡 BestsellerProducts: locationUpdated event received');
      updateStoreCode();
    };
    window.addEventListener('locationUpdated', handleLocationUpdate);

    return () => {
      console.log('🧹 BestsellerProducts: Cleaning up event listeners');
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('locationUpdated', handleLocationUpdate);
    };
  }, []);

  useEffect(() => {
    console.log('🔄 BestsellerProducts: Fetch useEffect fired, storeCode:', storeCode);

    // Only fetch if we have a store code
    if (!storeCode) {
      console.warn('⏳ BestsellerProducts: Waiting for store code to be set... (storeCode is null/undefined)');
      setLoading(false);
      return;
    }

    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        console.log(`🚀 BestsellerProducts: Starting fetch for store code: ${storeCode}`);
        const response = await getBestSellers({ store_code: storeCode });
        console.log('📥 BestsellerProducts: API response received:', response);

        if (response.success && response.data && response.data.length > 0) {
          // Sort sections by sequence
          const sortedSections = response.data.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

          console.log(`✅ BestsellerProducts: Found ${sortedSections.length} section(s), rendering in sequence order`);

          // Process each section
          const processedSections = sortedSections.map(section => {
            // Determine banner image
            const bannerImage = section.banner_urls?.desktop ||
                               section.banner_urls?.mobile ||
                               '/images/seasonal_banner.jpg';

            // Extract background color from API (with fallback)
            const backgroundColor = section.background_color || 
                                   section.backgroundColor || 
                                   '#F472B6'; // Default pink color

            // Extract and format products from the section
            const productsList = section.products?.map(item => ({
              id: item.p_code || item.product_details?.p_code,
              p_code: item.product_details?.p_code || item.p_code,
              product_name: item.product_details?.product_name || '',
              image_url: item.product_details?.pcode_img || item.product_details?.image_url || '/images/logo.jpg',
              pcode_img: item.product_details?.pcode_img || item.product_details?.image_url || '/images/logo.jpg',
              product_mrp: item.product_details?.product_mrp || 0,
              our_price: item.product_details?.our_price || 0,
              discount_percentage: item.product_details?.discount_percentage || 0,
              package_size: item.product_details?.package_size || '',
              package_unit: item.product_details?.package_unit || '',
              brand_name: item.product_details?.brand_name || '',
              store_quantity: item.product_details?.store_quantity || 0,
              // Include category IDs if available
              dept_id: item.product_details?.dept_id || item.dept_id || '2',
              category_id: item.product_details?.category_id || item.category_id || '72',
              sub_category_id: item.product_details?.sub_category_id || item.sub_category_id || '391'
            })) || [];

            return {
              ...section,
              bannerImage,
              backgroundColor,
              productsList
            };
          });

          setSections(processedSections);
        } else {
          setSections([]);
        }
      } catch (error) {
        console.error('Error fetching best sellers:', error);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [storeCode]);

  // Don't render if no sections
  if (!loading && sections.length === 0) {
    return null;
  }
  return (
    <>
      {loading ? (
        <div className="relative overflow-hidden py-3 sm:py-4 lg:py-5">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-rose-50/60 to-pink-100/60"></div>
          <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-transparent border-t-pink-500 border-r-rose-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        sections.map((section, sectionIndex) => {
          // Helper function to convert hex to RGB for opacity
          const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null;
          };

          // Get background color from API or use default
          const bgColor = section.backgroundColor || '#F472B6';
          const rgb = hexToRgb(bgColor);
          const bgColorRgb = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)` : bgColor;
          const bgColorRgb25 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)` : bgColor;
          const bgColorRgb90 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)` : bgColor;
          const bgColorRgb95 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)` : bgColor;
          const bgColorRgb70 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)` : bgColor;
          const bgColorRgb98 = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.98)` : bgColor;

          return (
          <div key={section._id || sectionIndex} className="relative overflow-hidden py-3 sm:py-4 lg:py-5">
            {/* Dynamic Background with Animated Gradients */}
            <div className="absolute inset-0" style={{ backgroundColor: bgColorRgb }}></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl -translate-y-1/4 animate-pulse" style={{ backgroundColor: bgColorRgb25 }}></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl translate-y-1/4 animate-pulse" style={{ backgroundColor: bgColorRgb25, animationDelay: '1s' }}></div>

            {/* Container with consistent padding for entire component */}
            <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
              {/* Promotional Banner at the top - Seamlessly integrated */}
              <div className="relative w-full">
                <div 
                  className="relative w-full h-[140px] sm:h-[160px] lg:h-[180px] xl:h-[200px] overflow-hidden cursor-pointer group" 
                  style={{ borderRadius: '0.75rem 0.75rem 0 0' }}
                  onClick={() => {
                    const sectionId = section._id || section.id;
                    if (sectionId) {
                      console.log(`🔗 BestsellerProducts: Navigating to section ${sectionId}`);
                      navigate(`/bestsellers/${sectionId}`);
                    }
                  }}
                >
                  <img
                    src={section.bannerImage.startsWith('http') ? section.bannerImage : `${process.env.PUBLIC_URL}${section.bannerImage}`}
                    alt={section.title || 'Bestseller Products Banner'}
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
                      console.log(`🖼️ Bestseller Banner ${sectionIndex + 1} image loaded successfully`);
                    }}
                    onError={() => {
                      console.log(`❌ Bestseller Banner ${sectionIndex + 1} image failed to load`);
                    }}
                  />
                  {/* Strong overlay gradient for perfect seamless transition */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent from-40% via-70% to-90% group-hover:via-70% group-hover:to-95% transition-all duration-300"
                    style={{
                      background: `linear-gradient(to bottom, transparent 40%, ${bgColorRgb70} 70%, ${bgColorRgb90} 90%)`
                    }}
                  ></div>
                  {/* Click indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-white font-semibold text-sm sm:text-base">View All Products</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products section - Perfectly merged with banner */}
              <div
                className="relative w-full pt-0 pb-0"
                style={{
                  background: `linear-gradient(to bottom, ${bgColor}, ${bgColorRgb98}, ${bgColorRgb98})`,
                  marginTop: '-1px',
                  borderRadius: '0 0 0.75rem 0.75rem',
                  boxShadow: rgb ? `0 20px 25px -5px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15), 0 10px 10px -5px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Section Title (optional) */}
                {section.title && (
                  <div className="px-4 sm:px-6 lg:px-8 pt-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {section.title}
                    </h2>
                    {section.description && (
                      <p className="text-white/90 text-sm sm:text-base mb-2">
                        {section.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Horizontal Scrollable Products with Enhanced Spacing */}
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="relative">
                    <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex gap-4 sm:gap-6 lg:gap-8" style={{ width: 'max-content' }}>
                        {section.productsList.map((product, index) => (
                          <div
                            key={product.id || product.p_code}
                            className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
                            style={{
                              animationDelay: `${index * 100}ms`,
                              animation: 'fadeInUp 0.6s ease-out forwards',
                              opacity: 0
                            }}
                            onClick={() => {
                              const productId = product.p_code || product.id;
                              if (productId) {
                                navigate(`/product/${productId}?dept_id=${product.dept_id || '2'}&category_id=${product.category_id || '72'}&sub_category_id=${product.sub_category_id || '391'}`);
                              }
                            }}
                          >
                            <BestsellerProductCard product={product} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scroll Indicators - Gradient edges */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r to-transparent pointer-events-none"
                      style={{ background: `linear-gradient(to right, ${bgColorRgb25}, transparent)` }}
                    ></div>
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l to-transparent pointer-events-none"
                      style={{ background: `linear-gradient(to left, ${bgColorRgb25}, transparent)` }}
                    ></div>
                  </div>
                </div>
              </div>
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
            `}</style>
          </div>
          );
        })
      )}
    </>
  );
};

export default BestsellerProducts;

