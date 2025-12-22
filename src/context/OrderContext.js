import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContextOptimized';
import { getMyOrders, getOrderDetails, transformOrderFromAPI } from '../api/ordersApi';

// Order Context
const OrderContext = createContext();

// Order Actions
const orderActions = {
  ADD_ORDER: 'ADD_ORDER',
  LOAD_ORDERS: 'LOAD_ORDERS',
  CLEAR_ORDERS: 'CLEAR_ORDERS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Order Reducer
const orderReducer = (state, action) => {
  switch (action.type) {
    case orderActions.ADD_ORDER:
      return {
        ...state,
        orders: [action.payload, ...state.orders],
      };

    case orderActions.LOAD_ORDERS:
      return {
        ...state,
        orders: action.payload,
        loading: false,
        error: null
      };

    case orderActions.CLEAR_ORDERS:
      return {
        ...state,
        orders: [],
      };

    case orderActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case orderActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    default:
      return state;
  }
};

// Initial order state
const initialOrderState = {
  orders: [],
  loading: false,
  error: null
};

// Order Provider Component
export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialOrderState);
  const [currentUserId, setCurrentUserId] = React.useState(null);

  // Get authenticated user from AuthContext
  const { user } = useAuth();

  // Sync currentUserId with authenticated user or localStorage fallback
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUserId(userData.id);
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          setCurrentUserId(null);
        }
      } else {
        setCurrentUserId(null);
      }
    }
  }, [user]);

  // Load orders from localStorage on mount and when user changes
  useEffect(() => {
    if (currentUserId) {
      const savedOrders = localStorage.getItem(`orders_${currentUserId}`);
      if (savedOrders) {
        try {
          const orderData = JSON.parse(savedOrders);
          // orderData can be { orders: [...] } or just [...]
          const ordersArray = orderData.orders || orderData || [];
          dispatch({ type: orderActions.LOAD_ORDERS, payload: ordersArray });
        } catch (error) {
          console.error('Error loading orders from localStorage:', error);
          dispatch({ type: orderActions.LOAD_ORDERS, payload: [] });
        }
      } else {
        // If no saved orders for this user, start with empty orders
        dispatch({ type: orderActions.LOAD_ORDERS, payload: [] });
      }
    } else {
      // If no user, start with empty orders
      dispatch({ type: orderActions.LOAD_ORDERS, payload: [] });
    }
  }, [currentUserId]);

  // Save orders to localStorage whenever they change and we have a user
  useEffect(() => {
    if (currentUserId && state.orders) {
      localStorage.setItem(`orders_${currentUserId}`, JSON.stringify({ orders: state.orders }));
    }
  }, [state.orders, currentUserId]);

  // Order actions
  const addOrder = (order) => {
    const orderWithId = {
      ...order,
      id: Date.now().toString(),
      orderDate: new Date().toISOString(),
      status: 'Processing',
      deliveryDate: generateDeliveryDate(),
    };
    dispatch({
      type: orderActions.ADD_ORDER,
      payload: orderWithId,
    });
    return orderWithId;
  };

  const clearOrders = () => {
    dispatch({ type: orderActions.CLEAR_ORDERS });
  };

  const clearUserOrders = () => {
    if (currentUserId) {
      localStorage.removeItem(`orders_${currentUserId}`);
    }
    dispatch({ type: orderActions.CLEAR_ORDERS });
  };

  const getOrdersByUser = (userId) => {
    // If orders are from API, they're already filtered by authenticated user
    // Only filter if we have orders with userId field (legacy orders)
    if (state.orders.length > 0 && state.orders[0].userId) {
      return state.orders.filter(order => order.userId === userId);
    }
    // Return all orders since API already filters by authenticated user
    return state.orders;
  };

  // Fetch orders from API
  const fetchOrders = useCallback(async (limit = 20) => {
    try {
      dispatch({ type: orderActions.SET_LOADING, payload: true });
      dispatch({ type: orderActions.SET_ERROR, payload: null });

      const response = await getMyOrders(limit);

      if (response.success && response.orders) {
        // Transform orders from API format to UI format
        const transformedOrders = response.orders.map(order => transformOrderFromAPI(order));
        dispatch({ type: orderActions.LOAD_ORDERS, payload: transformedOrders });

        // Also save to localStorage for offline access
        if (currentUserId) {
          localStorage.setItem(`orders_${currentUserId}`, JSON.stringify({ orders: transformedOrders }));
        }

        return { success: true, orders: transformedOrders };
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      dispatch({ type: orderActions.SET_ERROR, payload: error.message });

      // Try to load from localStorage as fallback
      if (currentUserId) {
        const savedOrders = localStorage.getItem(`orders_${currentUserId}`);
        if (savedOrders) {
          try {
            const orderData = JSON.parse(savedOrders);
            dispatch({ type: orderActions.LOAD_ORDERS, payload: orderData.orders || [] });
          } catch (e) {
            console.error('Error loading orders from localStorage:', e);
          }
        }
      }

      return { success: false, error: error.message };
    }
  }, [currentUserId]);

  // Fetch single order details
  const fetchOrderDetails = useCallback(async (orderNumber) => {
    try {
      dispatch({ type: orderActions.SET_LOADING, payload: true });
      dispatch({ type: orderActions.SET_ERROR, payload: null });

      const response = await getOrderDetails(orderNumber);

      if (response.success && response.order) {
        const transformedOrder = transformOrderFromAPI(response.order);

        // Update the order in the orders list if it exists
        const updatedOrders = state.orders.map(order =>
          order.orderNumber === orderNumber ? transformedOrder : order
        );

        // If order doesn't exist in list, add it
        if (!state.orders.find(order => order.orderNumber === orderNumber)) {
          updatedOrders.unshift(transformedOrder);
        }

        dispatch({ type: orderActions.LOAD_ORDERS, payload: updatedOrders });
        dispatch({ type: orderActions.SET_LOADING, payload: false });

        return { success: true, order: transformedOrder };
      } else {
        throw new Error(response.message || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      dispatch({ type: orderActions.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  }, [state.orders]);

  const value = {
    orders: state.orders || [],
    loading: state.loading || false,
    error: state.error || null,
    addOrder,
    clearOrders,
    clearUserOrders,
    getOrdersByUser,
    fetchOrders,
    fetchOrderDetails
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use order context
export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

// Helper function to generate delivery date (5-7 days from now)
const generateDeliveryDate = () => {
  const now = new Date();
  const daysToAdd = Math.floor(Math.random() * 3) + 5; // 5-7 days
  const deliveryDate = new Date(now);
  deliveryDate.setDate(now.getDate() + daysToAdd);
  return deliveryDate.toISOString();
};

export default OrderContext;
