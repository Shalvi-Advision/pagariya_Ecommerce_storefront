import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout } from '../api/authApi';
import { setStoredToken, clearStoredToken } from '../services/api';

// Auth Context
const AuthContext = createContext();

// Auth Actions
const authActions = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SUCCESS_MESSAGE: 'SET_SUCCESS_MESSAGE',
  CLEAR_SUCCESS_MESSAGE: 'CLEAR_SUCCESS_MESSAGE'
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.LOGIN_START:
    case authActions.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case authActions.LOGIN_SUCCESS:
    case authActions.REGISTER_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };

    case authActions.LOGIN_FAILURE:
    case authActions.REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null,
      };

    case authActions.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };

    case authActions.LOAD_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };

    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case authActions.SET_SUCCESS_MESSAGE:
      return {
        ...state,
        successMessage: action.payload,
      };

    case authActions.CLEAR_SUCCESS_MESSAGE:
      return {
        ...state,
        successMessage: null,
      };

    default:
      return state;
  }
};

// Initial auth state
const initialAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  successMessage: null,
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        dispatch({
          type: authActions.LOAD_USER,
          payload: { user: userData, token },
        });
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Authentication actions
  const login = async (credentials) => {
    dispatch({ type: authActions.LOGIN_START });

    try {
      const response = await apiLogin(credentials);
      const { data } = response;
      const { user, token } = data;

      // Store token using our PWA-compatible storage
      await setStoredToken(token);

      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user, token },
      });

      // Set success message
      setSuccessMessage('Logged in successfully!');

      return { success: true };
    } catch (error) {
      const errorMessage = error.message || error.error || 'Login failed';
      dispatch({
        type: authActions.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: authActions.REGISTER_START });

    try {
      const response = await apiRegister(userData);
      const { data } = response;
      const { user, token } = data;

      // Store token using our PWA-compatible storage
      await setStoredToken(token);

      dispatch({
        type: authActions.REGISTER_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.message || error.error || 'Registration failed';
      dispatch({
        type: authActions.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();

      // Clear stored token using our PWA-compatible storage
      clearStoredToken();

      dispatch({ type: authActions.LOGOUT });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear stored token
      clearStoredToken();
      dispatch({ type: authActions.LOGOUT });
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    dispatch({ type: authActions.CLEAR_ERROR });
  };

  const setSuccessMessage = (message) => {
    dispatch({ type: authActions.SET_SUCCESS_MESSAGE, payload: message });
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      dispatch({ type: authActions.CLEAR_SUCCESS_MESSAGE });
    }, 3000);
  };

  const clearSuccessMessage = () => {
    dispatch({ type: authActions.CLEAR_SUCCESS_MESSAGE });
  };


  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    successMessage: state.successMessage,
    login,
    register,
    logout,
    clearError,
    setSuccessMessage,
    clearSuccessMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
