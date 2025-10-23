// API Base URL - Updated to use the new API structure
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ecommerceapi-web.onrender.com/api';

// Cache configuration for enabled pincodes
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PINCODES = 'cached_enabled_pincodes';
const CACHE_KEY_TIMESTAMP = 'cached_enabled_pincodes_timestamp';

/**
 * Get cached enabled pincodes if available and not expired
 * @returns {Object|null} Cached pincode data or null if not available
 */
const getCachedPincodes = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY_PINCODES);
    const timestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);

    if (!cachedData || !timestamp) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - parseInt(timestamp) > CACHE_DURATION_MS) {
      return null;
    }

    return JSON.parse(cachedData);
  } catch (e) {
    console.warn('Error reading from pincode cache:', e);
    return null;
  }
};

/**
 * Cache enabled pincode data
 * @param {Object} data - Pincode data to cache
 */
const cachePincodes = (data) => {
  try {
    localStorage.setItem(CACHE_KEY_PINCODES, JSON.stringify(data));
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
  } catch (e) {
    console.warn('Error writing to pincode cache:', e);
  }
};

/**
 * Get all enabled pincodes for autocomplete (new API endpoint)
 * @returns {Promise<Object>} API response with enabled pincode list
 */
export const getAllPincodes = async () => {
  try {
    // Try to get data from cache first
    const cachedData = getCachedPincodes();
    if (cachedData) {
      console.log('🔄 Using cached enabled pincodes');
      return cachedData;
    }

    console.log('🌐 Fetching enabled pincodes from API...');

    const response = await fetch(`${API_BASE_URL}/pincodes/enabled/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the successful response
    cachePincodes(data);
    return data;
  } catch (error) {
    console.error('Error in getAllPincodes:', error);
    throw error;
  }
};

/**
 * Check if a pincode is available/serviceable (new API endpoint)
 * @param {string} pincode - The pincode to check
 * @returns {Promise<Object>} API response with availability status
 */
export const checkPincodeServiceability = async (pincode) => {
  try {
    console.log('🔍 Checking serviceability for pincode:', pincode);
    console.log('🔍 API URL:', `${API_BASE_URL}/pincodes/check-availability`);
    
    const response = await fetch(`${API_BASE_URL}/pincodes/check-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pincode }),
    });

    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 Raw serviceability response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error checking pincode availability:', error);
    throw error;
  }
};

/**
 * Get stores available for a specific pincode (new API endpoint)
 * @param {string} pincode - The pincode to get stores for
 * @returns {Promise<Object>} API response with store list
 */
export const getPincodeStores = async (pincode) => {
  try {
    console.log('🌐 Fetching stores for pincode:', pincode);
    console.log('🌐 API URL:', `${API_BASE_URL}/stores/by-pincode`);
    
    const response = await fetch(`${API_BASE_URL}/stores/by-pincode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pincode }),
    });

    console.log('🌐 Response status:', response.status);
    console.log('🌐 Response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🌐 Raw API response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching pincode stores:', error);
    throw error;
  }
};

/**
 * Search pincodes with autocomplete functionality
 * @param {string} query - Search query
 * @param {Array} pincodeList - List of all enabled pincodes
 * @returns {Array} Filtered pincodes matching the query
 */
export const searchPincodes = (query, pincodeList) => {
  if (!query || !pincodeList) return [];

  const searchTerm = query.toLowerCase().trim();

  return pincodeList.filter(pincode =>
    pincode.pincode.includes(searchTerm)
  ).slice(0, 20); // Limit to 20 results
};

/**
 * Format pincode data for display (updated for new API structure)
 * @param {Object} pincodeData - Raw pincode data from API
 * @returns {Object} Formatted pincode data
 */
export const formatPincodeData = (pincodeData) => {
  return {
    _id: pincodeData.id,
    pincode: pincodeData.pincode,
    area: 'Unknown Area', // New API doesn't provide area
    fullAddress: `${pincodeData.pincode}, India`,
    isEnabled: true // All returned pincodes are enabled
  };
};

/**
 * Format store data for display (updated for new API structure)
 * @param {Object} storeData - Raw store data from API
 * @returns {Object} Formatted store data
 */
export const formatStoreData = (storeData) => {
  return {
    _id: storeData.id,
    storeCode: storeData.store_code,
    storeName: storeData.store_name,
    storeAddress: storeData.address,
    pincode: storeData.pincode,
    minOrderAmount: storeData.min_order_amount,
    storeOpenTime: storeData.store_open_time,
    storeDeliveryTime: storeData.delivery_time,
    storeOfferName: storeData.offer,
    latitude: storeData.location?.latitude,
    longitude: storeData.location?.longitude,
    homeDelivery: storeData.delivery_options?.home_delivery,
    selfPickup: storeData.delivery_options?.self_pickup,
    storeMessage: storeData.message,
    contactNumber: storeData.contact?.phone,
    email: storeData.contact?.email,
    whatsappNumber: storeData.contact?.whatsapp,
    isEnabled: storeData.is_enabled === 'Enabled'
  };
};