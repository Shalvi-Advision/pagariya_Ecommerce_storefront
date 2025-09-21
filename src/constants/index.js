// Main constants export file
// Central hub for all application constants

export { default as THEME } from './theme';
export { default as TYPOGRAPHY } from './typography';
export { default as RESPONSIVE } from './responsive';

// Re-export individual exports for convenience
export {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  Z_INDEX,
  TRANSITIONS,
} from './theme';

export {
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  LINE_HEIGHT,
  TEXT_DECORATION,
  TEXT_STYLES,
} from './typography';

export {
  BREAKPOINTS,
  CONTAINER_SIZES,
  SPACING_RESPONSIVE,
  GRID_COLUMNS,
  FLEX_DIRECTIONS,
  TEXT_SIZES_RESPONSIVE,
  MEDIA_QUERIES,
  RESPONSIVE_PATTERNS,
  DEVICES,
  COMPONENT_RESPONSIVE,
  getResponsiveValue,
  createResponsiveClass,
  SCREEN_SIZES,
} from './responsive';

export {
  RESPONSIVE_COMPONENT_PATTERNS,
  COMMON_RESPONSIVE_PATTERNS,
} from './responsive-design-guide';

// Common constant combinations for easy use
export const APP_CONSTANTS = {
  // App-wide constants
  APP_NAME: 'E-Shop',
  APP_VERSION: '1.0.0',
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LANGUAGE: 'en',

  // API constants
  API_BASE_URL: process.env.REACT_APP_API_URL || "https://ecom-api-ozl0.onrender.com/api",
  IMAGE_BASE_URL: process.env.REACT_APP_IMAGE_URL || 'http://localhost:5000/uploads',

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File upload limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Product constants
  MAX_PRODUCT_IMAGES: 5,
  PRODUCT_NAME_MAX_LENGTH: 100,
  PRODUCT_DESCRIPTION_MAX_LENGTH: 1000,

  // Cart constants
  MAX_CART_ITEMS: 50,
  CART_EXPIRY_DAYS: 30,

  // Order constants
  ORDER_NUMBER_PREFIX: 'ORD-',
  MAX_ORDER_NOTES_LENGTH: 500,

  // User constants
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 6,

  // Validation constants
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,

  // Time constants
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes

  // Animation constants
  ANIMATION_DURATION: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Z-index layers
  Z_LAYERS: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    modal: 1040,
    tooltip: 1060,
    toast: 1070,
  },
};

// Status constants
export const STATUS = {
  // General status
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',

  // Order status
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },

  // Payment status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },

  // User status
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending_verification',
  },

  // Product status
  PRODUCT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    OUT_OF_STOCK: 'out_of_stock',
    DISCONTINUED: 'discontinued',
  },
};

// Error constants
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DISABLED: 'Your account has been disabled',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  SESSION_EXPIRED: 'Your session has expired. Please login again',

  // Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',

  // File upload
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'File type not supported',
  UPLOAD_FAILED: 'File upload failed. Please try again',

  // Network
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  TIMEOUT_ERROR: 'Request timed out. Please try again',

  // Business logic
  OUT_OF_STOCK: 'This product is currently out of stock',
  INSUFFICIENT_QUANTITY: 'Insufficient quantity available',
  CART_EMPTY: 'Your cart is empty',
  INVALID_COUPON: 'Invalid or expired coupon code',
  PAYMENT_FAILED: 'Payment processing failed',
};

// Success messages
export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  REGISTRATION_SUCCESS: 'Account created successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',

  // Actions
  ITEM_ADDED_TO_CART: 'Item added to cart',
  ITEM_REMOVED_FROM_CART: 'Item removed from cart',
  ORDER_PLACED: 'Order placed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',

  // Operations
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Action types for state management
export const ACTION_TYPES = {
  // Authentication
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  AUTH_LOGOUT: 'AUTH_LOGOUT',

  // Cart
  CART_ADD_ITEM: 'CART_ADD_ITEM',
  CART_REMOVE_ITEM: 'CART_REMOVE_ITEM',
  CART_UPDATE_QUANTITY: 'CART_UPDATE_QUANTITY',
  CART_CLEAR: 'CART_CLEAR',
  CART_LOAD: 'CART_LOAD',

  // Products
  PRODUCTS_FETCH_START: 'PRODUCTS_FETCH_START',
  PRODUCTS_FETCH_SUCCESS: 'PRODUCTS_FETCH_SUCCESS',
  PRODUCTS_FETCH_FAILURE: 'PRODUCTS_FETCH_FAILURE',

  // Orders
  ORDERS_FETCH_START: 'ORDERS_FETCH_START',
  ORDERS_FETCH_SUCCESS: 'ORDERS_FETCH_SUCCESS',
  ORDERS_FETCH_FAILURE: 'ORDERS_FETCH_FAILURE',

  // UI
  UI_SET_LOADING: 'UI_SET_LOADING',
  UI_SET_ERROR: 'UI_SET_ERROR',
  UI_CLEAR_ERROR: 'UI_CLEAR_ERROR',
  UI_SET_SUCCESS: 'UI_SET_SUCCESS',
  UI_CLEAR_SUCCESS: 'UI_CLEAR_SUCCESS',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
  CART: 'cart_data',
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  SETTINGS: 'user_settings',
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    ME: '/auth/me',
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    CREATE: '/products',
    UPDATE: '/products/:id',
    DELETE: '/products/:id',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD: '/cart',
    UPDATE: '/cart/:id',
    REMOVE: '/cart/:id',
    CLEAR: '/cart/clear',
    MERGE: '/cart/merge',
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    DETAIL: '/orders/:id',
    CREATE: '/orders',
    CANCEL: '/orders/:id/cancel',
    TRACK: '/orders/:id/track',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    ADDRESSES: '/users/addresses',
    ORDERS: '/users/orders',
  },
};

// Export everything as a single object for convenience
export const CONSTANTS = {
  APP: APP_CONSTANTS,
  STATUS,
  ERRORS: ERROR_MESSAGES,
  SUCCESS: SUCCESS_MESSAGES,
  HTTP: HTTP_STATUS,
  ACTIONS: ACTION_TYPES,
  STORAGE: STORAGE_KEYS,
  API: API_ENDPOINTS,
};
