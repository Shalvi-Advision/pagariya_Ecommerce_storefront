import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BestsellerProductCard from '../components/BestsellerProductCard';
import { getAdvertisements } from '../api/merchandisingApi';

const AdvertisementProductsPage = () => {
  const { adId } = useParams();
  const navigate = useNavigate();
  const [advertisement, setAdvertisement] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeCode, setStoreCode] = useState(null);

  // Helper function to get store code
  const getStoreCode = () => {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        const code = location?.store?.store_code || location?.store?.storeCode || null;
        return code;
      } catch (error) {
        console.error('Failed to parse location data:', error);
      }
    }
    return null;
  };

  // Initialize and listen for store code changes
  useEffect(() => {
    const updateStoreCode = () => {
      const code = getStoreCode();
      setStoreCode(code);
    };

    // Initial load
    updateStoreCode();

    // Listen for storage changes
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

  // Fetch advertisement data and filter by advertisement ID
  useEffect(() => {
    if (!storeCode) {
      setLoading(false);
      return;
    }

    const fetchAdvertisementProducts = async () => {
      try {
        setLoading(true);
        console.log(`🚀 AdvertisementProductsPage: Fetching advertisement: ${adId}, store: ${storeCode}`);
        
        const response = await getAdvertisements({ 
          category: 'homepage',
          store_code: storeCode 
        });
        console.log('📥 AdvertisementProductsPage: API response received:', response);

        if (response.success && response.data && response.data.length > 0) {
          // Find the advertisement by ID
          const foundAd = response.data.find(
            ad => ad._id === adId || ad.id === adId
          );

          if (foundAd) {
            console.log(`✅ AdvertisementProductsPage: Found advertisement with ${foundAd.products?.length || 0} products`);
            
            // Process products from the advertisement
            const processedProducts = (foundAd.products || []).map(item => ({
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
            }));

            setAdvertisement(foundAd);
            setProducts(processedProducts);
          } else {
            console.warn(`⚠️ AdvertisementProductsPage: Advertisement ${adId} not found`);
            setAdvertisement(null);
            setProducts([]);
          }
        } else {
          setAdvertisement(null);
          setProducts([]);
        }
      } catch (error) {
        console.error('❌ AdvertisementProductsPage: Error fetching advertisement:', error);
        setAdvertisement(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisementProducts();
  }, [adId, storeCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-transparent border-t-purple-500 border-r-fuchsia-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-fuchsia-400/20 rounded-full blur-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!advertisement) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Advertisement Not Found</h2>
            <p className="text-gray-600">The advertisement you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Banner Image (if available) */}
        {advertisement.banner_url ? (
          <div className="mb-6 sm:mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={
                advertisement.banner_url.startsWith('http') 
                  ? advertisement.banner_url 
                  : `${process.env.PUBLIC_URL}${advertisement.banner_url}`
              }
              alt={advertisement.title || 'Advertisement Banner'}
              className="w-full h-[200px] sm:h-[250px] lg:h-[300px] object-cover"
              onError={(e) => {
                e.target.src = `${process.env.PUBLIC_URL}/images/offer banner.png`;
              }}
            />
          </div>
        ) : null}

        {/* Advertisement Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-wider">Special Offers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              {advertisement.title || 'Featured Promotions'}
            </span>
          </h1>
          {advertisement.description && (
            <p className="text-gray-600 text-base sm:text-lg">
              {advertisement.description}
            </p>
          )}
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <div
                key={product.id || product.p_code || index}
                className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  animationDelay: `${index * 50}ms`,
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
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No products available in this advertisement.</p>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
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

export default AdvertisementProductsPage;

