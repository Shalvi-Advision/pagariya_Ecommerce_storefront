import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useMemo } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout } from '../api/authApi';
import { setStoredToken, clearStoredToken, otpAuth } from '../services/api';
import { throttle } from '../utils/asyncUtils';
import {
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  setUserData,
  getUserData,
  clearAuthSession,
  refreshAllExpiries,
  STORAGE_KEYS
} from '../utils/persistentStorage';

/**
 * SPLIT CONTEXT ARCHITECTURE:
 * This optimized version splits the monolithic AuthContext into smaller focused contexts
 * to minimize re-renders and improve performance.
 *
 * - AuthUserContext: User data only (stable reference)
 * - AuthTokenContext: Token management
 * - AuthOTPContext: OTP flow state
 * - AuthUIContext: Loading, error, and success message states
 */

// ============= Auth User Context =============
const AuthUserContext = createContext();

const authUserReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_USER':
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
    case 'OTP_VERIFY_SUCCESS':
    case 'TOKEN_VERIFY_SUCCESS':
      return { ...action.payload.user };
    case 'LOGOUT':
    case 'TOKEN_VERIFY_FAILURE':
    case 'TOKEN_REFRESH_FAILURE':
      return null;
    case 'UPDATE_USER':
      return state ? { ...state, ...action.payload } : null;
    default:
      return state;
  }
};

// ============= Auth Token Context =============
const AuthTokenContext = createContext();

const authTokenReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_USER':
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
    case 'OTP_VERIFY_SUCCESS':
    case 'TOKEN_VERIFY_SUCCESS':
      return { ...state, token: action.payload.token, isAuthenticated: true };
    case 'LOGOUT':
    case 'TOKEN_VERIFY_FAILURE':
    case 'TOKEN_REFRESH_FAILURE':
      return { token: null, isAuthenticated: false };
    case 'TOKEN_REFRESH_SUCCESS':
      return { ...state, token: action.payload.token };
    default:
      return state;
  }
};

// ============= Auth OTP Context =============
const AuthOTPContext = createContext();

const authOTPReducer = (state, action) => {
  switch (action.type) {
    case 'OTP_REQUEST_START':
      return { ...state, loading: true, error: null, sent: false };
    case 'OTP_REQUEST_SUCCESS':
      return {
        ...state,
        loading: false,
        sent: true,
        mobileNo: action.payload.mobileNo,
        length: action.payload.otpLength,
        expiresIn: action.payload.expiresIn,
        error: null
      };
    case 'OTP_REQUEST_FAILURE':
      return { ...state, loading: false, error: action.payload, sent: false };
    case 'OTP_VERIFY_START':
      return { ...state, verifyLoading: true, verifyError: null };
    case 'OTP_VERIFY_FAILURE':
      return { ...state, verifyLoading: false, verifyError: action.payload };
    case 'OTP_RESET':
      return {
        sent: false,
        mobileNo: null,
        length: 4,
        expiresIn: 5,
        loading: false,
        error: null,
        verifyLoading: false,
        verifyError: null
      };
    default:
      return state;
  }
};

// ============= Auth UI Context =============
const AuthUIContext = createContext();

const authUIReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
    case 'TOKEN_VERIFY_START':
    case 'TOKEN_REFRESH_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
    case 'TOKEN_VERIFY_FAILURE':
    case 'TOKEN_REFRESH_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
    case 'OTP_VERIFY_SUCCESS':
    case 'TOKEN_VERIFY_SUCCESS':
    case 'TOKEN_REFRESH_SUCCESS':
    case 'LOAD_USER':
      return { ...state, loading: false, error: null };
    case 'LOGOUT':
      return { loading: false, error: null, successMessage: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_SUCCESS_MESSAGE':
      return { ...state, successMessage: action.payload };
    case 'CLEAR_SUCCESS_MESSAGE':
      return { ...state, successMessage: null };
    default:
      return state;
  }
};

// ============= Initial States =============
const initialUserState = null;
const initialTokenState = { token: null, isAuthenticated: false };
const initialOTPState = {
  sent: false,
  mobileNo: null,
  length: 4,
  expiresIn: 5,
  loading: false,
  error: null,
  verifyLoading: false,
  verifyError: null
};
const initialUIState = {
  loading: false,
  error: null,
  successMessage: null
};

// ============= Auth Provider =============
export const AuthProvider = ({ children }) => {
  const [user, dispatchUser] = useReducer(authUserReducer, initialUserState);
  const [tokenState, dispatchToken] = useReducer(authTokenReducer, initialTokenState);
  const [otpState, dispatchOTP] = useReducer(authOTPReducer, initialOTPState);
  const [uiState, dispatchUI] = useReducer(authUIReducer, initialUIState);

  const lastVerificationTime = useRef(0);

  // Memoized dispatch functions
  const dispatch = useCallback((action) => {
    dispatchUser(action);
    dispatchToken(action);
    dispatchOTP(action);
    dispatchUI(action);
  }, []);

  // Throttled token verification
  const throttledVerifyToken = useRef(
    throttle(async (token) => {
      try {
        return await otpAuth.verifyToken(token);
      } catch (error) {
        throw error;
      }
    }, 30000)
  ).current;

  // Throttled token refresh
  const throttledRefreshToken = useRef(
    throttle(async (token) => {
      try {
        return await otpAuth.refreshToken(token);
      } catch (error) {
        throw error;
      }
    }, 60000)
  ).current;

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      const userData = getUserData();
      const tokenTimestamp = parseInt(localStorage.getItem('token_timestamp') || '0', 10);
      const now = Date.now();
      const skipVerification = now - lastVerificationTime.current < 5 * 60 * 1000;

      if (token && userData) {
        try {
          if (now - tokenTimestamp < 10 * 60 * 1000) {
            dispatch({
              type: 'LOAD_USER',
              payload: { user: userData, token }
            });
            refreshAllExpiries();
            return;
          }

          if (!skipVerification) {
            lastVerificationTime.current = now;
            dispatch({ type: 'TOKEN_VERIFY_START' });

            try {
              const verifyResult = await throttledVerifyToken(token);
              if (verifyResult.success && verifyResult.data.valid) {
                localStorage.setItem('token_timestamp', now.toString());
                await refreshAllExpiries();
                dispatch({
                  type: 'TOKEN_VERIFY_SUCCESS',
                  payload: { user: userData, token }
                });
              } else {
                try {
                  const refreshResult = await throttledRefreshToken(token);
                  if (refreshResult.success) {
                    await setAuthToken(refreshResult.data.token);
                    localStorage.setItem('token_timestamp', now.toString());
                    dispatch({
                      type: 'TOKEN_VERIFY_SUCCESS',
                      payload: { user: userData, token: refreshResult.data.token }
                    });
                  }
                } catch (refreshError) {
                  dispatch({ type: 'TOKEN_VERIFY_FAILURE' });
                  await clearAuthSession();
                }
              }
            } catch (verifyError) {
              dispatch({ type: 'TOKEN_VERIFY_FAILURE' });
              await clearAuthSession();
            }
          } else {
            dispatch({
              type: 'LOAD_USER',
              payload: { user: userData, token }
            });
            refreshAllExpiries();
          }
        } catch (error) {
          await clearAuthSession();
          dispatch({ type: 'TOKEN_VERIFY_FAILURE' });
        }
      }
    };

    initializeAuth();
  }, [throttledVerifyToken, throttledRefreshToken, dispatch]);

  // Activity tracking interval
  useEffect(() => {
    if (tokenState.isAuthenticated && user) {
      if (!localStorage.getItem('session_id')) {
        const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('session_id', sessionId);
      }

      const updateActivity = async () => {
        try {
          await otpAuth.isActive({
            sessionId: localStorage.getItem('session_id'),
            device: {
              platform: 'web',
              deviceId: navigator.userAgent,
              appVersion: '1.0.0'
            }
          });
        } catch (error) {
          // Silently fail
        }
      };

      updateActivity();
      const activityInterval = setInterval(updateActivity, 5 * 60 * 1000);
      return () => clearInterval(activityInterval);
    }
  }, [tokenState.isAuthenticated, user]);

  // ============= Action Methods =============
  const login = useCallback(async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await apiLogin(credentials);
      const { user, token } = response.data;
      await setStoredToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      dispatchUI({ type: 'SET_SUCCESS_MESSAGE', payload: 'Logged in successfully!' });
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || error.error || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  const register = useCallback(async (userData) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const response = await apiRegister(userData);
      const { user, token } = response.data;
      await setStoredToken(token);
      dispatch({ type: 'REGISTER_SUCCESS', payload: { user, token } });
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || error.error || 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await otpAuth.logout();
      await clearAuthSession();
      dispatch({ type: 'LOGOUT' });
      return { success: true };
    } catch (error) {
      await clearAuthSession();
      dispatch({ type: 'LOGOUT' });
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const getOtp = useCallback(async (mobileNo) => {
    dispatch({ type: 'OTP_REQUEST_START' });
    try {
      const result = await otpAuth.getOtp(mobileNo);
      if (result.success) {
        dispatch({
          type: 'OTP_REQUEST_SUCCESS',
          payload: {
            mobileNo,
            otpLength: 4,
            expiresIn: result.expiresIn || 5
          }
        });
        return { success: true, data: result };
      }
    } catch (error) {
      const errorMessage = error.message || error.error || 'Failed to send OTP';
      dispatch({ type: 'OTP_REQUEST_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  const validateOtp = useCallback(async (mobileNo, otp) => {
    dispatch({ type: 'OTP_VERIFY_START' });
    try {
      const result = await otpAuth.validateOtp(mobileNo, otp);
      if (result.success) {
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

        await setAuthToken(result.data.token);
        await setUserData(user);
        localStorage.setItem('token_timestamp', Date.now().toString());

        dispatch({
          type: 'OTP_VERIFY_SUCCESS',
          payload: { user, token: result.data.token }
        });
        dispatchUI({ type: 'SET_SUCCESS_MESSAGE', payload: 'Login successful!' });
        return { success: true, data: result.data };
      }
    } catch (error) {
      const errorMessage = error.message || error.error || 'OTP validation failed';
      dispatch({ type: 'OTP_VERIFY_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  const refreshToken = useCallback(async (token) => {
    dispatch({ type: 'TOKEN_REFRESH_START' });
    try {
      const result = await otpAuth.refreshToken(token);
      if (result.success) {
        await setStoredToken(result.data.token);
        dispatch({ type: 'TOKEN_REFRESH_SUCCESS', payload: { token: result.data.token } });
        return { success: true, data: result.data };
      }
    } catch (error) {
      const errorMessage = error.message || error.error || 'Token refresh failed';
      dispatch({ type: 'TOKEN_REFRESH_FAILURE' });
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  const resetOtp = useCallback(() => {
    dispatch({ type: 'OTP_RESET' });
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  const setSuccessMessage = useCallback((message) => {
    dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: message });
    setTimeout(() => {
      dispatch({ type: 'CLEAR_SUCCESS_MESSAGE' });
    }, 3000);
  }, [dispatch]);

  const clearSuccessMessage = useCallback(() => {
    dispatch({ type: 'CLEAR_SUCCESS_MESSAGE' });
  }, [dispatch]);

  // ============= Memoized Context Values =============
  const userValue = useMemo(() => ({
    user,
    updateUser: (userData) => dispatch({ type: 'UPDATE_USER', payload: userData })
  }), [user, dispatch]);

  const tokenValue = useMemo(() => ({
    ...tokenState,
    login,
    register,
    logout,
    refreshToken
  }), [tokenState, login, register, logout, refreshToken]);

  const otpValue = useMemo(() => ({
    ...otpState,
    getOtp,
    validateOtp,
    resetOtp
  }), [otpState, getOtp, validateOtp, resetOtp]);

  const uiValue = useMemo(() => ({
    ...uiState,
    clearError,
    setSuccessMessage,
    clearSuccessMessage
  }), [uiState, clearError, setSuccessMessage, clearSuccessMessage]);

  return (
    <AuthUserContext.Provider value={userValue}>
      <AuthTokenContext.Provider value={tokenValue}>
        <AuthOTPContext.Provider value={otpValue}>
          <AuthUIContext.Provider value={uiValue}>
            {children}
          </AuthUIContext.Provider>
        </AuthOTPContext.Provider>
      </AuthTokenContext.Provider>
    </AuthUserContext.Provider>
  );
};

// ============= Custom Hooks =============
export const useAuthUser = () => {
  const context = useContext(AuthUserContext);
  if (!context) {
    throw new Error('useAuthUser must be used within an AuthProvider');
  }
  return context;
};

export const useAuthToken = () => {
  const context = useContext(AuthTokenContext);
  if (!context) {
    throw new Error('useAuthToken must be used within an AuthProvider');
  }
  return context;
};

export const useAuthOTP = () => {
  const context = useContext(AuthOTPContext);
  if (!context) {
    throw new Error('useAuthOTP must be used within an AuthProvider');
  }
  return context;
};

export const useAuthUI = () => {
  const context = useContext(AuthUIContext);
  if (!context) {
    throw new Error('useAuthUI must be used within an AuthProvider');
  }
  return context;
};

// ============= Backward Compatibility Hook =============
export const useAuth = () => {
  const user = useAuthUser();
  const token = useAuthToken();
  const otp = useAuthOTP();
  const ui = useAuthUI();

  return useMemo(() => ({
    // User data
    user: user.user,
    // Token data
    token: token.token,
    isAuthenticated: token.isAuthenticated,
    // UI state
    loading: ui.loading,
    error: ui.error,
    successMessage: ui.successMessage,
    // OTP state
    otpSent: otp.sent,
    otpMobile: otp.mobileNo,
    otpLength: otp.length,
    otpExpiresIn: otp.expiresIn,
    otpLoading: otp.loading,
    otpError: otp.error,
    otpVerifyLoading: otp.verifyLoading,
    otpVerifyError: otp.verifyError,
    tokenVerifyLoading: ui.loading,
    tokenRefreshLoading: ui.loading,
    // Methods
    login: token.login,
    register: token.register,
    logout: token.logout,
    getOtp: otp.getOtp,
    validateOtp: otp.validateOtp,
    refreshToken: token.refreshToken,
    resetOtp: otp.resetOtp,
    updateUser: user.updateUser,
    clearError: ui.clearError,
    setSuccessMessage: ui.setSuccessMessage,
    clearSuccessMessage: ui.clearSuccessMessage
  }), [user, token, otp, ui]);
};
