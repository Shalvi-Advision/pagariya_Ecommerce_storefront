// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Project code - this should be set in environment variables
const PROJECT_CODE = process.env.REACT_APP_PROJECT_CODE || 'default_project';

// Cache configuration
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PINCODES = 'cached_pincodes';
const CACHE_KEY_TIMESTAMP = 'cached_pincodes_timestamp';

// Fallback pincode data for when the API is unavailable
const FALLBACK_PINCODES = [
  {
    _id: 'fallback_1',
    pincode: '400001',
    area: 'Fort',
    is_enabled: 'Enabled'
  },
  {
    _id: 'fallback_2',
    pincode: '400050',
    area: 'Bandra West',
    is_enabled: 'Enabled'
  },
  {
    _id: 'fallback_3',
    pincode: '400053',
    area: 'Andheri East',
    is_enabled: 'Enabled'
  },
  {
    _id: 'fallback_4',
    pincode: '400076',
    area: 'Powai',
    is_enabled: 'Enabled'
  },
  {
    _id: 'fallback_5',
    pincode: '400098',
    area: 'Borivali West',
    is_enabled: 'Enabled'
  },
  {
    _id: 'fallback_6',
    pincode: '400101',
    area: 'Thane',
    is_enabled: 'Enabled'
  },
];

/**
 * Get cached pincodes if available and not expired
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
      // Cache expired
      return null;
    }
    
    return JSON.parse(cachedData);
  } catch (e) {
    console.warn('Error reading from cache:', e);
    return null;
  }
};

/**
 * Cache pincode data
 * @param {Object} data - Pincode data to cache
 */
const cachePincodes = (data) => {
  try {
    localStorage.setItem(CACHE_KEY_PINCODES, JSON.stringify(data));
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
  } catch (e) {
    console.warn('Error writing to cache:', e);
  }
};

/**
 * Get all available pincodes with caching and fallback
 * @returns {Promise<Object>} API response with pincode list
 */
export const getAllPincodes = async () => {
  try {
    // Try to get data from cache first
    const cachedData = getCachedPincodes();
    if (cachedData) {
      console.log('🔄 Using cached pincode data');
      return cachedData;
    }
    
    console.log('🌐 Fetching pincodes from API...');
    // Using AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/pincodes/get_pincode_list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the successful response
      cachePincodes(data);
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn('⚠️ API fetch failed, trying fallback:', fetchError.message);
      
      // Return formatted fallback data
      const fallbackResponse = {
        success: true,
        data: FALLBACK_PINCODES,
        message: 'Using fallback pincode data',
        isFallback: true
      };
      
      // Cache the fallback data too (short-lived)
      cachePincodes(fallbackResponse);
      return fallbackResponse;
    }
  } catch (error) {
    console.error('Error in getAllPincodes:', error);
    
    // Return fallback data instead of throwing error
    return {
      success: true,
      data: FALLBACK_PINCODES,
      message: 'Using fallback pincode data due to error',
      error: error.message,
      isFallback: true
    };
  }
};

/**
 * Check if a pincode is serviceable
 * @param {string} pincode - The pincode to check
 * @returns {Promise<Object>} API response with serviceability status
 */
export const checkPincodeServiceability = async (pincode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pincodes/check_if_pincode_exists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pincode: pincode,
        project_code: PROJECT_CODE
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking pincode serviceability:', error);
    throw error;
  }
};

/**
 * Get stores available for a specific pincode
 * @param {string} pincode - The pincode to get stores for
 * @returns {Promise<Object>} API response with store list
 */
export const getPincodeStores = async (pincode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pincodes/get_pincodewise_outlet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pincode: pincode,
        project_code: PROJECT_CODE
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pincode stores:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific store
 * @param {string} storeCode - The store code to get details for
 * @returns {Promise<Object>} API response with store details
 */
export const getStoreDetails = async (storeCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pincodes/get_store_details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_code: storeCode,
        project_code: PROJECT_CODE
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching store details:', error);
    throw error;
  }
};

/**
 * Search pincodes with autocomplete functionality
 * @param {string} query - Search query
 * @param {Array} pincodeList - List of all pincodes
 * @returns {Array} Filtered pincodes matching the query
 */
export const searchPincodes = (query, pincodeList) => {
  if (!query || !pincodeList) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return pincodeList.filter(pincode => 
    pincode.pincode.includes(searchTerm) ||
    (pincode.area && pincode.area.toLowerCase().includes(searchTerm)) ||
    (pincode.fullAddress && pincode.fullAddress.toLowerCase().includes(searchTerm))
  ).slice(0, 20); // Limit to 20 results
};

/**
 * Format pincode data for display
 * @param {Object} pincodeData - Raw pincode data from API
 * @returns {Object} Formatted pincode data
 */
export const formatPincodeData = (pincodeData) => {
  return {
    _id: pincodeData._id,
    pincode: pincodeData.pincode,
    area: pincodeData.area || 'Unknown Area',
    fullAddress: `${pincodeData.pincode}, India`,
    isEnabled: pincodeData.is_enabled === 'Enabled'
  };
};

/**
 * Format store data for display
 * @param {Object} storeData - Raw store data from API
 * @returns {Object} Formatted store data
 */
export const formatStoreData = (storeData) => {
  return {
    _id: storeData._id,
    storeCode: storeData.store_code,
    storeName: storeData.mobile_outlet_name,
    storeAddress: storeData.store_address,
    pincode: storeData.pincode,
    minOrderAmount: storeData.min_order_amount,
    storeOpenTime: storeData.store_open_time,
    storeDeliveryTime: storeData.store_delivery_time,
    storeOfferName: storeData.store_offer_name,
    latitude: storeData.latitude,
    longitude: storeData.longitude,
    homeDelivery: storeData.home_delivery === 'yes',
    selfPickup: storeData.self_pickup === 'yes',
    storeMessage: storeData.store_message,
    contactNumber: storeData.contact_number,
    email: storeData.email,
    whatsappNumber: storeData.whatsappnumber,
    isEnabled: storeData.is_enabled === 'Enabled'
  };
};