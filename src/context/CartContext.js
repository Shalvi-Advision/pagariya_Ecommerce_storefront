import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import cartService from '../services/cartService';
import { debounce, retryWithBackoff, isUserAuthenticated, getUserMobile, isStoreEnabled, getStoreMessage } from '../utils/cartUtils';

// Cart Context
const CartContext = createContext();

// Cart Actions
const cartActions = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  SET_LOADING: 'SET_LOADING',
  SET_SYNCING: 'SET_SYNCING',
  SET_SYNC_ERROR: 'SET_SYNC_ERROR',
  SET_LAST_SYNCED: 'SET_LAST_SYNCED',
  SET_VALIDATION_RESULT: 'SET_VALIDATION_RESULT'
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case cartActions.ADD_ITEM: {
      const existingItem = state.items.find(item => 
        item.id === action.payload.id || 
        item.p_code === action.payload.p_code ||
        item.p_code === action.payload.id
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            (item.id === action.payload.id || 
             item.p_code === action.payload.p_code ||
             item.p_code === action.payload.id)
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }

    case cartActions.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => 
          item.id !== action.payload && 
          item.p_code !== action.payload
        ),
      };

    case cartActions.UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item =>
          (item.id === action.payload.id || 
           item.p_code === action.payload.id)
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };

    case cartActions.CLEAR_CART:
      return {
        ...state,
        items: [],
        syncError: null,
        validationResult: null
      };

    case cartActions.LOAD_CART:
      return {
        ...state,
        ...action.payload,
        loading: false
      };

    case cartActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case cartActions.SET_SYNCING:
      return {
        ...state,
        syncing: action.payload
      };

    case cartActions.SET_SYNC_ERROR:
      return {
        ...state,
        syncError: action.payload,
        syncing: false
      };

    case cartActions.SET_LAST_SYNCED:
      return {
        ...state,
        lastSynced: action.payload,
        syncError: null,
        syncing: false
      };

    case cartActions.SET_VALIDATION_RESULT:
      return {
        ...state,
        validationResult: action.payload
      };

    default:
      return state;
  }
};

// Dummy cart items for testing
const dummyItems = [
  {
    id: '1',
    title: 'Farmley Date Bites Apple Pie',
    price: 658,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop&crop=center',
    quantity: 2,
  },
  {
    id: '2',
    title: 'Unibic Signature Cookies',
    price: 109,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop&crop=center',
    quantity: 1,
  },
  {
    id: '3',
    title: 'Kellogg\'s Millet Muesli With 84% Fruit Seed & Multigrain',
    price: 740,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop&crop=center',
    quantity: 2,
  },
  {
    id: '4',
    title: 'Organic Quinoa Seeds',
    price: 320,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop&crop=center',
    quantity: 1,
  },
  {
    id: '5',
    title: 'Fresh Organic Bananas',
    price: 45,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop&crop=center',
    quantity: 3,
  },
];

// Initial cart state
const initialCartState = {
  items: [],
  loading: false,
  syncing: false,
  syncError: null,
  lastSynced: null,
  validationResult: null
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const debouncedSyncRef = useRef(null);

  // Initialize debounced sync function
  useEffect(() => {
    debouncedSyncRef.current = debounce(async () => {
      await syncCart();
    }, 800);
  }, []);

  // Get current user from localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setCurrentUserId(userData.id);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      setCurrentUserId(null);
    }
  }, []);

  // Fetch cart from API on mount and when user changes
  useEffect(() => {
    if (currentUserId && isUserAuthenticated()) {
      fetchCart();
    } else {
      // Load guest cart from localStorage
      loadGuestCart();
    }
  }, [currentUserId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`cart_${currentUserId}`, JSON.stringify({
        items: state.items,
        lastSynced: state.lastSynced
      }));
    } else {
      // Save guest cart
      localStorage.setItem('guest_cart', JSON.stringify({
        items: state.items,
        lastSynced: state.lastSynced
      }));
    }
  }, [state.items, state.lastSynced, currentUserId]);

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    if (!isUserAuthenticated()) return;

    dispatch({ type: cartActions.SET_LOADING, payload: true });

    try {
      const response = await retryWithBackoff(() => cartService.getCart());
      
      if (response.success) {
        dispatch({
          type: cartActions.LOAD_CART,
          payload: {
            items: response.data.items || [],
            lastSynced: new Date().toISOString()
          }
        });
      } else {
        throw new Error(response.message || 'Failed to fetch cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      dispatch({ type: cartActions.SET_SYNC_ERROR, payload: error.message });
      
      // Fallback to localStorage
      loadGuestCart();
    }
  }, []);

  // Load guest cart from localStorage
  const loadGuestCart = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('guest_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({
          type: cartActions.LOAD_CART,
          payload: {
            items: cartData.items || [],
            lastSynced: cartData.lastSynced || null
          }
        });
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
    }
  }, []);

  // Sync cart to API
  const syncCart = useCallback(async () => {
    if (!isUserAuthenticated() || state.items.length === 0) return;

    dispatch({ type: cartActions.SET_SYNCING, payload: true });

    try {
      const response = await retryWithBackoff(() => cartService.saveCart(state.items));
      
      if (response.success) {
        dispatch({ type: cartActions.SET_LAST_SYNCED, payload: new Date().toISOString() });
      } else {
        throw new Error(response.message || 'Failed to sync cart');
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
      dispatch({ type: cartActions.SET_SYNC_ERROR, payload: error.message });
    }
  }, [state.items]);

  // Validate cart
  const validateCart = useCallback(async () => {
    if (!isUserAuthenticated()) {
      return { success: true, message: 'Guest user - validation skipped' };
    }

    try {
      const response = await cartService.validateCart();
      dispatch({ type: cartActions.SET_VALIDATION_RESULT, payload: response });
      return response;
    } catch (error) {
      console.error('Error validating cart:', error);
      const errorResponse = { success: false, message: error.message };
      dispatch({ type: cartActions.SET_VALIDATION_RESULT, payload: errorResponse });
      return errorResponse;
    }
  }, []);

  // Merge guest cart with backend cart (called on login)
  const mergeGuestCart = useCallback(async (guestItems) => {
    if (!isUserAuthenticated() || !guestItems.length) return;

    try {
      const response = await cartService.mergeGuestCart(guestItems);
      
      if (response.success) {
        dispatch({
          type: cartActions.LOAD_CART,
          payload: {
            items: response.data.mergedItems,
            lastSynced: new Date().toISOString()
          }
        });
        return response;
      } else {
        throw new Error(response.message || 'Failed to merge cart');
      }
    } catch (error) {
      console.error('Error merging guest cart:', error);
      throw error;
    }
  }, []);

  // Cart actions
  const addItem = useCallback(async (product, quantity = 1) => {
    // Check if store is enabled before allowing cart additions
    if (!isStoreEnabled()) {
      const storeMessage = getStoreMessage();
      const errorMessage = storeMessage || 'This store is currently not accepting online orders. Please try again later.';
      const error = new Error(errorMessage);
      error.code = 'STORE_DISABLED';
      throw error;
    }

    // Create cart item with proper structure
    const cartItem = {
      id: product.p_code || product.id,
      p_code: product.p_code || product.id,
      title: product.title || product.product_name,
      product_name: product.product_name || product.title,
      price: product.price || product.unit_price || product.our_price,
      unit_price: product.unit_price || product.price || product.our_price,
      our_price: product.our_price || product.price || product.unit_price,
      product_mrp: product.product_mrp || product.mrp,
      mrp: product.mrp || product.product_mrp,
      quantity: quantity,
      image: product.image || product.pcode_img || product.image_url,
      pcode_img: product.pcode_img || product.image || product.image_url,
      image_url: product.image_url || product.pcode_img || product.image,
      brand: product.brand || product.brand_name,
      brand_name: product.brand_name || product.brand,
      packageSize: product.packageSize || `${product.package_size || 1} ${product.package_unit || 'GM'}`,
      package_size: product.package_size || 1,
      package_unit: product.package_unit || 'GM',
      store_code: product.store_code || cartService.getStoreCode()
    };

    // Check if item already exists in cart
    const existingItem = state.items.find(item => 
      item.id === cartItem.id || 
      item.p_code === cartItem.p_code ||
      item.p_code === cartItem.id
    );
    
    if (existingItem) {
      // If item exists, update its quantity
      dispatch({
        type: cartActions.UPDATE_QUANTITY,
        payload: { id: cartItem.id, quantity: existingItem.quantity + quantity },
      });
    } else {
      // If item doesn't exist, add it
      dispatch({
        type: cartActions.ADD_ITEM,
        payload: cartItem,
      });
    }

    // Sync to API if authenticated
    if (isUserAuthenticated()) {
      try {
        await cartService.addItemToCart(cartItem);
        dispatch({ type: cartActions.SET_LAST_SYNCED, payload: new Date().toISOString() });
      } catch (error) {
        console.error('Error adding item to API:', error);
        dispatch({ type: cartActions.SET_SYNC_ERROR, payload: error.message });
      }
    }
  }, [state.items]);

  const removeItem = useCallback((itemId) => {
    dispatch({ type: cartActions.REMOVE_ITEM, payload: itemId });
    
    // Debounced sync to API
    if (isUserAuthenticated() && debouncedSyncRef.current) {
      debouncedSyncRef.current();
    }
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    // Check if store is enabled before allowing quantity updates
    if (!isStoreEnabled()) {
      const storeMessage = getStoreMessage();
      const errorMessage = storeMessage || 'This store is currently not accepting online orders. Please try again later.';
      const error = new Error(errorMessage);
      error.code = 'STORE_DISABLED';
      throw error;
    }

    dispatch({
      type: cartActions.UPDATE_QUANTITY,
      payload: { id: itemId, quantity },
    });
    
    // Debounced sync to API
    if (isUserAuthenticated() && debouncedSyncRef.current) {
      debouncedSyncRef.current();
    }
  }, []);

  const clearCart = useCallback(async () => {
    dispatch({ type: cartActions.CLEAR_CART });
    
    // Clear on API if authenticated
    if (isUserAuthenticated()) {
      try {
        await cartService.clearCart();
        dispatch({ type: cartActions.SET_LAST_SYNCED, payload: new Date().toISOString() });
      } catch (error) {
        console.error('Error clearing cart on API:', error);
        dispatch({ type: cartActions.SET_SYNC_ERROR, payload: error.message });
      }
    }
  }, []);

  const clearUserCart = useCallback(() => {
    if (currentUserId) {
      localStorage.removeItem(`cart_${currentUserId}`);
    }
    localStorage.removeItem('guest_cart');
    dispatch({ type: cartActions.CLEAR_CART });
  }, [currentUserId]);

  const resetToDummyData = useCallback(() => {
    dispatch({ type: cartActions.LOAD_CART, payload: { items: dummyItems } });
  }, []);

  // Computed values
  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = state.items.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return total + (price * quantity);
  }, 0);

  const value = {
    // State
    items: state.items,
    loading: state.loading,
    syncing: state.syncing,
    syncError: state.syncError,
    lastSynced: state.lastSynced,
    validationResult: state.validationResult,
    
    // Computed values
    totalItems,
    totalPrice,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearUserCart,
    resetToDummyData,
    fetchCart,
    syncCart,
    validateCart,
    mergeGuestCart,
    
    // Utility
    isAuthenticated: isUserAuthenticated(),
    userMobile: getUserMobile()
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
