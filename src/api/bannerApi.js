// Banner API service functions
import { APP_CONSTANTS } from '../constants';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

// Helper to get store_code from localStorage
const getStoreCode = () => {
  try {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      const location = JSON.parse(locationData);
      return location?.store?.store_code || 'AVB';
    }
  } catch (error) {
    console.error('Error getting store code:', error);
  }
  return 'AVB';
};

// Offline storage utilities for banners
const DB_NAME = 'ShalviEcommerceDB';
const BANNERS_STORE = 'banners';
const CACHE_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Initialize IndexedDB for banners
const initBannerDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Increment version to trigger upgrade

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create banners store if it doesn't exist
      if (!db.objectStoreNames.contains(BANNERS_STORE)) {
        const store = db.createObjectStore(BANNERS_STORE, { keyPath: 'cacheKey' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('✅ Created banners object store in IndexedDB');
      }
    };
  });
};

// Cache banner data
const cacheBannerData = async (cacheKey, data) => {
  try {
    const db = await initBannerDB();
    
    // Check if the object store exists
    if (!db.objectStoreNames.contains(BANNERS_STORE)) {
      console.warn('Banners object store does not exist, skipping cache');
      db.close();
      return;
    }
    
    const transaction = db.transaction([BANNERS_STORE], 'readwrite');
    const store = transaction.objectStore(BANNERS_STORE);

    await store.put({
      cacheKey,
      data,
      timestamp: Date.now()
    });

    console.log('✅ Banner data cached successfully');
    db.close();
  } catch (error) {
    console.warn('Failed to cache banner data:', error);
  }
};

// Get cached banner data
const getCachedBannerData = async (cacheKey) => {
  try {
    const db = await initBannerDB();
    
    // Check if the object store exists
    if (!db.objectStoreNames.contains(BANNERS_STORE)) {
      console.warn('Banners object store does not exist, no cached data available');
      db.close();
      return null;
    }
    
    const transaction = db.transaction([BANNERS_STORE], 'readonly');
    const store = transaction.objectStore(BANNERS_STORE);

    return new Promise((resolve) => {
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const result = request.result;

        if (result && (Date.now() - result.timestamp) < CACHE_EXPIRY) {
          console.log('✅ Retrieved banner data from cache');
          resolve(result.data);
        } else {
          // Cache expired or doesn't exist
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn('Failed to get cached banner data:', error);
    return null;
  }
};

// Process banner data to ensure consistent format
// If banner has multiple assets, this processes a single asset
const processBannerData = (banner, asset = null, assetIndex = 0) => {
  if (!banner || typeof banner !== 'object') return null;

  // Build redirect link from action
  let redirect_link = '#';
  if (banner.action) {
    if (banner.action.type === 'category') {
      redirect_link = `/category/${banner.action.value}`;
    } else if (banner.action.type === 'product') {
      redirect_link = `/product/${banner.action.value}`;
    } else if (banner.action.type === 'url') {
      redirect_link = banner.action.value;
    }
  }

  // Determine image URL - prefer responsive images, fallback to image_url
  let banner_img = banner.image_url || '/images/placeholder-banner.jpg';
  let banner_img_mobile = null;
  let banner_img_desktop = null;
  
  // If a specific asset is provided, use it
  if (asset) {
    banner_img_desktop = asset.desktop;
    banner_img_mobile = asset.mobile;
    // Default to desktop, fallback to mobile, then image_url
    banner_img = asset.desktop || asset.mobile || banner_img;
  } else if (banner.banner_assets && banner.banner_assets.length > 0) {
    // Use the first banner asset if no specific asset provided
    const firstAsset = banner.banner_assets[0];
    banner_img_desktop = firstAsset.desktop;
    banner_img_mobile = firstAsset.mobile;
    // Default to desktop, fallback to mobile, then image_url
    banner_img = firstAsset.desktop || firstAsset.mobile || banner_img;
  } else if (banner.banner_urls && Object.keys(banner.banner_urls).length > 0) {
    // Use banner_urls if available
    const firstUrlKey = Object.keys(banner.banner_urls)[0];
    const urlData = banner.banner_urls[firstUrlKey];
    banner_img_desktop = urlData.desktop;
    banner_img_mobile = urlData.mobile;
    // Default to desktop, fallback to mobile, then image_url
    banner_img = urlData.desktop || urlData.mobile || banner_img;
  }

  // Generate unique ID for each asset (if multiple assets exist)
  const baseId = banner.id || banner._id || `banner_${Date.now()}`;
  const uniqueId = asset ? `${baseId}_asset_${assetIndex}` : baseId;

  return {
    _id: uniqueId,
    redirect_link,
    banner_img,
    banner_img_desktop: banner_img_desktop || banner_img,
    banner_img_mobile: banner_img_mobile || banner_img,
    is_active: banner.is_active === true || banner.is_active === 'Enabled',
    banner_type_id: 1,
    sequence_id: banner.sequence || banner.sequence_id || 0,
    store_code: banner.store_code || 'DEFAULT',
    banner_bg_color: banner.banner_bg_color || '#FFFFFF',
    // Additional fields for carousel
    title: banner.title || '',
    description: banner.description || '',
    alt_text: asset?.key ? `${banner.title || 'Banner'} - ${asset.key}` : (banner.title || 'Banner image'),
    // Store original banner data for reference
    originalBanner: banner
  };
};

// Convert banner data from API response format
const convertBannerData = (apiResponse, sectionName = 'home_top') => {
  if (!apiResponse || !apiResponse.data) {
    return [];
  }

  const banners = [];
  
  // Handle the new response structure: data.banner_sections[]
  if (apiResponse.data.banner_sections && Array.isArray(apiResponse.data.banner_sections)) {
    // Find the section matching the requested section_name
    const targetSection = apiResponse.data.banner_sections.find(
      section => section.section_name === sectionName
    );
    
    if (targetSection && targetSection.banners && Array.isArray(targetSection.banners)) {
      banners.push(...targetSection.banners);
    }
  }

  // Filter by is_active: true and sort by sequence
  const activeBanners = banners
    .filter(banner => banner.is_active === true)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  // Process banners - if a banner has multiple assets, create multiple processed banners
  const processedBanners = [];
  
  activeBanners.forEach((banner) => {
    // Check if banner has multiple banner_assets
    if (banner.banner_assets && banner.banner_assets.length > 0) {
      // Create one processed banner for each asset
      banner.banner_assets.forEach((asset, assetIndex) => {
        const processedBanner = processBannerData(banner, asset, assetIndex);
        if (processedBanner) {
          processedBanners.push(processedBanner);
        }
      });
    } else if (banner.banner_urls && Object.keys(banner.banner_urls).length > 0) {
      // Handle banner_urls - create one processed banner for each URL
      Object.keys(banner.banner_urls).forEach((urlKey, urlIndex) => {
        const urlData = banner.banner_urls[urlKey];
        const asset = {
          desktop: urlData.desktop,
          mobile: urlData.mobile,
          key: urlKey
        };
        const processedBanner = processBannerData(banner, asset, urlIndex);
        if (processedBanner) {
          processedBanners.push(processedBanner);
        }
      });
    } else {
      // No multiple assets, process normally
      const processedBanner = processBannerData(banner);
      if (processedBanner) {
        processedBanners.push(processedBanner);
      }
    }
  });

  return processedBanners;
};

// Fallback banner data for offline mode
const getFallbackBanners = () => {
  return [
    {
      _id: 'fallback_1',
      redirect_link: '#',
      banner_img: '/images/banner1.jpg',
      is_active: true,
      banner_type_id: 1,
      sequence_id: 1,
      store_code: 'FALLBACK',
      banner_bg_color: '#FFFFFF',
      title: 'Welcome to Our Store',
      description: 'Discover amazing products',
      alt_text: 'Welcome banner'
    },
    {
      _id: 'fallback_2',
      redirect_link: '#',
      banner_img: '/images/banner2.jpg',
      is_active: true,
      banner_type_id: 1,
      sequence_id: 2,
      store_code: 'FALLBACK',
      banner_bg_color: '#FFFFFF',
      title: 'Special Offers',
      description: 'Limited time deals',
      alt_text: 'Special offers banner'
    },
    {
      _id: 'fallback_3',
      redirect_link: '#',
      banner_img: '/images/banner3.jpg',
      is_active: true,
      banner_type_id: 1,
      sequence_id: 3,
      store_code: 'FALLBACK',
      banner_bg_color: '#FFFFFF',
      title: 'New Arrivals',
      description: 'Fresh products daily',
      alt_text: 'New arrivals banner'
    }
  ];
};

// Check if user is online
const isOnline = () => {
  return navigator.onLine;
};

// Utility function to make API calls with timeout and CORS handling
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Try using a CORS proxy if direct request fails
    const corsProxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    
    // First try to use direct URL
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        // Add CORS mode explicitly
        mode: 'cors',
        // Include credentials if needed
        credentials: 'same-origin'
      });
      clearTimeout(timeoutId);
      return response;
    } catch (directError) {
      console.warn('Direct API call failed, trying alternative approach...', directError);
      
      // If direct request failed due to CORS, use local fallback immediately
      if (directError.name === 'TypeError' || directError.message?.includes('CORS')) {
        throw new Error('CORS error: Using local fallback data');
      }
      
      // For non-CORS errors, throw the original error
      throw directError;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Fetch banners from API with offline caching support
 * @param {Object} params - Query parameters
 * @param {string} params.store_code - Store code (default: from localStorage or "AVB")
 * @param {string} params.section_name - Section name (default: "home_top")
 * @returns {Promise<Object>} - API response with banners
 */
export const getBanners = async (params = {}) => {
  try {
    const {
      store_code = getStoreCode(),
      section_name = 'home_top'
    } = params;

    const url = `${API_BASE_URL}/banners`;
    console.log('🔗 Full API URL:', url);
    console.log('🔑 Using credentials:', { store_code, section_name });
    const cacheKey = `banners_${store_code}_${section_name}`;

    // If online, try to fetch from network first
    if (isOnline()) {
      try {
        const requestBody = {
          store_code,
          section_name
        };

        console.log('🌐 Fetching banners from API:', { url, requestBody });
        console.log('📡 API Endpoint: /api/banners');
        console.log('🌐 Request headers:', {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        });

        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Add optional headers that might help with CORS
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Accept'
          },
          body: JSON.stringify(requestBody)
        }, 10000);

        console.log('📥 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          if (response.status === 404) {
            errorMessage = `Banner API endpoint not found (404). The endpoint '${url}' does not exist on the server.`;
            console.warn('⚠️ Banner API endpoint not found. Please check if the backend API endpoint is implemented.');
          } else if (response.status === 500) {
            errorMessage = `Server error (500). The banner API endpoint exists but returned an error.`;
          } else if (response.status === 0) {
            errorMessage = `Network error. Unable to connect to the API server.`;
          }
          
          console.error('❌ Banner API Error:', errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Banner API response received');

        // Validate response structure
        if (!data.success) {
          throw new Error('API returned success: false');
        }

        if (!data.data) {
          console.warn('⚠️ No data field in response, using empty banners array');
          const processedData = {
            banners: [],
            success: data.success,
            message: data.message || 'No banners available',
            isOffline: false,
            isFallback: false
          };
          return processedData;
        }

        // Process and convert banner data
        const processedBanners = convertBannerData(data, section_name);
        console.log('✅ Processed banners:', processedBanners.length, 'banners');

        const processedData = {
          banners: processedBanners,
          success: data.success,
          message: data.message || 'Banners retrieved successfully',
          isOffline: false,
          isFallback: false
        };

        // Cache the processed response for offline use
        await cacheBannerData(cacheKey, processedData);

        return processedData;
      }       catch (networkError) {
        console.warn('Network request failed, trying cache:', networkError);
        console.warn('Error details:', {
          name: networkError.name,
          message: networkError.message,
          status: networkError.response?.status,
          statusText: networkError.response?.statusText
        });
        
        // Special handling for CORS errors
        if (networkError.message?.includes('CORS')) {
          console.warn('❌ CORS error detected. This is likely because the API server does not allow requests from this origin.');
          console.warn('💡 Using cached or fallback data instead.');
        }

        // If network fails, try to get from cache
        const cachedData = await getCachedBannerData(cacheKey);
        if (cachedData) {
          console.log('✅ Serving banners from cache');
          return { ...cachedData, isOffline: true };
        }

        // If no cache available, use fallback data
        console.log('⚠️ No cache available, using fallback banner data');
        const fallbackBanners = getFallbackBanners();
        return {
          banners: fallbackBanners,
          success: true,
          message: 'Using fallback banner data',
          isOffline: true,
          isFallback: true
        };
      }
    } else {
      // Offline mode - try to get from cache
      console.log('Offline mode: Attempting to load banners from cache');
      const cachedData = await getCachedBannerData(cacheKey);

      if (cachedData) {
        console.log('Serving banners from cache (offline mode)');
        return { ...cachedData, isOffline: true };
      } else {
        // No cache available, use fallback data
        console.log('No cache available in offline mode, using fallback banner data');
        const fallbackBanners = getFallbackBanners();
        return {
          banners: fallbackBanners,
          success: true,
          message: 'Using fallback banner data (offline)',
          isOffline: true,
          isFallback: true
        };
      }
    }
  } catch (error) {
    console.error('❌ Error fetching banners:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      isOnline: isOnline()
    });
    
    // Return fallback data instead of throwing error
    const fallbackBanners = getFallbackBanners();
    return {
      banners: fallbackBanners,
      success: false,
      message: `Failed to fetch banners: ${error.message}. Using fallback data.`,
      error: error.message,
      isOffline: !isOnline(),
      isFallback: true
    };
  }
};

export default {
  getBanners
};
