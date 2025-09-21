// Products API service functions
import { APP_CONSTANTS } from '../constants';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

// Offline storage utilities
const DB_NAME = 'ShalviEcommerceDB';
const PRODUCTS_STORE = 'products';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

  return {
    ...product,
    _id: convertObjectId(product._id),
    product_mrp: convertToNumber(product.product_mrp, 0),
    our_price: convertToNumber(product.our_price, 0),
    discount_percentage: convertToNumber(product.discount_percentage, 0),
    store_quantity: convertToNumber(product.store_quantity, 0),
    max_quantity_allowed: convertToNumber(product.max_quantity_allowed, 10),
    package_size: convertToNumber(product.package_size, 0),
  };
};

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create products store
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        const store = db.createObjectStore(PRODUCTS_STORE, { keyPath: 'cacheKey' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Cache products data
const cacheProductsData = async (cacheKey, data) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);

    await store.put({
      cacheKey,
      data,
      timestamp: Date.now()
    });

    db.close();
  } catch (error) {
    console.warn('Failed to cache products data:', error);
  }
};

// Get cached products data
const getCachedProductsData = async (cacheKey) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readonly');
    const store = transaction.objectStore(PRODUCTS_STORE);

    return new Promise((resolve) => {
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const result = request.result;

        if (result && (Date.now() - result.timestamp) < CACHE_EXPIRY) {
          resolve(result.data);
        } else {
          // Cache expired or doesn't exist
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn('Failed to get cached products data:', error);
    return null;
  }
};

// Clear expired cache entries
const clearExpiredCache = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);
    const index = store.index('timestamp');

    const request = index.openCursor();
    const expiredKeys = [];

    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          if (Date.now() - cursor.value.timestamp > CACHE_EXPIRY) {
            expiredKeys.push(cursor.primaryKey);
          }
          cursor.continue();
        } else {
          // Delete expired entries
          expiredKeys.forEach(key => store.delete(key));
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  } catch (error) {
    console.warn('Failed to clear expired cache:', error);
  }
};

// Check if user is online
const isOnline = () => {
  return navigator.onLine;
};

/**
 * Fetch products with pagination support and offline caching
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.sort_by - Sort field (default: 'createdAt')
 * @param {string} params.sort_order - Sort order 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Object>} - API response with products and pagination
 */
export const getProducts = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by,
      sort_order
    });

    const url = `${API_BASE_URL}/products?${queryParams.toString()}`;
    const cacheKey = `products_${page}_${limit}_${sort_by}_${sort_order}`;

    // Clear expired cache entries periodically
    if (Math.random() < 0.1) { // 10% chance to clear expired cache
      clearExpiredCache();
    }

    // If online, try to fetch from network first
    if (isOnline()) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data.success || !data.data) {
          throw new Error('Invalid API response structure');
        }

        // Process and convert MongoDB types in product data
        const processedData = {
          ...data.data,
          products: data.data.products?.map(processProductData) || []
        };

        // Cache the processed response for offline use
        await cacheProductsData(cacheKey, processedData);

        return processedData;
      } catch (networkError) {
        console.warn('Network request failed, trying cache:', networkError);

        // If network fails, try to get from cache
        const cachedData = await getCachedProductsData(cacheKey);
        if (cachedData) {
          console.log('Serving products from cache');
          // Process cached data to ensure it's in the correct format
          const processedCachedData = {
            ...cachedData,
            products: cachedData.products?.map(processProductData) || []
          };
          return { ...processedCachedData, isOffline: true };
        }

        // If no cache available, throw the network error
        throw networkError;
      }
    } else {
      // Offline mode - try to get from cache
      console.log('Offline mode: Attempting to load products from cache');
      const cachedData = await getCachedProductsData(cacheKey);

      if (cachedData) {
        console.log('Serving products from cache (offline mode)');
        // Process cached data to ensure it's in the correct format
        const processedCachedData = {
          ...cachedData,
          products: cachedData.products?.map(processProductData) || []
        };
        return { ...processedCachedData, isOffline: true };
      } else {
        throw new Error('No cached products available. Please check your internet connection.');
      }
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Keep the old function for backward compatibility but mark as deprecated
export const fetchProducts = async (params = {}) => {
  console.warn('fetchProducts is deprecated. Use getProducts instead.');
  return getProducts(params);
};

export const fetchProductById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error(`Failed to search products: ${response.statusText}`);
    }

    const products = await response.json();
    // Simple client-side search - in a real app, this would be server-side
    const filteredProducts = products.filter(product =>
      product.title.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    );

    return filteredProducts;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};
