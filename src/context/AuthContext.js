import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout } from '../api/authApi';
import { setStoredToken, clearStoredToken, otpAuth } from '../services/api';
import { throttle } from '../utils/asyncUtils';

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
  CLEAR_SUCCESS_MESSAGE: 'CLEAR_SUCCESS_MESSAGE',
  // OTP Actions
  OTP_REQUEST_START: 'OTP_REQUEST_START',
  OTP_REQUEST_SUCCESS: 'OTP_REQUEST_SUCCESS',
  OTP_REQUEST_FAILURE: 'OTP_REQUEST_FAILURE',
  OTP_VERIFY_START: 'OTP_VERIFY_START',
  OTP_VERIFY_SUCCESS: 'OTP_VERIFY_SUCCESS',
  OTP_VERIFY_FAILURE: 'OTP_VERIFY_FAILURE',
  OTP_RESET: 'OTP_RESET',
  TOKEN_VERIFY_START: 'TOKEN_VERIFY_START',
  TOKEN_VERIFY_SUCCESS: 'TOKEN_VERIFY_SUCCESS',
  TOKEN_VERIFY_FAILURE: 'TOKEN_VERIFY_FAILURE',
  TOKEN_REFRESH_START: 'TOKEN_REFRESH_START',
  TOKEN_REFRESH_SUCCESS: 'TOKEN_REFRESH_SUCCESS',
  TOKEN_REFRESH_FAILURE: 'TOKEN_REFRESH_FAILURE'
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

    // OTP Actions
    case authActions.OTP_REQUEST_START:
      return {
        ...state,
        otpLoading: true,
        otpError: null,
        otpSent: false,
      };

    case authActions.OTP_REQUEST_SUCCESS:
      return {
        ...state,
        otpLoading: false,
        otpSent: true,
        otpMobile: action.payload.mobileNo,
        otpLength: action.payload.otpLength,
        otpExpiresIn: action.payload.expiresIn,
      };

    case authActions.OTP_REQUEST_FAILURE:
      return {
        ...state,
        otpLoading: false,
        otpError: action.payload,
        otpSent: false,
      };

    case authActions.OTP_VERIFY_START:
      return {
        ...state,
        otpVerifyLoading: true,
        otpVerifyError: null,
      };

    case authActions.OTP_VERIFY_SUCCESS:
      return {
        ...state,
        otpVerifyLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        otpSent: false, // Reset OTP state after successful verification
        otpMobile: null,
        otpLength: null,
        otpExpiresIn: null,
      };

    case authActions.OTP_VERIFY_FAILURE:
      return {
        ...state,
        otpVerifyLoading: false,
        otpVerifyError: action.payload,
      };

    case authActions.OTP_RESET:
      return {
        ...state,
        otpSent: false,
        otpMobile: null,
        otpLength: null,
        otpExpiresIn: null,
        otpLoading: false,
        otpError: null,
        otpVerifyLoading: false,
        otpVerifyError: null,
      };

    case authActions.TOKEN_VERIFY_START:
      return {
        ...state,
        tokenVerifyLoading: true,
      };

    case authActions.TOKEN_VERIFY_SUCCESS:
      return {
        ...state,
        tokenVerifyLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };

    case authActions.TOKEN_VERIFY_FAILURE:
      return {
        ...state,
        tokenVerifyLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      };

    case authActions.TOKEN_REFRESH_START:
      return {
        ...state,
        tokenRefreshLoading: true,
      };

    case authActions.TOKEN_REFRESH_SUCCESS:
      return {
        ...state,
        tokenRefreshLoading: false,
        token: action.payload.token,
      };

    case authActions.TOKEN_REFRESH_FAILURE:
      return {
        ...state,
        tokenRefreshLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
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
  // OTP related state
  otpSent: false,
  otpMobile: null,
  otpLength: 4, // Default to 4 digits
  otpExpiresIn: 5, // Default to 5 minutes
  otpLoading: false,
  otpError: null,
  otpVerifyLoading: false,
  otpVerifyError: null,
  tokenVerifyLoading: false,
  tokenRefreshLoading: false,
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Throttled token verification function to prevent hammering the API
  const throttledVerifyToken = useRef(
    throttle(async (token) => {
      try {
        return await otpAuth.verifyToken(token);
      } catch (error) {
        console.error('Throttled token verification failed:', error);
        throw error;
      }
    }, 30000) // Only verify once every 30 seconds at most
  ).current;

  // Throttled token refresh function
  const throttledRefreshToken = useRef(
    throttle(async (token) => {
      try {
        return await otpAuth.refreshToken(token);
      } catch (error) {
        console.error('Throttled token refresh failed:', error);
        throw error;
      }
    }, 60000) // Only refresh once per minute at most
  ).current;

  // Store last verification time to avoid excessive checks
  const lastVerificationTime = useRef(0);

  // Load user from localStorage and verify token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('user');
      const tokenTimestamp = parseInt(localStorage.getItem('token_timestamp') || '0', 10);
      const now = Date.now();

      // Skip verification if token was verified recently (within last 5 minutes)
      const skipVerification = now - lastVerificationTime.current < 5 * 60 * 1000;

      if (token && user) {
        try {
          const userData = JSON.parse(user);

          // Auto-load user without verification if token is fresh (less than 10 minutes old)
          if (now - tokenTimestamp < 10 * 60 * 1000) {
            dispatch({
              type: authActions.LOAD_USER,
              payload: {
                user: userData,
                token,
              },
            });
            return;
          }

          // Only verify if needed
          if (!skipVerification) {
            // Update verification timestamp
            lastVerificationTime.current = now;
            
            // Verify token validity
            dispatch({ type: authActions.TOKEN_VERIFY_START });
            try {
              const verifyResult = await throttledVerifyToken(token);
              if (verifyResult.success && verifyResult.data.valid) {
                // Update token timestamp
                localStorage.setItem('token_timestamp', now.toString());
                
                dispatch({
                  type: authActions.TOKEN_VERIFY_SUCCESS,
                  payload: {
                    user: userData,
                    token,
                  },
                });
              } else {
                // Token is invalid, try to refresh it
                try {
                  const refreshResult = await throttledRefreshToken(token);
                  if (refreshResult.success) {
                    await setStoredToken(refreshResult.data.token);
                    localStorage.setItem('token_timestamp', now.toString());
                    
                    dispatch({
                      type: authActions.TOKEN_VERIFY_SUCCESS,
                      payload: {
                        user: userData,
                        token: refreshResult.data.token,
                      },
                    });
                  } else {
                    throw new Error('Token refresh failed');
                  }
                } catch (refreshError) {
                  console.error('Token refresh failed:', refreshError);
                  dispatch({ type: authActions.TOKEN_VERIFY_FAILURE });
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('token_timestamp');
                }
              }
            } catch (verifyError) {
              console.error('Token verification failed:', verifyError);
              dispatch({ type: authActions.TOKEN_VERIFY_FAILURE });
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user');
              localStorage.removeItem('token_timestamp');
            }
          } else {
            // Skip verification, just load user from localStorage
            dispatch({
              type: authActions.LOAD_USER,
              payload: {
                user: userData,
                token,
              },
            });
          }
        } catch (error) {
          console.error('Error loading user from localStorage:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('token_timestamp');
          dispatch({ type: authActions.TOKEN_VERIFY_FAILURE });
        }
      }
    };

    initializeAuth();
  }, [throttledVerifyToken, throttledRefreshToken]);

  // Set up activity tracking for authenticated users
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      // Set session ID if not exists
      if (!localStorage.getItem('session_id')) {
        const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('session_id', sessionId);
      }

      // Update activity immediately
      updateActivity();

      // Set up activity tracking interval
      const activityInterval = setInterval(() => {
        updateActivity({
          deviceId: navigator.userAgent,
          appVersion: '1.0.0'
        });
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => clearInterval(activityInterval);
    }
  }, [state.isAuthenticated, state.user]);

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
      // Call the new logout API endpoint
      await otpAuth.logout();

      // Clear stored token using our PWA-compatible storage
      clearStoredToken();

      // Clear user-specific data from localStorage
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const userId = userData.id;
          // Clear user-specific cart and orders
          localStorage.removeItem(`cart_${userId}`);
          localStorage.removeItem(`orders_${userId}`);
          localStorage.removeItem('session_id');
        } catch (error) {
          console.error('Error clearing user data:', error);
        }
      }

      dispatch({ type: authActions.LOGOUT });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear stored token
      clearStoredToken();

      // Clear user-specific data from localStorage even if API fails
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const userId = userData.id;
          localStorage.removeItem(`cart_${userId}`);
          localStorage.removeItem(`orders_${userId}`);
          localStorage.removeItem('session_id');
        } catch (error) {
          console.error('Error clearing user data:', error);
        }
      }

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

  const updateUser = async (userData) => {
    try {
      // In a real app, you would make an API call here
      // For now, we'll just update the local state
      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user: { ...state.user, ...userData }, token: state.token },
      });
      return { success: true };
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  };

  // OTP Authentication Methods
  const getOtp = async (mobileNo) => {
    dispatch({ type: authActions.OTP_REQUEST_START });

    try {
      const result = await otpAuth.getOtp(mobileNo);

      if (result.success) {
        dispatch({
          type: authActions.OTP_REQUEST_SUCCESS,
          payload: {
            mobileNo: mobileNo, // Use the mobile number passed in
            otpLength: 4, // Fixed to 4 digits as per new API
            expiresIn: result.expiresIn || 5, // Default to 5 minutes
          },
        });
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      const errorMessage = error.message || error.error || 'Failed to send OTP';
      dispatch({
        type: authActions.OTP_REQUEST_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const validateOtp = async (mobileNo, otp) => {
    dispatch({ type: authActions.OTP_VERIFY_START });

    try {
      const result = await otpAuth.validateOtp(mobileNo, otp);

      if (result.success) {
        // Extract user data from the new API response structure
        const user = {
          id: result.data.user.id,
          mobile: result.data.user.mobile,
          name: result.data.user.name,
          email: result.data.user.email,
          role: result.data.user.role,
          isVerified: result.data.user.isVerified,
          addresses: result.data.user.addresses || [],
          favorites: result.data.user.favorites || []
        };

        // Store token and user data
        await setStoredToken(result.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token_timestamp', Date.now().toString());

        dispatch({
          type: authActions.OTP_VERIFY_SUCCESS,
          payload: {
            user,
            token: result.data.token,
          },
        });

        setSuccessMessage('Login successful!');
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'OTP validation failed');
      }
    } catch (error) {
      const errorMessage = error.message || error.error || 'OTP validation failed';
      dispatch({
        type: authActions.OTP_VERIFY_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const verifyToken = async (token) => {
    try {
      const result = await otpAuth.verifyToken(token);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const refreshToken = async (token) => {
    dispatch({ type: authActions.TOKEN_REFRESH_START });

    try {
      const result = await otpAuth.refreshToken(token);

      if (result.success) {
        await setStoredToken(result.data.token);
        dispatch({
          type: authActions.TOKEN_REFRESH_SUCCESS,
          payload: {
            token: result.data.token,
          },
        });
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Token refresh failed');
      }
    } catch (error) {
      const errorMessage = error.message || error.error || 'Token refresh failed';
      dispatch({
        type: authActions.TOKEN_REFRESH_FAILURE,
      });
      return { success: false, error: errorMessage };
    }
  };

  const resetOtp = () => {
    dispatch({ type: authActions.OTP_RESET });
  };

  const updateProfile = async (profileData) => {
    try {
      const result = await otpAuth.updateProfile(profileData);
      if (result.success) {
        // Update user state with new profile data
        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: { user: { ...state.user, ...result.data.user }, token: state.token },
        });
        setSuccessMessage('Profile updated successfully!');
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      const errorMessage = error.message || error.error || 'Failed to update profile';
      dispatch({
        type: authActions.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const updateActivity = async (deviceInfo = {}) => {
    try {
      // Only update activity if user is authenticated
      if (!state.isAuthenticated) return { success: false, error: 'Not authenticated' };

      const result = await otpAuth.isActive({
        sessionId: localStorage.getItem('session_id'),
        device: {
          platform: 'web',
          deviceId: navigator.userAgent,
          appVersion: '1.0.0',
          ...deviceInfo
        }
      });

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Failed to update activity');
      }
    } catch (error) {
      console.error('Activity update error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    // Legacy authentication
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    successMessage: state.successMessage,
    login,
    register,
    logout,
    updateUser,
    clearError,
    setSuccessMessage,
    clearSuccessMessage,
    // OTP authentication
    otpSent: state.otpSent,
    otpMobile: state.otpMobile,
    otpLength: state.otpLength,
    otpExpiresIn: state.otpExpiresIn,
    otpLoading: state.otpLoading,
    otpError: state.otpError,
    otpVerifyLoading: state.otpVerifyLoading,
    otpVerifyError: state.otpVerifyError,
    tokenVerifyLoading: state.tokenVerifyLoading,
    tokenRefreshLoading: state.tokenRefreshLoading,
    getOtp,
    validateOtp,
    verifyToken,
    refreshToken,
    resetOtp,
    updateProfile,
    updateActivity,
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
