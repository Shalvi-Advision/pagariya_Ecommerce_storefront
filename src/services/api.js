// Base API service with authentication support
import axios from 'axios';
import { APP_CONSTANTS } from '../constants';
import { optimizedFetch, generateCacheKey, cacheResponse, getCachedResponse } from '../utils/apiOptimizer';
import { throttle } from '../utils/asyncUtils';

// OTP Authentication Configuration
const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add default timeout
  timeout: 15000,
});

// Request interceptor to add auth token and store_code
api.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add store_code from localStorage to all API requests
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        const storeCode = location?.store?.store_code;

        if (storeCode) {
          // Add to POST/PUT/PATCH request body
          if (['post', 'put', 'patch'].includes(config.method?.toLowerCase())) {
            config.data = {
              ...config.data,
              store_code: storeCode
            };
          }
          // Add to GET/DELETE as query param
          else if (['get', 'delete'].includes(config.method?.toLowerCase())) {
            config.params = {
              ...config.params,
              store_code: storeCode
            };
          }
        }
      } catch (error) {
        console.warn('Failed to add store_code to request:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearStoredToken();
      // You might want to redirect to login or dispatch logout action
      window.location.href = '/login';
    }

    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message);

    return Promise.reject(error);
  }
);

// Token storage utilities
export const getStoredToken = () => {
  // Try localStorage first (web)
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('auth_token');
  }

  // For PWA/mobile, we'll use IndexedDB as fallback
  // This is a simplified version - in production you'd want more robust IndexedDB handling
  return null;
};

export const setStoredToken = async (token) => {
  // Store in localStorage for web
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('auth_token', token);
  }

  // For PWA compatibility, you could also store in IndexedDB
  // This ensures offline persistence
  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      const db = await openAuthDB();
      const transaction = db.transaction(['tokens'], 'readwrite');
      const store = transaction.objectStore('tokens');
      await store.put({ id: 'auth_token', value: token, timestamp: Date.now() });
      db.close();
    } catch (error) {
      console.warn('IndexedDB storage failed:', error);
    }
  }
};

export const clearStoredToken = () => {
  // Clear from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('auth_token');
  }

  // Clear from IndexedDB
  if (typeof window !== 'undefined' && window.indexedDB) {
    clearIndexedDBToken();
  }
};

// IndexedDB utilities for PWA token persistence
const openAuthDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AuthDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens', { keyPath: 'id' });
      }
    };
  });
};

const clearIndexedDBToken = async () => {
  try {
    const db = await openAuthDB();
    const transaction = db.transaction(['tokens'], 'readwrite');
    const store = transaction.objectStore('tokens');
    await store.delete('auth_token');
    db.close();
  } catch (error) {
    console.warn('IndexedDB clear failed:', error);
  }
};

// Reusable API methods
// Cache for API responses
const apiCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Throttle consecutive API calls to the same endpoint
const throttledApiCalls = new Map();

// Get or create a throttled version of apiPost for a specific endpoint
const getThrottledApiCall = (endpoint) => {
  if (!throttledApiCalls.has(endpoint)) {
    throttledApiCalls.set(endpoint, throttle(async (data) => {
      return await apiPostInternal(endpoint, data);
    }, 1000)); // Throttle to one call per second per endpoint
  }
  return throttledApiCalls.get(endpoint);
};

// Internal API post implementation
const apiPostInternal = async (endpoint, data) => {
  try {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 apiPost called:', { endpoint, data });
      console.log('🌐 Full URL:', `${API_BASE_URL}${endpoint}`);
    }
    
    const response = await api.post(endpoint, data);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ apiPost response status:', response.status);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ apiPost error:', error.message);
    
    // Only log detailed error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error response data:', error.response?.data);
    }
    
    throw error.response?.data || error;
  }
};

// Public API post function with caching for GET-like POST requests
export const apiPost = async (endpoint, data, useCache = false) => {
  // For some endpoints that are effectively GET requests but use POST (like product listings),
  // we can safely cache them
  const cacheable = [
    '/products/getpcodeproducts',
    '/products/get_active_products_list'
  ];
  
  // If it's a cacheable endpoint and we want to use cache
  if (useCache && cacheable.includes(endpoint)) {
    const cacheKey = generateCacheKey(`${API_BASE_URL}${endpoint}`, data, 'POST');
    const cachedData = getCachedResponse(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, make the request
    const response = await getThrottledApiCall(endpoint)(data);
    
    // Cache the response
    cacheResponse(cacheKey, response);
    return response;
  }
  
  // For non-cacheable endpoints or when not using cache
  return getThrottledApiCall(endpoint)(data);
};

// POST method that automatically includes project code
export const postWithProjectCode = async (endpoint, data) => {
  try {
    const dataWithProjectCode = {
      ...data,
      project_code: OTP_PROJECT_CODE
    };
    const response = await api.post(endpoint, dataWithProjectCode);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const apiGet = async (endpoint, params = {}, useCache = true) => {
  try {
    // Use optimizedFetch with caching for GET requests
    const url = `${API_BASE_URL}${endpoint}`;
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
    
    const result = await optimizedFetch(
      `${url}${queryString}`,
      { method: 'GET' },
      useCache
    );
    
    return result;
  } catch (error) {
    console.error(`❌ apiGet error for ${endpoint}:`, error.message);
    throw error.response?.data || error;
  }
};

export const apiPut = async (endpoint, data) => {
  try {
    const response = await api.put(endpoint, data);
    
    // Clear any cached GET requests that might be affected by this PUT
    const cacheKey = endpoint.split('/');
    if (cacheKey.length > 1) {
      const resourceType = cacheKey[1]; // e.g., 'products', 'users', etc.
      // Clear all cache entries that contain this resource type
      Array.from(apiCache.keys())
        .filter(key => key.includes(`/${resourceType}/`))
        .forEach(key => apiCache.delete(key));
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ apiPut error for ${endpoint}:`, error.message);
    throw error.response?.data || error;
  }
};

export const apiDelete = async (endpoint) => {
  try {
    const response = await api.delete(endpoint);
    
    // Clear any cached GET requests that might be affected by this DELETE
    const cacheKey = endpoint.split('/');
    if (cacheKey.length > 1) {
      const resourceType = cacheKey[1]; // e.g., 'products', 'users', etc.
      // Clear all cache entries that contain this resource type
      Array.from(apiCache.keys())
        .filter(key => key.includes(`/${resourceType}/`))
        .forEach(key => apiCache.delete(key));
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ apiDelete error for ${endpoint}:`, error.message);
    throw error.response?.data || error;
  }
};

// OTP Authentication API Methods
export const otpAuth = {
  // Send OTP to mobile number
  getOtp: async (mobileNo) => {
    try {
      return await apiPost('/auth/send-otp', {
        mobile: mobileNo.replace(/\s+/g, ''), // Remove spaces
      });
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify OTP and get authentication token
  validateOtp: async (mobileNo, otp) => {
    try {
      return await apiPost('/auth/verify-otp', {
        mobile: mobileNo.replace(/\s+/g, ''), // Remove spaces
        otp: otp.replace(/\s+/g, ''), // Remove spaces
      });
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      return await apiGet('/auth/profile');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      return await apiPut('/auth/profile', profileData);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      return await apiPost('/auth/logout', {});
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user activity / is active
  isActive: async (sessionData = {}) => {
    try {
      return await apiPost('/auth/is-active', sessionData);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify token validity (legacy method for backward compatibility)
  verifyToken: async (token) => {
    try {
      const response = await api.post('/auth/verify_token', {
        token
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Refresh token (legacy method for backward compatibility)
  refreshToken: async (token) => {
    try {
      const response = await api.post('/auth/refresh_token', {
        token
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Centralized postAuth method that handles authentication automatically
export const postAuth = async (endpoint, data, useToken = true) => {
  try {
    const config = {};

    // Add authorization header if token exists and useToken is true
    if (useToken) {
      const token = getStoredToken();
      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`
        };
      }
    }

    const response = await api.post(endpoint, data, config);
    return response.data;
  } catch (error) {
    // Handle token expiration
    if (error.response?.status === 401 && useToken) {
      // Clear stored token on authentication error
      clearStoredToken();
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw error.response?.data || error;
  }
};

// Utility function to convert MongoDB Decimal128 to number
const convertToNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;

  // Handle MongoDB Decimal128 objects
  if (typeof value === 'object' && value !== null && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal) || defaultValue;
  }

  // Handle regular numbers
  if (typeof value === 'number') return value;

  // Handle string numbers
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
};

// Utility function to convert MongoDB ObjectId to string
const convertObjectId = (id) => {
  if (id === null || id === undefined) return null;

  // Handle MongoDB ObjectId objects
  if (typeof id === 'object' && id !== null && '$oid' in id) {
    return id.$oid;
  }

  // Handle regular strings
  if (typeof id === 'string') return id;

  // Try to convert to string
  return id?.toString() || null;
};

// Process product data to convert MongoDB types
const processProductData = (product) => {
  if (!product || typeof product !== 'object') return product;

  // Calculate discount percentage
  const mrp = convertToNumber(product.product_mrp, 0);
  const ourPrice = convertToNumber(product.our_price, 0);
  const discountPercentage = mrp > 0 ? Math.round(((mrp - ourPrice) / mrp) * 100) : 0;

  return {
    ...product,
    _id: convertObjectId(product._id),
    product_name: product.product_name || '',
    product_description: product.product_description || '',
    product_mrp: mrp,
    our_price: ourPrice,
    discount_percentage: discountPercentage,
    store_quantity: convertToNumber(product.store_quantity, 50), // Default stock
    max_quantity_allowed: convertToNumber(product.max_quantity_allowed, 10),
    package_size: product.package_size ? `${product.package_size} ${product.package_unit || 'GM'}` : '1 GM',
    category: product.category || 'General',
    brand: product.brand_name || product.brand || 'Unknown',
    image_url: product.pcode_img || product.image_url || '/images/logo.jpg',
    is_active: product.pcode_status === 'Y',
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString()
  };
};

// Product Details API
// Product details cache with 5 minute expiry
const productDetailsCache = new Map();
const PRODUCT_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const getProductDetails = async (p_code, store_code, project_code) => {
  try {
    // Generate cache key based on parameters
    const cacheKey = `product:${p_code}:${store_code}:${project_code}`;
    
    // Check if we have a cached version
    const cachedProduct = productDetailsCache.get(cacheKey);
    if (cachedProduct && (Date.now() - cachedProduct.timestamp < PRODUCT_CACHE_EXPIRY)) {
      // Return cached version if not expired
      return cachedProduct.data;
    }
    
    // Minimal logging in production
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 getProductDetails called with:', { p_code, store_code, project_code });
    }
    
    // Use apiPost with caching enabled for product details
    const response = await apiPost('/products/getpcodeproducts', {
      p_code,
      store_code,
      project_code
    }, true); // Enable caching for this POST request
    
    // Check if the response indicates an error
    if (response && response.success === false) {
      throw new Error(response.message || 'Product not found');
    }
    
    // Check if response has data
    if (!response || !response.data) {
      throw new Error('Product data not found in response');
    }
    
    // Process the product data to convert MongoDB types
    const processedData = processProductData(response.data);
    
    // Create the final response
    const finalResponse = {
      ...response,
      data: processedData
    };
    
    // Cache the processed response
    productDetailsCache.set(cacheKey, {
      data: finalResponse,
      timestamp: Date.now()
    });
    
    return finalResponse;
  } catch (error) {
    console.error(`❌ getProductDetails error for ${p_code}:`, error.message);
    
    // Provide more detailed logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    
    // If it's already an Error object, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 404) {
        throw new Error('Product not found (404)');
      } else if (error.response.status === 500) {
        throw new Error('Server error (500)');
      } else {
        throw new Error(`API error: ${error.response.status} - ${error.response.statusText}`);
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error - unable to reach server');
    } else {
      // Other error
      const errorMessage = error.message || 'Failed to fetch product details';
      throw new Error(errorMessage);
    }
  }
};

export { processProductData };
export default api;
