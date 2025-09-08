import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout, requestOtp, verifyOtp } from '../api/authApi';

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
  CLEAR_ERROR: 'CLEAR_ERROR'
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
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Authentication actions
  const login = async (credentials) => {
    dispatch({ type: authActions.LOGIN_START });

    try {
      const response = await apiLogin(credentials);
      const { token } = response;

      // Get user data
      const user = await getCurrentUser(token);

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: authActions.LOGIN_FAILURE,
        payload: error.message || 'Login failed',
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: authActions.REGISTER_START });

    try {
      const response = await apiRegister(userData);
      const { token } = response;

      // Get user data
      const user = await getCurrentUser(token);

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: authActions.REGISTER_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: authActions.REGISTER_FAILURE,
        payload: error.message || 'Registration failed',
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      dispatch({ type: authActions.LOGOUT });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: authActions.LOGOUT });
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    dispatch({ type: authActions.CLEAR_ERROR });
  };

  // OTP: request and verify
  const requestPhoneOtp = async (phone) => {
    dispatch({ type: authActions.LOGIN_START });
    try {
      const res = await requestOtp(phone);
      return res; // { success, otpToken, demoOtp }
    } catch (error) {
      dispatch({ type: authActions.LOGIN_FAILURE, payload: error.message || 'Failed to request OTP' });
      return { success: false, error: error.message };
    }
  };

  const verifyPhoneOtp = async ({ phone, code, otpToken }) => {
    dispatch({ type: authActions.LOGIN_START });
    try {
      const res = await verifyOtp({ phone, code, otpToken });
      if (!res.success) {
        dispatch({ type: authActions.LOGIN_FAILURE, payload: res.error || 'Invalid OTP' });
        return res;
      }

      const { token, user } = res;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: authActions.LOGIN_SUCCESS, payload: { user, token } });
      return { success: true };
    } catch (error) {
      dispatch({ type: authActions.LOGIN_FAILURE, payload: error.message || 'OTP verification failed' });
      return { success: false, error: error.message };
    }
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    clearError,
    requestPhoneOtp,
    verifyPhoneOtp,
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
