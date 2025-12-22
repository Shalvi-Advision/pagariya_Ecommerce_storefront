// Orders API service functions
import { APP_CONSTANTS } from '../constants';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

// Helper to get store_code from localStorage
const getStoreCode = () => {
  try {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      const location = JSON.parse(locationData);
      // Try both storeCode and store_code (for backwards compatibility)
      return location?.store?.storeCode || location?.store?.store_code;
    }
  } catch (error) {
    console.error('Failed to get store_code from localStorage:', error);
  }
  // Return null to indicate no store code is available
  return null;
};

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Helper to get mobile number from user data
const getMobileNumber = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user?.mobile || user?.phone || user?.mobile_number || '';
    }
  } catch (error) {
    console.warn('Failed to get mobile number:', error);
  }
  return '';
};

/**
 * Get all orders for the authenticated user
 * @param {number} limit - Number of orders to fetch (default: 20)
 * @returns {Promise<Object>} - Orders list response
 */
export const getMyOrders = async (limit = 20) => {
  try {
    const token = getAuthToken();

    if (!token) {
      const error = new Error('Authentication required. Please login first.');
      error.code = 'AUTH_TOKEN_MISSING';
      console.error('❌ Auth token validation failed:', error);
      throw error;
    }

    const url = `${API_BASE_URL}/orders/my-orders?limit=${limit}`;

    console.log('📦 Fetching user orders:', { url, limit });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch orders: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Orders fetched successfully:', {
      count: data.count,
      hasOrders: data.orders?.length > 0
    });

    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/**
 * Get details of a specific order by order number
 * @param {string} orderNumber - Order number (e.g., "ORD-2025001")
 * @returns {Promise<Object>} - Order details response
 */
export const getOrderDetails = async (orderNumber) => {
  try {
    const token = getAuthToken();

    if (!token) {
      const error = new Error('Authentication required. Please login first.');
      error.code = 'AUTH_TOKEN_MISSING';
      console.error('❌ Auth token validation failed:', error);
      throw error;
    }

    if (!orderNumber) {
      throw new Error('Order number is required');
    }

    const url = `${API_BASE_URL}/orders/${orderNumber}`;

    console.log('📦 Fetching order details:', { url, orderNumber });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch order details: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Order details fetched successfully:', {
      orderNumber: data.order?.order_number,
      status: data.order?.order_status
    });

    return data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

/**
 * Place a new order
 * @param {Object} orderData - Order details
 * @param {string} orderData.store_code - Store code
 * @param {string} orderData.project_code - Project code
 * @param {boolean} orderData.cart_validated - Must be true
 * @param {number} orderData.delivery_slot_id - Delivery slot ID
 * @param {string} orderData.delivery_date - Delivery date (ISO format)
 * @param {string} orderData.address_id - Address ID (MongoDB ObjectId)
 * @param {number} orderData.payment_mode_id - Payment mode ID
 * @param {string} orderData.order_notes - Optional order notes
 * @param {Object} orderData.payment_details - Optional payment details
 * @returns {Promise<Object>} - Place order response
 */
export const placeOrder = async (orderData) => {
  try {
    const storeCode = getStoreCode();
    const token = getAuthToken();

    if (!token) {
      const error = new Error('Authentication required. Please login first.');
      error.code = 'AUTH_TOKEN_MISSING';
      console.error('❌ Auth token validation failed:', error);
      throw error;
    }

    // Validate that store code exists in localStorage
    if (!storeCode) {
      const error = new Error('Store code not found. Please select a location first.');
      error.code = 'STORE_CODE_MISSING';
      console.error('❌ Store code validation failed:', error);
      throw error;
    }

    // Validate required fields
    if (!orderData.cart_validated) {
      throw new Error('Cart must be validated before placing order');
    }
    if (!orderData.delivery_slot_id) {
      throw new Error('Delivery slot is required');
    }
    if (!orderData.delivery_date) {
      throw new Error('Delivery date is required');
    }
    if (!orderData.address_id) {
      throw new Error('Delivery address is required');
    }
    if (!orderData.payment_mode_id) {
      throw new Error('Payment mode is required');
    }

    const projectCode = APP_CONSTANTS.PROJECT_CODE;
    const url = `${API_BASE_URL}/orders/place-order`;

    const requestBody = {
      store_code: orderData.store_code || storeCode,
      project_code: orderData.project_code || projectCode,
      cart_validated: orderData.cart_validated,
      delivery_slot_id: orderData.delivery_slot_id,
      delivery_date: orderData.delivery_date,
      address_id: orderData.address_id,
      payment_mode_id: orderData.payment_mode_id,
      order_notes: orderData.order_notes || '',
      payment_details: orderData.payment_details || {}
    };

    console.log('📦 Placing order:', { url, requestBody });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Place order failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `Failed to place order: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Order placed successfully:', {
      orderNumber: data.order?.order_number,
      totalAmount: data.order?.order_summary?.total_amount
    });

    return data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

/**
 * Get all orders (admin/testing endpoint)
 * @param {number} limit - Number of orders to fetch
 * @param {string} status - Filter by order status
 * @returns {Promise<Object>} - All orders response
 */
export const getAllOrders = async (limit = 50, status = null) => {
  try {
    const token = getAuthToken();

    if (!token) {
      const error = new Error('Authentication required. Please login first.');
      error.code = 'AUTH_TOKEN_MISSING';
      console.error('❌ Auth token validation failed:', error);
      throw error;
    }

    let url = `${API_BASE_URL}/orders?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    console.log('📦 Fetching all orders:', { url, limit, status });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch orders: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ All orders fetched successfully:', {
      count: data.count
    });

    return data;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
};

/**
 * Transform API order data to UI format
 * @param {Object} apiOrder - Order from API
 * @returns {Object} - Order in UI format
 */
export const transformOrderFromAPI = (apiOrder) => {
  // Handle both new API format and legacy format
  const deliveryInfo = apiOrder.delivery_info || {};
  const paymentInfo = apiOrder.payment_info || {};

  return {
    orderNumber: apiOrder.order_number,
    orderStatus: apiOrder.order_status,
    orderPlacedAt: apiOrder.order_placed_at,
    orderConfirmedAt: apiOrder.order_confirmed_at,
    orderCompletedAt: apiOrder.order_completed_at,
    estimatedDeliveryDate: apiOrder.estimated_delivery_date,
    actualDeliveryDate: apiOrder.actual_delivery_date,

    // Delivery information - handle both new and legacy formats
    deliverySlot: apiOrder.delivery_slot ||
      (deliveryInfo.delivery_slot_from && deliveryInfo.delivery_slot_to
        ? `${deliveryInfo.delivery_slot_from} - ${deliveryInfo.delivery_slot_to}`
        : 'TBD'),
    deliveryDate: deliveryInfo.delivery_date || apiOrder.estimated_delivery_date,
    deliveryAddress: apiOrder.delivery_address || deliveryInfo.delivery_address,

    // Payment information - handle both formats
    paymentMode: apiOrder.payment_mode || paymentInfo.payment_mode_name,
    paymentStatus: apiOrder.payment_status || paymentInfo.payment_status,

    // Order summary - handle new API format
    orderSummary: {
      subtotal: apiOrder.order_summary?.subtotal || 0,
      deliveryCharges: apiOrder.order_summary?.delivery_charges || 0,
      taxAmount: apiOrder.order_summary?.tax_amount || 0,
      discountAmount: apiOrder.order_summary?.discount_amount || 0,
      totalAmount: apiOrder.order_summary?.total_amount || 0,
      totalItems: apiOrder.order_summary?.total_items || apiOrder.items_count || 0,
      totalQuantity: apiOrder.order_summary?.total_quantity || 0
    },

    // Items - handle new API format with product_code, product_name, etc.
    itemsCount: apiOrder.items_count || apiOrder.order_summary?.total_items || 0,
    orderItems: apiOrder.order_items || [],
    orderNotes: apiOrder.order_notes || '',

    // Keep original data for reference
    _raw: apiOrder
  };
};

/**
 * Transform UI order data to API format
 * @param {Object} uiOrder - Order from UI
 * @returns {Object} - Order in API format
 */
export const transformOrderToAPI = (uiOrder) => {
  return {
    store_code: uiOrder.storeCode,
    project_code: uiOrder.projectCode,
    cart_validated: uiOrder.cartValidated,
    delivery_slot_id: uiOrder.deliverySlotId,
    delivery_date: uiOrder.deliveryDate,
    address_id: uiOrder.addressId,
    payment_mode_id: uiOrder.paymentModeId,
    order_notes: uiOrder.orderNotes || '',
    payment_details: uiOrder.paymentDetails || {}
  };
};

// Export order status constants for convenience
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Export payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};
