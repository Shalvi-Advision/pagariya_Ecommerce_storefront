import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline';
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

const OtpInputPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const initialMobileNo = location.state?.mobileNo || '';

  const [formData, setFormData] = useState({
    mobileNo: initialMobileNo,
  });
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [otpData, setOtpData] = useState(null);
  const [logoError, setLogoError] = useState(false);

  const {
    getOtp,
    otpLoading,
    otpError,
    otpSent,
    otpMobile,
    otpExpiresIn,
    clearError,
    resetOtp
  } = useAuth();
  const isRegistration = location.state?.isRegistration || false;

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Update form data when initial values change
  useEffect(() => {
    setFormData({
      mobileNo: initialMobileNo,
    });
  }, [initialMobileNo]);

  // Redirect if OTP is already sent
  useEffect(() => {
    if (otpSent && otpMobile) {
      navigate('/otp-verify', {
        state: {
          mobileNo: otpMobile,
          from,
          isRegistration
        }
      });
    }
  }, [otpSent, otpMobile, navigate, from, isRegistration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only allow numeric input for mobile number
    if (name === 'mobileNo' && value && !/^\d*$/.test(value)) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general error
    if (otpError) {
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNo.replace(/\s+/g, ''))) {
      newErrors.mobileNo = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await getOtp(formData.mobileNo);

    if (result.success) {
      // Store OTP data for development mode display
      setOtpData(result.data);
      // Start countdown for resend using expiresIn from API or default to 60 seconds
      setCountdown(result.data?.expiresIn * 60 || 60); // Convert minutes to seconds
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    const result = await getOtp(formData.mobileNo);

    if (result.success) {
      setCountdown(60);
    }
  };

  const handleBackToLogin = () => {
    resetOtp();
    navigate('/login');
  };

  const handleClose = () => {
    navigate('/login');
  };

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
            {/* Phone Icon Illustration */}
            <div className="mb-8">
              <div 
                className="mx-auto w-48 h-48 rounded-full shadow-lg flex items-center justify-center"
                style={{ backgroundColor: COLORS.white }}
              >
                <PhoneIcon style={{ color: COLORS.primary[600] }} className="w-24 h-24" />
              </div>
            </div>

            {/* Message */}
            <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.gray[800] }}>
              {isRegistration ? 'Welcome to Pagariya!' : 'Secure Verification'}
            </h3>
            <p className="text-lg" style={{ color: COLORS.gray[600] }}>
              {isRegistration 
                ? 'Complete your registration with OTP verification'
                : 'We\'ll send you a one-time password to verify your identity'}
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
            {isRegistration ? 'Create Your Account' : 'Request OTP'}
          </h1>
          <p className="text-sm mb-6 text-center lg:text-left" style={{ color: COLORS.gray[600] }}>
            {isRegistration 
              ? 'Enter your mobile number to complete registration'
              : 'We\'ll send a verification code to your mobile number'}
          </p>

          {/* Error Message */}
          {otpError && (
            <div 
              className="mb-4 border rounded-lg p-3"
              style={{
                backgroundColor: COLORS.error[50],
                borderColor: COLORS.error[200]
              }}
            >
              <p className="text-sm" style={{ color: COLORS.error[800] }}>{otpError}</p>
            </div>
          )}

          {/* Success Message */}
          {otpSent && (
            <div 
              className="mb-4 border rounded-lg p-3"
              style={{
                backgroundColor: COLORS.success[50],
                borderColor: COLORS.success[200]
              }}
            >
              <p className="text-sm" style={{ color: COLORS.success[800] }}>
                ✓ OTP sent successfully to +91 {otpMobile}
                {process.env.NODE_ENV === 'development' && otpData?.otp && (
                  <span className="block mt-1 font-mono text-xs">
                    OTP: {otpData.otp}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mobile Number Input */}
            <div>
              <label htmlFor="mobileNo" className="block text-sm font-medium mb-3" style={{ color: COLORS.gray[500] }}>
                Enter your 10 digit mobile number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-base font-medium" style={{ color: COLORS.gray[700] }}>+91</span>
                </div>
                <input
                  id="mobileNo"
                  name="mobileNo"
                  type="tel"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder=""
                  className="block w-full pl-16 pr-4 py-3.5 text-base border-2 rounded-lg focus:outline-none transition-colors duration-200"
                  style={{
                    borderColor: errors.mobileNo ? COLORS.error[300] : COLORS.gray[200],
                    color: COLORS.gray[800]
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = errors.mobileNo ? COLORS.error[500] : COLORS.primary[500];
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(errors.mobileNo ? COLORS.error[500] : COLORS.primary[500], 0.5)}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.mobileNo ? COLORS.error[300] : COLORS.gray[200];
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              {errors.mobileNo && (
                <p className="mt-2 text-sm" style={{ color: COLORS.error[600] }}>{errors.mobileNo}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={otpLoading || countdown > 0}
              className="w-full text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 uppercase tracking-wide disabled:cursor-not-allowed"
              style={{
                backgroundColor: (otpLoading || countdown > 0) ? COLORS.gray[300] : COLORS.primary[600],
                opacity: (otpLoading || countdown > 0) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!otpLoading && countdown === 0) {
                  e.currentTarget.style.backgroundColor = COLORS.primary[700];
                }
              }}
              onMouseLeave={(e) => {
                if (!otpLoading && countdown === 0) {
                  e.currentTarget.style.backgroundColor = COLORS.primary[600];
                }
              }}
            >
              {otpLoading ? 'SENDING...' : countdown > 0 ? `RESEND IN ${countdown}S` : 'SEND OTP'}
            </button>

            {/* Resend Button */}
            {otpSent && countdown === 0 && (
              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full font-medium py-2 transition-colors"
                style={{ color: COLORS.primary[600] }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.primary[600];
                }}
              >
                Didn't receive? Resend OTP
              </button>
            )}
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-sm font-medium transition-colors"
              style={{ color: COLORS.gray[600] }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary[600];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.gray[600];
              }}
            >
              ← Back to Login
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

export default OtpInputPage;
