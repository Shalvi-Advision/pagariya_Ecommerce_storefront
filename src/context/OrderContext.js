import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Order Context
const OrderContext = createContext();

// Order Actions
const orderActions = {
  ADD_ORDER: 'ADD_ORDER',
  LOAD_ORDERS: 'LOAD_ORDERS',
  CLEAR_ORDERS: 'CLEAR_ORDERS'
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
      return action.payload;

    case orderActions.CLEAR_ORDERS:
      return {
        ...state,
        orders: [],
      };

    default:
      return state;
  }
};

// Initial order state
const initialOrderState = {
  orders: [],
};

// Order Provider Component
export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialOrderState);
  const [currentUserId, setCurrentUserId] = React.useState(null);

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
    }
  }, []);

  // Load orders from localStorage on mount and when user changes
  useEffect(() => {
    if (currentUserId) {
      const savedOrders = localStorage.getItem(`orders_${currentUserId}`);
      if (savedOrders) {
        try {
          const orderData = JSON.parse(savedOrders);
          dispatch({ type: orderActions.LOAD_ORDERS, payload: orderData });
        } catch (error) {
          console.error('Error loading orders from localStorage:', error);
        }
      } else {
        // If no saved orders for this user, start with empty orders
        dispatch({ type: orderActions.LOAD_ORDERS, payload: { orders: [] } });
      }
    } else {
      // If no user, start with empty orders
      dispatch({ type: orderActions.LOAD_ORDERS, payload: { orders: [] } });
    }
  }, [currentUserId]);

  // Save orders to localStorage whenever they change and we have a user
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`orders_${currentUserId}`, JSON.stringify(state));
    }
  }, [state, currentUserId]);

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
    return state.orders.filter(order => order.userId === userId);
  };

  const value = {
    orders: state.orders,
    addOrder,
    clearOrders,
    clearUserOrders,
    getOrdersByUser,
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
