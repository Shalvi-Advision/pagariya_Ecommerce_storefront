// Cart API Service
// Handles all cart-related API operations with data transformation

import { apiPost, apiGet } from './api';
import { APP_CONSTANTS } from '../constants';

// Cart Service Class
class CartService {
  constructor() {
    this.baseUrl = APP_CONSTANTS.API_BASE_URL;
    this.projectCode = APP_CONSTANTS.PROJECT_CODE;
  }

  // Get user mobile number from localStorage
  getUserMobile() {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.mobile || null;
      }
    } catch (error) {
      console.error('Error getting user mobile:', error);
    }
    return null;
  }

  // Get store code from localStorage
  getStoreCode() {
    try {
      const locationData = localStorage.getItem('confirmedLocation');
      if (locationData) {
        const location = JSON.parse(locationData);
        // Try both storeCode and store_code (for backwards compatibility)
        return location?.store?.storeCode || location?.store?.store_code;
      }
    } catch (error) {
      console.error('Error getting store code:', error);
    }
    // Return null to indicate no store code is available
    // This will cause the API call to fail gracefully with a proper error message
    return null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getUserMobile();
  }

  // Transform frontend cart item to API format
  transformToApiFormat(cartItem) {
    // Parse package_size if it's a string like "250 GM"
    let packageSize = cartItem.package_size;
    let packageUnit = cartItem.package_unit || 'GM';

    if (cartItem.packageSize && typeof cartItem.packageSize === 'string') {
      const parts = cartItem.packageSize.trim().split(/\s+/);
      packageSize = parseFloat(parts[0]) || 1;
      packageUnit = parts[1] || packageUnit;
    }

    return {
      p_code: cartItem.p_code || cartItem.id,
      product_name: cartItem.title || cartItem.product_name,
      quantity: cartItem.quantity || 1,
      unit_price: cartItem.price || cartItem.unit_price || 0,
      package_size: packageSize || 1,
      package_unit: packageUnit,
      brand_name: cartItem.brand || cartItem.brand_name || 'Unknown',
      pcode_img: cartItem.image || cartItem.pcode_img || '/images/default_image.jpg'
    };
  }

  // Transform API cart item to frontend format
  transformFromApiFormat(apiItem) {
    return {
      id: apiItem.p_code,
      p_code: apiItem.p_code,
      title: apiItem.product_name,
      product_name: apiItem.product_name,
      price: apiItem.unit_price,
      unit_price: apiItem.unit_price,
      quantity: apiItem.quantity,
      image: apiItem.pcode_img,
      pcode_img: apiItem.pcode_img,
      brand: apiItem.brand_name,
      brand_name: apiItem.brand_name,
      packageSize: `${apiItem.package_size} ${apiItem.package_unit}`,
      package_size: apiItem.package_size,
      package_unit: apiItem.package_unit,
      store_code: apiItem.store_code,
      total_price: apiItem.total_price
    };
  }

  // Transform entire cart to API format
  transformCartToApiFormat(cartItems) {
    return cartItems.map(item => this.transformToApiFormat(item));
  }

  // Transform API response to frontend format
  transformCartFromApiFormat(apiItems) {
    return apiItems.map(item => this.transformFromApiFormat(item));
  }

  // Calculate cart totals
  calculateCartTotals(items) {
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || item.unit_price || 0)), 0);
    const itemsCount = items.length;

    return {
      totalQuantity,
      subtotal,
      itemsCount
    };
  }

  // Save entire cart to backend
  async saveCart(cartItems) {
    try {
      console.log('🛒 CartService: Saving cart to backend', { itemsCount: cartItems.length });

      if (!this.isAuthenticated()) {
        console.log('🛒 CartService: User not authenticated, skipping API call');
        return { success: true, message: 'Guest user - cart saved locally only' };
      }

      const storeCode = this.getStoreCode();

      // Validate that store code exists in localStorage
      if (!storeCode) {
        const error = new Error('Store code not found. Please select a location first.');
        error.code = 'STORE_CODE_MISSING';
        console.error('❌ Store code validation failed:', error);
        throw error;
      }

      const apiItems = this.transformCartToApiFormat(cartItems);
      const totals = this.calculateCartTotals(cartItems);

      const requestBody = {
        store_code: storeCode,
        project_code: this.projectCode,
        items: apiItems
      };

      console.log('🛒 CartService: API request body', requestBody);

      const response = await apiPost('/cart/save-cart', requestBody);

      console.log('✅ CartService: Save cart response', response);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Cart saved successfully',
          data: {
            ...response.data,
            items: this.transformCartFromApiFormat(response.data.items || [])
          }
        };
      } else {
        throw new Error(response.message || 'Failed to save cart');
      }
    } catch (error) {
      console.error('❌ CartService: Save cart error', error);
      throw new Error(error.message || 'Failed to save cart');
    }
  }

  // Validate cart items
  async validateCart(autoFix = false) {
    try {
      console.log('🛒 CartService: Validating cart', { autoFix });

      if (!this.isAuthenticated()) {
        console.log('🛒 CartService: User not authenticated, skipping validation');
        return { success: true, message: 'Guest user - validation skipped' };
      }

      const storeCode = this.getStoreCode();

      // Validate that store code exists in localStorage
      if (!storeCode) {
        const error = new Error('Store code not found. Please select a location first.');
        error.code = 'STORE_CODE_MISSING';
        console.error('❌ Store code validation failed:', error);
        throw error;
      }

      const requestBody = {
        store_code: storeCode,
        project_code: this.projectCode,
        autoFix
      };

      console.log('🛒 CartService: Validation request body', requestBody);

      const response = await apiPost('/cart/validate-cart', requestBody);

      console.log('✅ CartService: Validation response', response);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Cart validation successful',
          validation: response.validation || response // Handle both structures if needed
        };
      } else {
        throw new Error(response.message || 'Cart validation failed');
      }
    } catch (error) {
      console.error('❌ CartService: Validation error', error);
      throw new Error(error.message || 'Failed to validate cart');
    }
  }

  // Get cart from backend
  async getCart() {
    try {
      console.log('🛒 CartService: Fetching cart from backend');

      if (!this.isAuthenticated()) {
        console.log('🛒 CartService: User not authenticated, returning empty cart');
        return { success: true, data: { items: [], subtotal: 0, total_items: 0, total_quantity: 0 } };
      }

      const storeCode = this.getStoreCode();

      // Validate that store code exists in localStorage
      if (!storeCode) {
        const error = new Error('Store code not found. Please select a location first.');
        error.code = 'STORE_CODE_MISSING';
        console.error('❌ Store code validation failed:', error);
        throw error;
      }

      const requestBody = {
        store_code: storeCode,
        project_code: this.projectCode
      };

      console.log('🛒 CartService: Get cart request body', requestBody);

      const response = await apiPost('/cart/get-cart', requestBody);

      console.log('✅ CartService: Get cart response', response);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Cart fetched successfully',
          data: {
            ...response.data,
            items: this.transformCartFromApiFormat(response.data.items || [])
          }
        };
      } else {
        throw new Error(response.message || 'Failed to fetch cart');
      }
    } catch (error) {
      console.error('❌ CartService: Get cart error', error);
      throw new Error(error.message || 'Failed to fetch cart');
    }
  }

  // Clear cart on backend
  async clearCart() {
    try {
      console.log('🛒 CartService: Clearing cart on backend');

      if (!this.isAuthenticated()) {
        console.log('🛒 CartService: User not authenticated, skipping API call');
        return { success: true, message: 'Guest user - cart cleared locally only' };
      }

      const storeCode = this.getStoreCode();

      // Validate that store code exists in localStorage
      if (!storeCode) {
        const error = new Error('Store code not found. Please select a location first.');
        error.code = 'STORE_CODE_MISSING';
        console.error('❌ Store code validation failed:', error);
        throw error;
      }

      const requestBody = {
        store_code: storeCode,
        project_code: this.projectCode
      };

      console.log('🛒 CartService: Clear cart request body', requestBody);

      const response = await apiPost('/cart/clear-cart', requestBody);

      console.log('✅ CartService: Clear cart response', response);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Cart cleared successfully',
          data: {
            ...response.data,
            items: this.transformCartFromApiFormat(response.data.items || [])
          }
        };
      } else {
        throw new Error(response.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('❌ CartService: Clear cart error', error);
      throw new Error(error.message || 'Failed to clear cart');
    }
  }

  // Add single item to cart
  async addItemToCart(item) {
    try {
      console.log('🛒 CartService: Adding item to cart', item);

      if (!this.isAuthenticated()) {
        console.log('🛒 CartService: User not authenticated, skipping API call');
        return { success: true, message: 'Guest user - item added locally only' };
      }

      const storeCode = this.getStoreCode();

      // Validate that store code exists in localStorage
      if (!storeCode) {
        const error = new Error('Store code not found. Please select a location first.');
        error.code = 'STORE_CODE_MISSING';
        console.error('❌ Store code validation failed:', error);
        throw error;
      }

      // Transform cart item to API format
      const apiItem = this.transformToApiFormat(item);

      // Create request body matching the new API structure
      const requestBody = {
        store_code: storeCode,
        project_code: this.projectCode,
        p_code: apiItem.p_code,
        product_name: apiItem.product_name,
        quantity: apiItem.quantity,
        unit_price: apiItem.unit_price,
        package_size: apiItem.package_size,
        package_unit: apiItem.package_unit,
        brand_name: apiItem.brand_name,
        pcode_img: apiItem.pcode_img
      };

      console.log('🛒 CartService: Add item request body', requestBody);

      const response = await apiPost('/cart/add-item', requestBody);

      console.log('✅ CartService: Add item response', response);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Item added to cart successfully',
          data: {
            ...response.data,
            added_item: response.data.added_item ? this.transformFromApiFormat(response.data.added_item) : null
          }
        };
      } else {
        throw new Error(response.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('❌ CartService: Add item error', error);
      throw new Error(error.message || 'Failed to add item to cart');
    }
  }

  // Get all carts (admin function)
  async getAllCarts() {
    try {
      console.log('🛒 CartService: Fetching all carts');

      const response = await apiGet('/cart');

      console.log('✅ CartService: Get all carts response', response);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Carts fetched successfully',
          data: response.data.map(cart => ({
            ...cart,
            items: this.transformCartFromApiFormat(cart.items || [])
          }))
        };
      } else {
        throw new Error(response.message || 'Failed to fetch carts');
      }
    } catch (error) {
      console.error('❌ CartService: Get all carts error', error);
      throw new Error(error.message || 'Failed to fetch carts');
    }
  }

  // Merge guest cart with backend cart
  async mergeGuestCart(guestCartItems) {
    try {
      console.log('🛒 CartService: Merging guest cart with backend cart', { guestItemsCount: guestCartItems.length });

      if (!this.isAuthenticated()) {
        console.log('🛒 CartService: User not authenticated, cannot merge');
        return { success: false, message: 'User not authenticated' };
      }

      // Get current backend cart
      const backendCartResponse = await this.getCart();
      const backendItems = backendCartResponse.data.items || [];

      // Merge items intelligently
      const mergedItems = [...backendItems];

      guestCartItems.forEach(guestItem => {
        const existingItem = mergedItems.find(item => item.p_code === guestItem.p_code || item.id === guestItem.p_code);

        if (existingItem) {
          // Update quantity
          existingItem.quantity = (existingItem.quantity || 0) + (guestItem.quantity || 0);
        } else {
          // Add new item
          mergedItems.push({
            ...guestItem,
            p_code: guestItem.p_code || guestItem.id
          });
        }
      });

      // Save merged cart
      const saveResponse = await this.saveCart(mergedItems);

      return {
        success: true,
        message: 'Guest cart merged successfully',
        data: {
          mergedItems,
          backendItemsCount: backendItems.length,
          guestItemsCount: guestCartItems.length,
          finalItemsCount: mergedItems.length
        }
      };
    } catch (error) {
      console.error('❌ CartService: Merge guest cart error', error);
      throw new Error(error.message || 'Failed to merge guest cart');
    }
  }
}

// Create singleton instance
const cartService = new CartService();

export default cartService;
