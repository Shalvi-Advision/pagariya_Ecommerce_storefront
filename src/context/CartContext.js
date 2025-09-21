import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart Context
const CartContext = createContext();

// Cart Actions
const cartActions = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case cartActions.ADD_ITEM: {
      const existingItem = state.items.find(item => item.id === action.payload.id);

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
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
        items: state.items.filter(item => item.id !== action.payload),
      };

    case cartActions.UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };

    case cartActions.CLEAR_CART:
      return {
        ...state,
        items: [],
      };

    case cartActions.LOAD_CART:
      return action.payload;

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
  items: dummyItems, // Add dummy items for testing
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
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

  // Load cart from localStorage on mount and when user changes
  useEffect(() => {
    if (currentUserId) {
      const savedCart = localStorage.getItem(`cart_${currentUserId}`);
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart);
          dispatch({ type: cartActions.LOAD_CART, payload: cartData });
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
        }
      } else {
        // If no saved cart for this user, start with empty cart
        dispatch({ type: cartActions.LOAD_CART, payload: { items: [] } });
      }
    } else {
      // If no user, start with empty cart
      dispatch({ type: cartActions.LOAD_CART, payload: { items: [] } });
    }
  }, [currentUserId]);

  // Save cart to localStorage whenever it changes and we have a user
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`cart_${currentUserId}`, JSON.stringify(state));
    }
  }, [state, currentUserId]);

  // Cart actions
  const addItem = (product, quantity = 1) => {
    dispatch({
      type: cartActions.ADD_ITEM,
      payload: {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity,
      },
    });
  };

  const removeItem = (itemId) => {
    dispatch({ type: cartActions.REMOVE_ITEM, payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({
      type: cartActions.UPDATE_QUANTITY,
      payload: { id: itemId, quantity },
    });
  };

  const clearCart = () => {
    dispatch({ type: cartActions.CLEAR_CART });
  };

  const clearUserCart = () => {
    if (currentUserId) {
      localStorage.removeItem(`cart_${currentUserId}`);
    }
    dispatch({ type: cartActions.CLEAR_CART });
  };

  const resetToDummyData = () => {
    dispatch({ type: cartActions.LOAD_CART, payload: { items: dummyItems } });
  };

  // Computed values
  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);

  const value = {
    items: state.items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearUserCart,
    resetToDummyData,
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
