// Merchandising API service functions
import { APP_CONSTANTS } from '../constants';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

// Offline storage utilities
const DB_NAME = 'ShalviEcommerceDB';
const MERCHANDISING_STORE = 'merchandising';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds (balanced - recommended)

// Initialize IndexedDB for merchandising
const initMerchandisingDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3); // Increment version

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create merchandising store if it doesn't exist
      if (!db.objectStoreNames.contains(MERCHANDISING_STORE)) {
        const store = db.createObjectStore(MERCHANDISING_STORE, { keyPath: 'cacheKey' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('✅ Created merchandising object store in IndexedDB');
      }
    };
  });
};

// Cache merchandising data
const cacheMerchandisingData = async (cacheKey, data) => {
  try {
    const db = await initMerchandisingDB();
    
    if (!db.objectStoreNames.contains(MERCHANDISING_STORE)) {
      console.warn('Merchandising object store does not exist, skipping cache');
      db.close();
      return;
    }
    
    const transaction = db.transaction([MERCHANDISING_STORE], 'readwrite');
    const store = transaction.objectStore(MERCHANDISING_STORE);

    await store.put({
      cacheKey,
      data,
      timestamp: Date.now()
    });

    console.log('✅ Merchandising data cached successfully:', cacheKey);
    db.close();
  } catch (error) {
    console.warn('Failed to cache merchandising data:', error);
  }
};

// Get cached merchandising data
const getCachedMerchandisingData = async (cacheKey) => {
  try {
    const db = await initMerchandisingDB();
    
    if (!db.objectStoreNames.contains(MERCHANDISING_STORE)) {
      console.warn('Merchandising object store does not exist, no cached data available');
      db.close();
      return null;
    }
    
    const transaction = db.transaction([MERCHANDISING_STORE], 'readonly');
    const store = transaction.objectStore(MERCHANDISING_STORE);

    return new Promise((resolve) => {
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const result = request.result;

        if (result && (Date.now() - result.timestamp) < CACHE_EXPIRY) {
          console.log('✅ Retrieved merchandising data from cache:', cacheKey);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn('Failed to get cached merchandising data:', error);
    return null;
  }
};

// Clear all merchandising cache from IndexedDB
export const clearMerchandisingCache = async () => {
  try {
    const db = await initMerchandisingDB();

    if (!db.objectStoreNames.contains(MERCHANDISING_STORE)) {
      console.warn('Merchandising object store does not exist');
      db.close();
      return { success: false, error: 'Cache store not found' };
    }

    const transaction = db.transaction([MERCHANDISING_STORE], 'readwrite');
    const store = transaction.objectStore(MERCHANDISING_STORE);

    // Clear all records from the store
    const clearRequest = store.clear();

    return new Promise((resolve) => {
      clearRequest.onsuccess = () => {
        console.log('✅ Merchandising cache cleared from IndexedDB');
        db.close();
        resolve({ success: true });
      };

      clearRequest.onerror = () => {
        console.error('❌ Error clearing merchandising cache:', clearRequest.error);
        db.close();
        resolve({ success: false, error: clearRequest.error });
      };
    });
  } catch (error) {
    console.error('❌ Error accessing IndexedDB:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is online
const isOnline = () => {
  return navigator.onLine;
};

// Process product data from merchandising APIs
const processProductData = (product) => {
  if (!product || typeof product !== 'object') return product;

  return {
    ...product,
    p_code: product.p_code || product.pcode || product._id,
    product_name: product.product_name || '',
    our_price: product.our_price || 0,
    product_mrp: product.product_mrp || 0,
    pcode_img: product.pcode_img || product.image_url || '/images/logo.jpg',
    image_url: product.pcode_img || product.image_url || '/images/logo.jpg',
    store_quantity: product.store_quantity || 50,
    package_size: product.package_size || '',
    package_unit: product.package_unit || '',
    brand_name: product.brand_name || '',
    discount_percentage: product.discount_percentage || 
      (product.product_mrp && product.our_price && product.product_mrp > product.our_price
        ? Math.round(((product.product_mrp - product.our_price) / product.product_mrp) * 100)
        : 0)
  };
};

// Fallback data for best sellers
const getFallbackBestSellers = () => {
  return {
    success: true,
    count: 1,
    message: 'Using fallback best seller data',
    data: [
      {
        _id: 'fallback_bs_1',
        title: 'Best Sellers This Week',
        background_color: '#F5F5F5',
        banner_urls: {
          desktop: '/images/seasonal_banner.jpg',
          mobile: '/images/seasonal_banner.jpg'
        },
        redirect_url: '#',
        products: [
          {
            p_code: 'BS001',
            position: 0,
            redirect_url: '#',
            product_details: {
              p_code: 'BS001',
              product_name: 'Ind Chska Kas Methi Mas 25gm',
              our_price: 24,
              product_mrp: 30,
              pcode_img: '/images/logo.jpg',
              store_quantity: 128,
              package_size: '25',
              package_unit: 'GM',
              brand_name: 'Indian-chaska',
              discount_percentage: 20
            }
          },
          {
            p_code: 'BS002',
            position: 1,
            redirect_url: '#',
            product_details: {
              p_code: 'BS002',
              product_name: 'Ind Chska Kanda Las Mas 500gm',
              our_price: 150,
              product_mrp: 175,
              pcode_img: '/images/logo.jpg',
              store_quantity: 85,
              package_size: '500',
              package_unit: 'GM',
              brand_name: 'Indian-chaska',
              discount_percentage: 14
            }
          },
          {
            p_code: 'BS003',
            position: 2,
            redirect_url: '#',
            product_details: {
              p_code: 'BS003',
              product_name: 'Ind Chska Chaat Masala 100gm',
              our_price: 36,
              product_mrp: 45,
              pcode_img: '/images/logo.jpg',
              store_quantity: 95,
              package_size: '100',
              package_unit: 'GM',
              brand_name: 'Indian-chaska',
              discount_percentage: 20
            }
          }
        ]
      }
    ],
    isOffline: true,
    isFallback: true
  };
};

// Fallback data for popular categories
const getFallbackPopularCategories = () => {
  return {
    success: true,
    count: 1,
    message: 'Using fallback popular categories data',
    data: [
      {
        _id: 'fallback_pc_1',
        title: 'Popular Categories',
        background_color: '#EFEFEF',
        banner_urls: {
          desktop: null,
          mobile: null
        },
        redirect_url: '#',
        subcategories: [
          {
            sub_category_id: '349',
            position: 0,
            redirect_url: '#',
            subcategory_details: {
              idsub_category_master: '349',
              sub_category_name: 'Snacks',
              image_link: null
            }
          },
          {
            sub_category_id: '350',
            position: 1,
            redirect_url: '#',
            subcategory_details: {
              idsub_category_master: '350',
              sub_category_name: 'Beverages',
              image_link: null
            }
          },
          {
            sub_category_id: '351',
            position: 2,
            redirect_url: '#',
            subcategory_details: {
              idsub_category_master: '351',
              sub_category_name: 'Dairy Products',
              image_link: null
            }
          }
        ]
      }
    ],
    isOffline: true,
    isFallback: true
  };
};

// Fallback data for advertisements
const getFallbackAdvertisements = () => {
  return {
    success: true,
    count: 1,
    message: 'Using fallback advertisement data',
    data: [
      {
        _id: 'fallback_ad_1',
        title: 'Special Offers',
        description: 'Great deals on your favorite products!',
        banner_url: '/images/offer banner.png',
        redirect_url: '#',
        category: 'homepage',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        products: []
      }
    ],
    isOffline: true,
    isFallback: true
  };
};

/**
 * Fetch best seller sections from API
 * @param {Object} params - Query parameters
 * @param {string} params.store_code - Store code (default: from env or "AVB")
 * @returns {Promise<Object>} - API response with best seller sections
 */
export const getBestSellers = async (params = {}) => {
  try {
    const {
      store_code = 'AVB'
    } = params;

    const url = `${API_BASE_URL}/best-sellers/list`;
    const cacheKey = `best_sellers_${store_code}`;

    // Prepare request body
    const requestBody = {
      store_code,
      enrich_products: true
    };

    console.log('🔗 Fetching best sellers from:', url);
    console.log('📦 Request body:', requestBody);

    // If online, try to fetch from network first
    if (isOnline()) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📥 Best sellers response:', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Best sellers API response received');

        if (!data.success || !data.data) {
          console.warn('⚠️ Invalid best sellers response, using fallback');
          return getFallbackBestSellers();
        }

        // Process products in each section
        const processedData = {
          ...data,
          data: data.data.map(section => ({
            ...section,
            products: section.products?.map(product => ({
              ...product,
              product_details: processProductData(product.product_details)
            })) || []
          })),
          isOffline: false,
          isFallback: false
        };

        // Cache the response
        await cacheMerchandisingData(cacheKey, processedData);

        return processedData;
      } catch (networkError) {
        console.warn('Network request failed for best sellers, trying cache:', networkError);

        // Try to get from cache
        const cachedData = await getCachedMerchandisingData(cacheKey);
        if (cachedData) {
          console.log('✅ Serving best sellers from cache');
          return { ...cachedData, isOffline: true };
        }

        // Use fallback data
        console.log('⚠️ No cache available, using fallback best sellers');
        return getFallbackBestSellers();
      }
    } else {
      // Offline mode - try cache
      console.log('Offline mode: Attempting to load best sellers from cache');
      const cachedData = await getCachedMerchandisingData(cacheKey);

      if (cachedData) {
        console.log('Serving best sellers from cache (offline mode)');
        return { ...cachedData, isOffline: true };
      } else {
        console.log('No cache available in offline mode, using fallback');
        return getFallbackBestSellers();
      }
    }
  } catch (error) {
    console.error('❌ Error fetching best sellers:', error);
    return getFallbackBestSellers();
  }
};

/**
 * Fetch popular category sections from API
 * @param {Object} params - Query parameters
 * @param {string} params.store_code - Store code (default: from env or "AVB")
 * @returns {Promise<Object>} - API response with popular category sections
 */
export const getPopularCategories = async (params = {}) => {
  try {
    const {
      store_code = 'AVB'
    } = params;

    const url = `${API_BASE_URL}/popular-categories/list`;
    const cacheKey = `popular_categories_${store_code}`;

    // Prepare request body
    const requestBody = {
      store_code,
      enrich_subcategories: true
    };

    console.log('🔗 Fetching popular categories from:', url);
    console.log('📦 Request body:', requestBody);

    // If online, try to fetch from network first
    if (isOnline()) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📥 Popular categories response:', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Popular categories API response received');

        if (!data.success || !data.data) {
          console.warn('⚠️ Invalid popular categories response, using fallback');
          return getFallbackPopularCategories();
        }

        const processedData = {
          ...data,
          isOffline: false,
          isFallback: false
        };

        // Cache the response
        await cacheMerchandisingData(cacheKey, processedData);

        return processedData;
      } catch (networkError) {
        console.warn('Network request failed for popular categories, trying cache:', networkError);

        // Try to get from cache
        const cachedData = await getCachedMerchandisingData(cacheKey);
        if (cachedData) {
          console.log('✅ Serving popular categories from cache');
          return { ...cachedData, isOffline: true };
        }

        // Use fallback data
        console.log('⚠️ No cache available, using fallback popular categories');
        return getFallbackPopularCategories();
      }
    } else {
      // Offline mode - try cache
      console.log('Offline mode: Attempting to load popular categories from cache');
      const cachedData = await getCachedMerchandisingData(cacheKey);

      if (cachedData) {
        console.log('Serving popular categories from cache (offline mode)');
        return { ...cachedData, isOffline: true };
      } else {
        console.log('No cache available in offline mode, using fallback');
        return getFallbackPopularCategories();
      }
    }
  } catch (error) {
    console.error('❌ Error fetching popular categories:', error);
    return getFallbackPopularCategories();
  }
};

/**
 * Fetch active advertisements from API
 * @param {Object} params - Query parameters
 * @param {string} params.category - Category filter (default: "homepage")
 * @param {string} params.store_code - Store code (optional)
 * @returns {Promise<Object>} - API response with active advertisements
 */
export const getAdvertisements = async (params = {}) => {
  try {
    const {
      category = 'homepage',
      store_code
    } = params;

    const url = `${API_BASE_URL}/advertisements/active`;
    const cacheKey = `advertisements_${category}_${store_code || 'default'}`;

    // Prepare request body
    const requestBody = {
      category,
      enrich_products: true
    };

    // Add store_code if provided
    if (store_code) {
      requestBody.store_code = store_code;
    }

    console.log('🔗 Fetching advertisements from:', url);
    console.log('📦 Request body:', requestBody);

    // If online, try to fetch from network first
    if (isOnline()) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📥 Advertisements response:', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Advertisements API response received');

        if (!data.success || !data.data) {
          console.warn('⚠️ Invalid advertisements response, using fallback');
          return getFallbackAdvertisements();
        }

        // Process products in each advertisement
        const processedData = {
          ...data,
          data: data.data.map(ad => ({
            ...ad,
            products: ad.products?.map(product => ({
              ...product,
              product_details: processProductData(product.product_details)
            })) || []
          })),
          isOffline: false,
          isFallback: false
        };

        // Cache the response
        await cacheMerchandisingData(cacheKey, processedData);

        return processedData;
      } catch (networkError) {
        console.warn('Network request failed for advertisements, trying cache:', networkError);

        // Try to get from cache
        const cachedData = await getCachedMerchandisingData(cacheKey);
        if (cachedData) {
          console.log('✅ Serving advertisements from cache');
          return { ...cachedData, isOffline: true };
        }

        // Use fallback data
        console.log('⚠️ No cache available, using fallback advertisements');
        return getFallbackAdvertisements();
      }
    } else {
      // Offline mode - try cache
      console.log('Offline mode: Attempting to load advertisements from cache');
      const cachedData = await getCachedMerchandisingData(cacheKey);

      if (cachedData) {
        console.log('Serving advertisements from cache (offline mode)');
        return { ...cachedData, isOffline: true };
      } else {
        console.log('No cache available in offline mode, using fallback');
        return getFallbackAdvertisements();
      }
    }
  } catch (error) {
    console.error('❌ Error fetching advertisements:', error);
    return getFallbackAdvertisements();
  }
};

export default {
  getBestSellers,
  getPopularCategories,
  getAdvertisements
};

