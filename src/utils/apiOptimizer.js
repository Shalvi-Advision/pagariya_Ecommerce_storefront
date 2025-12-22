/**
 * API Optimizer Utility
 *
 * This utility provides caching, rate limiting, request deduplication, and retry logic
 * to optimize API usage and prevent "Too many requests" errors.
 */

// Cache storage for responses with size limit
const responseCache = new Map();
const inFlightRequests = new Map();
const MAX_CACHE_SIZE = 100; // Maximum number of cached responses
const MAX_REQUESTS_PER_WINDOW = 50; // Maximum requests per time window
const TIME_WINDOW_MS = 10000; // Time window in milliseconds (10 seconds)
const CACHE_TTL = 5 * 60 * 1000; // Cache TTL: 5 minutes

// Use a circular buffer for timestamps to avoid O(n) shift operations
class CircularBuffer {
  constructor(size) {
    this.buffer = new Array(size);
    this.size = size;
    this.index = 0;
    this.count = 0;
  }

  push(value) {
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.size;
    if (this.count < this.size) {
      this.count++;
    }
  }

  getValidCount(now, windowMs) {
    let validCount = 0;
    for (let i = 0; i < this.count; i++) {
      if (this.buffer[i] >= now - windowMs) {
        validCount++;
      }
    }
    return validCount;
  }

  clear() {
    this.buffer = new Array(this.size);
    this.index = 0;
    this.count = 0;
  }
}

const requestTimestamps = new CircularBuffer(MAX_REQUESTS_PER_WINDOW * 2); // Buffer double the size

// Debug logging utility - only logs in development mode
const isDebugMode = process.env.NODE_ENV === 'development';
const debugLog = (message) => {
  if (isDebugMode) console.log(`[API] ${message}`);
};
const debugWarn = (message) => {
  if (isDebugMode) console.warn(`[API] ${message}`);
};

/**
 * Generates a cache key from request details
 * @param {string} url - Request URL
 * @param {Object} params - Request parameters or body
 * @param {string} method - HTTP method
 * @returns {string} - Cache key
 */
export const generateCacheKey = (url, params = {}, method = 'GET') => {
  // Optimized cache key generation - avoid JSON.stringify when possible
  let paramsStr = '';
  if (params && Object.keys(params).length > 0) {
    paramsStr = typeof params === 'string' ? params : JSON.stringify(params);
  }
  return paramsStr ? `${method}:${url}:${paramsStr}` : `${method}:${url}`;
};

/**
 * Checks if a request is rate-limited
 * @returns {boolean} - True if request should be rate limited
 */
export const isRateLimited = () => {
  const now = Date.now();
  // Count valid requests within the current time window
  const validCount = requestTimestamps.getValidCount(now, TIME_WINDOW_MS);
  return validCount >= MAX_REQUESTS_PER_WINDOW;
};

/**
 * Adds a timestamp for rate limiting calculations
 */
export const trackRequest = () => {
  requestTimestamps.push(Date.now());
};

/**
 * Gets cached response if available and not expired
 * @param {string} cacheKey - The cache key
 * @returns {Object|null} - Cached response or null
 */
export const getCachedResponse = (cacheKey) => {
  if (!responseCache.has(cacheKey)) {
    return null;
  }
  
  const { data, timestamp } = responseCache.get(cacheKey);
  
  // Check if cache is expired
  if (Date.now() - timestamp > CACHE_TTL) {
    responseCache.delete(cacheKey);
    return null;
  }
  
  return data;
};

/**
 * Caches a response with size limit enforcement
 * @param {string} cacheKey - The cache key
 * @param {Object} data - Response data
 */
export const cacheResponse = (cacheKey, data) => {
  // If cache is at max size and key is not already in cache, remove oldest entry
  if (responseCache.size >= MAX_CACHE_SIZE && !responseCache.has(cacheKey)) {
    // Remove the oldest entry (first one)
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }

  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Clears the entire cache or a specific item
 * @param {string} [cacheKey] - Optional cache key to clear
 */
export const clearCache = (cacheKey) => {
  if (cacheKey) {
    responseCache.delete(cacheKey);
  } else {
    responseCache.clear();
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = () => {
  const now = Date.now();
  let deletedCount = 0;
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
      deletedCount++;
    }
  }
  return deletedCount;
};

/**
 * Optimized fetch with caching, deduplication, rate limiting and retry logic
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {boolean} [useCache=true] - Whether to use caching
 * @param {number} [maxRetries=3] - Maximum number of retries
 * @param {number} [retryDelay=1000] - Delay between retries in milliseconds
 * @returns {Promise<Object>} - Response data
 */
export const optimizedFetch = async (
  url,
  options = {},
  useCache = true,
  maxRetries = 3,
  retryDelay = 1000
) => {
  // Default options
  const defaultOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const fetchOptions = { ...defaultOptions, ...options };
  const params = fetchOptions.body ? JSON.parse(fetchOptions.body) : {};
  const method = fetchOptions.method;
  const cacheKey = generateCacheKey(url, params, method);
  
  // Return cached response if available and caching is enabled
  if (useCache && method === 'GET') {
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      debugLog(`Serving from cache: ${url}`);
      return cachedResponse;
    }
  }

  // Check for in-flight requests to the same endpoint to avoid duplicates
  if (inFlightRequests.has(cacheKey)) {
    debugLog(`Reusing in-flight request: ${url}`);
    return inFlightRequests.get(cacheKey);
  }
  
  // Check rate limiting
  if (isRateLimited()) {
    // Find the oldest timestamp within the window
    const now = Date.now();
    let oldestTimestamp = now;
    for (let i = 0; i < requestTimestamps.count; i++) {
      const timestamp = requestTimestamps.buffer[i];
      if (timestamp >= now - TIME_WINDOW_MS && timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
      }
    }

    const waitTime = Math.max(0, TIME_WINDOW_MS - (now - oldestTimestamp) + 100);

    // Return promise that resolves after rate limit window passes
    const rateLimitPromise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const response = await optimizedFetch(url, options, useCache, maxRetries, retryDelay);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      }, waitTime);
    });

    inFlightRequests.set(cacheKey, rateLimitPromise);

    try {
      const response = await rateLimitPromise;
      inFlightRequests.delete(cacheKey);
      return response;
    } catch (error) {
      inFlightRequests.delete(cacheKey);
      throw error;
    }
  }
  
  // Track this request for rate limiting
  trackRequest();
  
  // Create the fetch promise with retry logic
  const executeFetch = async (retries) => {
    try {
      const response = await fetch(url, fetchOptions);
      
      // Handle HTTP errors
      if (!response.ok) {
        // If rate limited by server
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);

          if (retries > 0) {
            debugWarn(`Rate limited by server. Retrying after ${retryAfter} seconds.`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return executeFetch(retries - 1);
          } else {
            throw new Error(`Rate limit exceeded. Try again later.`);
          }
        }
        
        // Other HTTP errors
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the successful response
      if (useCache && method === 'GET') {
        cacheResponse(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      // Network errors or JSON parsing errors
      if (retries > 0 && !error.message.includes('Rate limit exceeded')) {
        debugWarn(`Request failed. Retrying... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return executeFetch(retries - 1);
      }
      
      throw error;
    }
  };
  
  // Store the fetch promise to handle duplicate requests
  const fetchPromise = executeFetch(maxRetries);
  inFlightRequests.set(cacheKey, fetchPromise);
  
  try {
    const response = await fetchPromise;
    inFlightRequests.delete(cacheKey);
    return response;
  } catch (error) {
    inFlightRequests.delete(cacheKey);
    throw error;
  }
};

/**
 * Cleanup function - should be called on component unmount
 */
export const cleanup = () => {
  inFlightRequests.clear();
};

// Automatically clean expired cache every 5 minutes
setInterval(clearExpiredCache, 5 * 60 * 1000);

export default {
  optimizedFetch,
  generateCacheKey,
  getCachedResponse,
  cacheResponse,
  clearCache,
  cleanup,
  isRateLimited,
  trackRequest
};
