import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { COLORS } from '../constants/theme';

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const OtpVerifyPage = () => {
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [logoError, setLogoError] = useState(false);

  const otpInputRef = useRef(null);
  const {
    validateOtp,
    getOtp,
    otpVerifyLoading,
    otpVerifyError,
    otpMobile,
    otpLength,
    otpExpiresIn,
    clearError,
    resetOtp,
    isAuthenticated
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const mobileNo = location.state?.mobileNo || otpMobile;
  const isRegistration = location.state?.isRegistration || false;

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Redirect if no mobile number
  useEffect(() => {
    if (!mobileNo && !otpMobile) {
      navigate('/otp-input', { replace: true });
    }
  }, [mobileNo, otpMobile, navigate]);

  // Auto-focus OTP input
  useEffect(() => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, []);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setOtp(value);

    // Clear error when user starts typing
    if (errors.otp) {
      setErrors(prev => ({
        ...prev,
        otp: ''
      }));
    }

    // Clear general error
    if (otpVerifyError) {
      clearError();
    }

    // Auto-submit when OTP is complete (4 digits as per new API)
    if (value.length === 4) {
      handleSubmit(null, value);
    }
  };

  const validateOtpForm = (otpValue = otp) => {
    const newErrors = {};

    if (!otpValue.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otpValue.length !== 4) {
      newErrors.otp = 'Please enter 4 digit OTP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, otpValue = otp) => {
    if (e) e.preventDefault();

    if (!validateOtpForm(otpValue)) return;

    const result = await validateOtp(mobileNo || otpMobile, otpValue);

    if (result.success) {
      // Success is handled by AuthContext - user will be redirected
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resendAttempts >= 3) return;

    const result = await getOtp(mobileNo || otpMobile);

    if (result.success) {
      setCountdown(60);
      setResendAttempts(prev => prev + 1);
      setOtp(''); // Clear current OTP
      if (otpInputRef.current) {
        otpInputRef.current.focus();
      }
    }
  };

  const handleBackToInput = () => {
    resetOtp();
    navigate('/otp-input');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleClose = () => {
    navigate('/login');
  };

  const formatMobileNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `+91 ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
    }
    return number;
  };

  const displayMobile = mobileNo || otpMobile;
  const expectedOtpLength = 4; // Fixed to 4 digits as per new API

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Illustration (hidden on mobile) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: `linear-gradient(to bottom right, ${COLORS.primary[50]}, ${COLORS.success[50]}, ${COLORS.primary[100]})`
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${hexToRgba(COLORS.primary[500], 0.1)} 0%, transparent 50%)`
          }}
        ></div>
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 70% 80%, ${hexToRgba(COLORS.success[400], 0.1)} 0%, transparent 50%)`
          }}
        ></div>
        
        <div className="flex items-center justify-center w-full p-12 relative z-10">
          <div className="max-w-md text-center">
            {/* Shield Icon Illustration */}
            <div className="mb-8">
              <div 
                className="mx-auto w-48 h-48 rounded-full shadow-lg flex items-center justify-center"
                style={{ backgroundColor: COLORS.white }}
              >
                <ShieldCheckIcon style={{ color: COLORS.primary[600] }} className="w-24 h-24" />
              </div>
            </div>

            {/* Message */}
            <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.gray[800] }}>
              {isRegistration ? 'Almost There!' : 'Verify Your Identity'}
            </h3>
            <p className="text-lg" style={{ color: COLORS.gray[600] }}>
              {isRegistration 
                ? 'Just one more step to complete your Pagariya registration'
                : 'Enter the verification code we sent to your mobile number'}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div 
        className="flex-1 lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative"
        style={{ backgroundColor: COLORS.white }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full transition-colors duration-200 z-10"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.gray[100];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Close"
        >
          <XMarkIcon 
            className="w-6 h-6 sm:w-8 sm:h-8 transition-colors" 
            style={{ color: COLORS.gray[500] }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.gray[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.gray[500];
            }}
          />
        </button>

        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo (visible only on mobile) */}
          <div className="lg:hidden flex justify-center mb-6">
            {logoError ? (
              <div 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl shadow-sm"
                style={{
                  background: `linear-gradient(to bottom right, ${COLORS.primary[50]}, ${COLORS.success[50]})`
                }}
              >
                <span className="text-2xl font-bold" style={{ color: COLORS.primary[600] }}>Pagariya</span>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold leading-none" style={{ color: COLORS.gray[800] }}>Mart</span>
                </div>
              </div>
            ) : (
              <img
                src={`${process.env.PUBLIC_URL}/images/Main_Logo.jpg?v=2`}
                alt="Pagariya Mart"
                className="h-12 w-auto object-contain"
                style={{
                  maxHeight: '60px',
                  maxWidth: '200px',
                  display: 'block'
                }}
                onError={() => setLogoError(true)}
              />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center lg:text-left" style={{ color: COLORS.gray[900] }}>
            {isRegistration ? 'Verify Your Account' : 'Enter Verification Code'}
          </h1>
          <p className="text-sm mb-6 text-center lg:text-left" style={{ color: COLORS.gray[600] }}>
            We sent a {expectedOtpLength}-digit code to{' '}
            <span className="font-semibold" style={{ color: COLORS.gray[900] }}>
              {formatMobileNumber(displayMobile)}
            </span>
          </p>

          {/* Error Message */}
          {otpVerifyError && (
            <div 
              className="mb-4 border rounded-lg p-3"
              style={{
                backgroundColor: COLORS.error[50],
                borderColor: COLORS.error[200]
              }}
            >
              <p className="text-sm" style={{ color: COLORS.error[800] }}>{otpVerifyError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-3 text-center lg:text-left" style={{ color: COLORS.gray[500] }}>
                Enter {expectedOtpLength}-digit verification code
              </label>
              <input
                ref={otpInputRef}
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleOtpChange}
                onKeyDown={handleKeyDown}
                maxLength={expectedOtpLength}
                placeholder="••••"
                className="block w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] border-2 rounded-lg focus:outline-none transition-colors duration-200"
                style={{
                  borderColor: errors.otp ? COLORS.error[300] : COLORS.gray[200],
                  color: COLORS.gray[800]
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = errors.otp ? COLORS.error[500] : COLORS.primary[500];
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(errors.otp ? COLORS.error[500] : COLORS.primary[500], 0.5)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.otp ? COLORS.error[300] : COLORS.gray[200];
                  e.currentTarget.style.boxShadow = 'none';
                }}
                autoFocus
              />
              {errors.otp && (
                <p className="mt-2 text-sm text-center" style={{ color: COLORS.error[600] }}>{errors.otp}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={otpVerifyLoading || otp.length !== expectedOtpLength}
              className="w-full text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 uppercase tracking-wide disabled:cursor-not-allowed"
              style={{
                backgroundColor: (otpVerifyLoading || otp.length !== expectedOtpLength) ? COLORS.gray[300] : COLORS.primary[600],
                opacity: (otpVerifyLoading || otp.length !== expectedOtpLength) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!otpVerifyLoading && otp.length === expectedOtpLength) {
                  e.currentTarget.style.backgroundColor = COLORS.primary[700];
                }
              }}
              onMouseLeave={(e) => {
                if (!otpVerifyLoading && otp.length === expectedOtpLength) {
                  e.currentTarget.style.backgroundColor = COLORS.primary[600];
                }
              }}
            >
              {otpVerifyLoading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 text-center">
            <p className="text-sm mb-2" style={{ color: COLORS.gray[600] }}>
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOtp}
              disabled={countdown > 0 || resendAttempts >= 3}
              className="font-medium text-sm transition-colors disabled:cursor-not-allowed"
              style={{
                color: (countdown > 0 || resendAttempts >= 3) ? COLORS.gray[400] : COLORS.primary[600]
              }}
              onMouseEnter={(e) => {
                if (!(countdown > 0 || resendAttempts >= 3)) {
                  e.currentTarget.style.color = COLORS.primary[700];
                }
              }}
              onMouseLeave={(e) => {
                if (!(countdown > 0 || resendAttempts >= 3)) {
                  e.currentTarget.style.color = COLORS.primary[600];
                }
              }}
            >
              {resendAttempts >= 3
                ? 'Maximum attempts reached'
                : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : 'Resend Code'
              }
            </button>
            {resendAttempts > 0 && resendAttempts < 3 && (
              <p className="text-xs mt-1" style={{ color: COLORS.gray[500] }}>
                Attempts: {resendAttempts}/3
              </p>
            )}
          </div>

          {/* Change Number */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToInput}
              className="text-sm font-medium transition-colors"
              style={{ color: COLORS.gray[600] }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary[600];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.gray[600];
              }}
            >
              ← Change mobile number
            </button>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center text-xs" style={{ color: COLORS.gray[500] }}>
            By continuing, you agree to our{' '}
            <Link 
              to="/terms" 
              className="font-medium transition-colors"
              style={{ color: COLORS.primary[600] }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary[700];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.primary[600];
              }}
            >
              Terms
            </Link>
            {' '}and{' '}
            <Link 
              to="/privacy" 
              className="font-medium transition-colors"
              style={{ color: COLORS.primary[600] }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary[700];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.primary[600];
              }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerifyPage;
