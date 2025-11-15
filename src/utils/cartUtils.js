// Cart Utilities
// Helper functions for cart operations and data transformation

// Transform frontend cart item to API format
export const transformToApiFormat = (cartItem) => {
  return {
    p_code: cartItem.p_code || cartItem.id,
    product_name: cartItem.title || cartItem.product_name,
    quantity: cartItem.quantity || 1,
    unit_price: cartItem.price || cartItem.unit_price || 0,
    total_price: (cartItem.quantity || 1) * (cartItem.price || cartItem.unit_price || 0),
    package_size: cartItem.package_size || cartItem.packageSize?.split(' ')[0] || 1,
    package_unit: cartItem.package_unit || cartItem.packageSize?.split(' ')[1] || 'GM',
    brand_name: cartItem.brand || cartItem.brand_name || 'Unknown',
    pcode_img: cartItem.image || cartItem.pcode_img || '/images/logo.jpg',
    store_code: cartItem.store_code || 'AVB' // Default store code
  };
};

// Transform API cart item to frontend format
export const transformFromApiFormat = (apiItem) => {
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
};

// Transform entire cart to API format
export const transformCartToApiFormat = (cartItems) => {
  return cartItems.map(item => transformToApiFormat(item));
};

// Transform API response to frontend format
export const transformCartFromApiFormat = (apiItems) => {
  return apiItems.map(item => transformFromApiFormat(item));
};

// Calculate cart totals
export const calculateCartTotals = (items) => {
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || item.unit_price || 0)), 0);
  const itemsCount = items.length;

  return {
    totalQuantity,
    subtotal,
    itemsCount
  };
};

// Validate cart item structure
export const validateCartItem = (item) => {
  const requiredFields = ['id', 'title', 'price', 'quantity'];
  const missingFields = requiredFields.filter(field => !item[field]);
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      errors: [`Missing required fields: ${missingFields.join(', ')}`]
    };
  }

  if (typeof item.quantity !== 'number' || item.quantity < 1) {
    return {
      isValid: false,
      errors: ['Quantity must be a positive number']
    };
  }

  if (typeof item.price !== 'number' || item.price < 0) {
    return {
      isValid: false,
      errors: ['Price must be a non-negative number']
    };
  }

  return {
    isValid: true,
    errors: []
  };
};

// Merge two carts intelligently
export const mergeCartItems = (localCart, apiCart) => {
  const mergedItems = [...apiCart];
  
  localCart.forEach(localItem => {
    const existingItem = mergedItems.find(item => 
      item.p_code === localItem.p_code || 
      item.id === localItem.p_code ||
      item.id === localItem.id
    );
    
    if (existingItem) {
      // Update quantity (add local quantity to API quantity)
      existingItem.quantity = (existingItem.quantity || 0) + (localItem.quantity || 0);
    } else {
      // Add new item from local cart
      mergedItems.push({
        ...localItem,
        p_code: localItem.p_code || localItem.id
      });
    }
  });

  return mergedItems;
};

// Check if two cart items are the same product
export const isSameProduct = (item1, item2) => {
  return (
    item1.p_code === item2.p_code ||
    item1.id === item2.p_code ||
    item1.p_code === item2.id ||
    item1.id === item2.id
  );
};

// Find item in cart by product code
export const findCartItem = (cartItems, productCode) => {
  return cartItems.find(item => 
    item.p_code === productCode || 
    item.id === productCode
  );
};

// Update item quantity in cart
export const updateCartItemQuantity = (cartItems, productCode, newQuantity) => {
  return cartItems.map(item => {
    if (item.p_code === productCode || item.id === productCode) {
      return { ...item, quantity: Math.max(1, newQuantity) };
    }
    return item;
  });
};

// Remove item from cart
export const removeCartItem = (cartItems, productCode) => {
  return cartItems.filter(item => 
    item.p_code !== productCode && item.id !== productCode
  );
};

// Add or update item in cart
export const addOrUpdateCartItem = (cartItems, newItem) => {
  const existingItem = findCartItem(cartItems, newItem.p_code || newItem.id);
  
  if (existingItem) {
    return updateCartItemQuantity(
      cartItems, 
      newItem.p_code || newItem.id, 
      (existingItem.quantity || 0) + (newItem.quantity || 1)
    );
  } else {
    return [...cartItems, { ...newItem, p_code: newItem.p_code || newItem.id }];
  }
};

// Format cart summary for display
export const formatCartSummary = (items) => {
  const totals = calculateCartTotals(items);
  
  return {
    itemsCount: totals.itemsCount,
    totalQuantity: totals.totalQuantity,
    subtotal: totals.subtotal,
    formattedSubtotal: `₹${totals.subtotal.toFixed(2)}`,
    itemText: totals.itemsCount === 1 ? 'item' : 'items'
  };
};

// Check if cart is empty
export const isCartEmpty = (items) => {
  return !items || items.length === 0;
};

// Get cart item count
export const getCartItemCount = (items) => {
  return items ? items.length : 0;
};

// Get total quantity in cart
export const getCartTotalQuantity = (items) => {
  return items ? items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
};

// Get cart subtotal
export const getCartSubtotal = (items) => {
  return items ? items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || item.unit_price || 0)), 0) : 0;
};

// Debounce function for cart operations
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Check if user is authenticated
export const isUserAuthenticated = () => {
  try {
    const user = localStorage.getItem('user');
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Get user mobile number
export const getUserMobile = () => {
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
};

// Get store code from localStorage
export const getStoreCode = () => {
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

// Check if store is enabled
export const isStoreEnabled = () => {
  try {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      const location = JSON.parse(locationData);
      const store = location?.store;
      
      if (!store) {
        return false;
      }
      
      // Check isEnabled property (from formatted store data)
      if (store.isEnabled !== undefined) {
        return store.isEnabled === true;
      }
      
      // Check is_enabled property (from raw API data)
      if (store.is_enabled !== undefined) {
        return store.is_enabled === 'Enabled' || store.is_enabled === true;
      }
      
      // Default to false if status is unknown
      return false;
    }
  } catch (error) {
    console.error('Error checking store status:', error);
  }
  return false;
};

// Get store message (if store is disabled)
export const getStoreMessage = () => {
  try {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      const location = JSON.parse(locationData);
      return location?.store?.storeMessage || location?.store?.message || null;
    }
  } catch (error) {
    console.error('Error getting store message:', error);
  }
  return null;
};

// Create cart item from product data
export const createCartItemFromProduct = (product, quantity = 1) => {
  return {
    id: product.p_code || product._id || product.id,
    p_code: product.p_code || product._id || product.id,
    title: product.product_name || product.title || product.name,
    product_name: product.product_name || product.title || product.name,
    price: product.our_price || product.price || 0,
    unit_price: product.our_price || product.price || 0,
    quantity: quantity,
    image: product.pcode_img || product.image_url || product.image || '/images/logo.jpg',
    pcode_img: product.pcode_img || product.image_url || product.image || '/images/logo.jpg',
    brand: product.brand_name || product.brand || 'Unknown',
    brand_name: product.brand_name || product.brand || 'Unknown',
    packageSize: product.package_size ? `${product.package_size} ${product.package_unit || 'GM'}` : '1 GM',
    package_size: parseFloat(product.package_size) || 1,
    package_unit: product.package_unit || 'GM',
    mrp: product.product_mrp || product.mrp || 0,
    discountPercentage: product.discount_percentage || 0,
    store_code: getStoreCode()
  };
};

// Validate cart before checkout
export const validateCartForCheckout = (items) => {
  const errors = [];
  const warnings = [];

  if (isCartEmpty(items)) {
    errors.push('Cart is empty');
    return { isValid: false, errors, warnings };
  }

  items.forEach((item, index) => {
    const validation = validateCartItem(item);
    if (!validation.isValid) {
      errors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
    }

    if (item.quantity > 10) {
      warnings.push(`Item "${item.title}" has high quantity (${item.quantity})`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Export all utilities as default object for convenience
export default {
  transformToApiFormat,
  transformFromApiFormat,
  transformCartToApiFormat,
  transformCartFromApiFormat,
  calculateCartTotals,
  validateCartItem,
  mergeCartItems,
  isSameProduct,
  findCartItem,
  updateCartItemQuantity,
  removeCartItem,
  addOrUpdateCartItem,
  formatCartSummary,
  isCartEmpty,
  getCartItemCount,
  getCartTotalQuantity,
  getCartSubtotal,
  debounce,
  retryWithBackoff,
  isUserAuthenticated,
  getUserMobile,
  getStoreCode,
  isStoreEnabled,
  getStoreMessage,
  createCartItemFromProduct,
  validateCartForCheckout
};
