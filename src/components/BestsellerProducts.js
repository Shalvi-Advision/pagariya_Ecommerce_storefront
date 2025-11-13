import React, { useState, useEffect } from 'react';
import BestsellerProductCard from './BestsellerProductCard';
import { getBestSellers } from '../api/merchandisingApi';

const BestsellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionData, setSectionData] = useState(null);
  const [bannerImage, setBannerImage] = useState('/images/seasonal_banner.jpg');
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
          // Get the first section
          const section = response.data[0];
          setSectionData(section);

          // Set banner image if available
          if (section.banner_urls?.desktop) {
            setBannerImage(section.banner_urls.desktop);
          } else if (section.banner_urls?.mobile) {
            setBannerImage(section.banner_urls.mobile);
          }

          // Extract products from the section
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
            store_quantity: item.product_details?.store_quantity || 0
          })) || [];

          setProducts(productsList);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching best sellers:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [storeCode]);

  // Don't render if no products
  if (!loading && products.length === 0) {
    return null;
  }
  return (
    <div className="relative overflow-hidden py-3 sm:py-4 lg:py-5">
      {/* Vibrant Pink Background with Animated Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-rose-50/60 to-pink-100/60"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/25 to-rose-400/25 rounded-full blur-3xl -translate-y-1/4 animate-pulse"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-br from-rose-400/25 to-pink-500/25 rounded-full blur-3xl translate-y-1/4 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Container with consistent padding for entire component */}
      <div className="relative container mx-auto px-2 sm:px-4 lg:px-6">
        {/* Promotional Banner at the top - Seamlessly integrated */}
        <div className="relative w-full">
          <div className="relative w-full h-[140px] sm:h-[160px] lg:h-[180px] xl:h-[200px] overflow-hidden" style={{ borderRadius: '0.75rem 0.75rem 0 0' }}>
            <img
              src={bannerImage.startsWith('http') ? bannerImage : `${process.env.PUBLIC_URL}${bannerImage}`}
              alt="Bestseller Products Banner"
              className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
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
                console.log('🖼️ Bestseller Banner image loaded successfully');
              }}
              onError={() => {
                console.log('❌ Bestseller Banner image failed to load');
              }}
            />
            {/* Strong overlay gradient for perfect seamless transition */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% via-pink-300/60 via-70% to-pink-400/90"></div>
          </div>
        </div>

        {/* Products section - Perfectly merged with banner */}
        <div 
          className="relative w-full pt-0 pb-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(244, 143, 177, 1), rgba(236, 72, 153, 0.98), rgba(219, 39, 119, 0.98))',
            marginTop: '-1px',
            borderRadius: '0 0 0.75rem 0.75rem',
            boxShadow: '0 20px 25px -5px rgba(236, 72, 153, 0.15), 0 10px 10px -5px rgba(236, 72, 153, 0.1)'
          }}
        >
          {/* Horizontal Scrollable Products with Enhanced Spacing */}
          <div className="p-4 sm:p-6 lg:p-8">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-transparent border-t-pink-500 border-r-rose-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-lg animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="flex gap-4 sm:gap-6 lg:gap-8" style={{ width: 'max-content' }}>
                    {products.map((product, index) => (
                      <div 
                        key={product.id || product.p_code}
                        className="transform transition-all duration-300 hover:scale-105"
                        style={{ 
                          animationDelay: `${index * 100}ms`,
                          animation: 'fadeInUp 0.6s ease-out forwards',
                          opacity: 0
                        }}
                      >
                        <BestsellerProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              
                {/* Scroll Indicators - Gradient edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-pink-400/40 to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-pink-500/40 to-transparent pointer-events-none"></div>
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
  );
};

export default BestsellerProducts;

