import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getAdvertisements } from '../api/merchandisingApi';
import BestsellerProductCard from './BestsellerProductCard';

const AdvertisementCarousel = () => {
  const navigate = useNavigate();
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeCode, setStoreCode] = useState(null);

  console.log('🎬 AdvertisementCarousel: Component mounted/rendered');

  // Helper function to get store code
  const getStoreCode = () => {
    console.log('🔍 AdvertisementCarousel: Getting store code from localStorage');
    const locationData = localStorage.getItem('confirmedLocation');
    console.log('📦 AdvertisementCarousel: Raw localStorage data:', locationData);

    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        console.log('📍 AdvertisementCarousel: Parsed location:', location);

        // Check both field names: store_code and storeCode
        const code = location?.store?.store_code || location?.store?.storeCode || null;

        console.log('🏪 AdvertisementCarousel: Store object:', location?.store);
        console.log('🏪 AdvertisementCarousel: Extracted store_code:', code);
        return code;
      } catch (error) {
        console.error('❌ AdvertisementCarousel: Failed to parse location data:', error);
      }
    } else {
      console.warn('⚠️ AdvertisementCarousel: No confirmedLocation in localStorage');
    }
    return null;
  };

  // Initialize and listen for store code changes
  useEffect(() => {
    console.log('🔄 AdvertisementCarousel: Store code initialization useEffect fired');

    const updateStoreCode = () => {
      console.log('🔄 AdvertisementCarousel: Updating store code...');
      const code = getStoreCode();
      console.log('✅ AdvertisementCarousel: Setting storeCode state to:', code);
      setStoreCode(code);
    };

    // Initial load
    updateStoreCode();

    // Listen for storage changes (when store code is updated)
    const handleStorageChange = (e) => {
      console.log('📡 AdvertisementCarousel: Storage change event:', e.key);
      if (e.key === 'confirmedLocation' || e.key === null) {
        updateStoreCode();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event listener for same-tab updates
    const handleLocationUpdate = () => {
      console.log('📡 AdvertisementCarousel: locationUpdated event received');
      updateStoreCode();
    };
    window.addEventListener('locationUpdated', handleLocationUpdate);

    return () => {
      console.log('🧹 AdvertisementCarousel: Cleaning up event listeners');
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('locationUpdated', handleLocationUpdate);
    };
  }, []);

  useEffect(() => {
    console.log('🔄 AdvertisementCarousel: Fetch useEffect fired, storeCode:', storeCode);

    // Only fetch if we have a store code
    if (!storeCode) {
      console.warn('⏳ AdvertisementCarousel: Waiting for store code to be set... (storeCode is null/undefined)');
      setLoading(false);
      return;
    }

    const fetchAdvertisements = async () => {
      try {
        setLoading(true);
        console.log(`🚀 AdvertisementCarousel: Starting fetch for store code: ${storeCode}`);
        const response = await getAdvertisements({
          category: 'homepage',
          store_code: storeCode
        });
        console.log('📥 AdvertisementCarousel: API response received:', response);

        if (response.success && response.data && response.data.length > 0) {
          // Sort advertisements by sequence
          const sortedAds = response.data.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

          console.log(`✅ AdvertisementCarousel: Found ${sortedAds.length} advertisement(s), rendering in sequence order`);
          setAdvertisements(sortedAds);
        } else {
          console.warn('⚠️ AdvertisementCarousel: No advertisements found or invalid response');
          setAdvertisements([]);
        }
      } catch (error) {
        console.error('❌ AdvertisementCarousel: Error fetching advertisements:', error);
        setAdvertisements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisements();
  }, [storeCode]);

  const handleBannerClick = (ad) => {
    console.log('🔗 AdvertisementCarousel: Banner clicked for advertisement:', ad._id || ad.id);
    
    // Navigate to the advertisement products page
    const adId = ad._id || ad.id;
    if (adId) {
      navigate(`/advertisement/${adId}`);
    } else {
      console.warn('⚠️ AdvertisementCarousel: No advertisement ID found, cannot navigate');
    }
  };

  const handleRedirect = (redirectUrl) => {
    if (!redirectUrl || redirectUrl === '#') return;

    // Handle deep links
    if (redirectUrl.startsWith('app://')) {
      console.log('Deep link clicked:', redirectUrl);
      // Handle app deep link - could be implemented with a router or custom handler
      return;
    }

    // Handle external URLs
    if (redirectUrl.startsWith('http')) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Handle internal routes
    window.location.href = redirectUrl;
  };

  // Don't render if no advertisements
  if (!loading && advertisements.length === 0) {
    return null;
  }

  return (
    <>
      {loading ? (
        <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-fuchsia-50/50 to-pink-50/50"></div>
          <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/60">
              <div className="flex justify-center items-center py-20">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-transparent border-t-purple-500 border-r-fuchsia-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-fuchsia-400/20 rounded-full blur-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        advertisements.map((ad, adIndex) => (
          <div key={ad._id || adIndex} className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
      {/* Purple/Indigo Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-fuchsia-50/50 to-pink-50/50"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-fuchsia-400/20 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>
      
      <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-wider">Special Offers</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                  {ad.title || 'Featured Promotions'}
                </span>
              </h2>
            </div>
          </div>

          {/* Advertisement Container */}
          <div className="relative">
            {/* Banner Section */}
            <div 
              className="relative w-full h-[200px] sm:h-[250px] lg:h-[300px] rounded-2xl overflow-hidden shadow-lg mb-6 cursor-pointer group"
              onClick={() => handleBannerClick(ad)}
            >
              <img
                src={ad.banner_url.startsWith('http') ? ad.banner_url : `${process.env.PUBLIC_URL}${ad.banner_url}`}
                alt={ad.title || 'Advertisement'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = `${process.env.PUBLIC_URL}/images/offer banner.png`;
                }}
              />

              {/* Overlay with Title and Description */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 lg:p-8">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  {ad.title}
                </h3>
                {ad.description && (
                  <p className="text-sm sm:text-base text-white/90 mb-4 line-clamp-2 drop-shadow-md">
                    {ad.description}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBannerClick(ad);
                  }}
                  className="self-start bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  View All Products
                </button>
              </div>
            </div>

            {/* Products Section */}
            {ad.products && ad.products.length > 0 && (
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-fuchsia-500 rounded-full"></span>
                  Featured Products
                </h4>
                <div className="relative">
                  <div className="overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex gap-4 sm:gap-6" style={{ width: 'max-content' }}>
                      {ad.products.map((product, index) => {
                        const productData = {
                          id: product.p_code || product.product_details?.p_code,
                          p_code: product.product_details?.p_code || product.p_code,
                          product_name: product.product_details?.product_name || '',
                          image_url: product.product_details?.pcode_img || product.product_details?.image_url || '/images/logo.jpg',
                          pcode_img: product.product_details?.pcode_img || product.product_details?.image_url || '/images/logo.jpg',
                          product_mrp: product.product_details?.product_mrp || 0,
                          our_price: product.product_details?.our_price || 0,
                          discount_percentage: product.product_details?.discount_percentage || 0,
                          package_size: product.product_details?.package_size || '',
                          package_unit: product.product_details?.package_unit || '',
                          brand_name: product.product_details?.brand_name || '',
                          store_quantity: product.product_details?.store_quantity || 0
                        };

                        return (
                          <div
                            key={index}
                            className="transform transition-all duration-300 hover:scale-105"
                            style={{ 
                              animationDelay: `${index * 100}ms`,
                              animation: 'fadeInUp 0.6s ease-out forwards',
                              opacity: 0
                            }}
                          >
                            <BestsellerProductCard product={productData} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Scroll Indicators */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                </div>
              </div>
            )}
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
        ))
      )}
    </>
  );
};

export default AdvertisementCarousel;

