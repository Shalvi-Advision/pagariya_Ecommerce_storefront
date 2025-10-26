import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Toast Context
const ToastContext = createContext();

// Toast Actions
const toastActions = {
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  CLEAR_ALL_TOASTS: 'CLEAR_ALL_TOASTS'
};

// Toast Reducer
const toastReducer = (state, action) => {
  switch (action.type) {
    case toastActions.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: Date.now() + Math.random() }]
      };

    case toastActions.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };

    case toastActions.CLEAR_ALL_TOASTS:
      return {
        ...state,
        toasts: []
      };

    default:
      return state;
  }
};

// Initial toast state
const initialToastState = {
  toasts: []
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, initialToastState);

  // Add toast
  const addToast = useCallback((toast) => {
    const toastData = {
      type: toast.type || 'info',
      title: toast.title || '',
      message: toast.message || '',
      duration: toast.duration || 5000,
      ...toast
    };

    dispatch({ type: toastActions.ADD_TOAST, payload: toastData });

    // Auto-remove toast after duration
    if (toastData.duration > 0) {
      setTimeout(() => {
        dispatch({ type: toastActions.REMOVE_TOAST, payload: toastData.id });
      }, toastData.duration);
    }
  }, []);

  // Remove toast
  const removeToast = useCallback((id) => {
    dispatch({ type: toastActions.REMOVE_TOAST, payload: id });
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    dispatch({ type: toastActions.CLEAR_ALL_TOASTS });
  }, []);

  // Convenience methods for different toast types
  const showSuccess = useCallback((message, title = 'Success') => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const showError = useCallback((message, title = 'Error') => {
    addToast({ type: 'error', title, message, duration: 7000 }); // Longer duration for errors
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Info') => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    addToast({ type: 'warning', title, message, duration: 6000 });
  }, [addToast]);

  const value = {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

// Custom hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
