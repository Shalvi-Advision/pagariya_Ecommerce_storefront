import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const OtpVerifyPage = () => {
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);

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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1)_0%,transparent_50%)]"></div>
        
        <div className="flex items-center justify-center w-full p-12 relative z-10">
          <div className="max-w-md text-center">
            {/* Shield Icon Illustration */}
            <div className="mb-8">
              <div className="mx-auto w-48 h-48 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-24 h-24 text-emerald-600" />
              </div>
            </div>

            {/* Message */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {isRegistration ? 'Almost There!' : 'Verify Your Identity'}
            </h3>
            <p className="text-lg text-gray-600">
              {isRegistration 
                ? 'Just one more step to complete your D-Mart registration'
                : 'Enter the verification code we sent to your mobile number'}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 lg:w-1/2 bg-white flex items-center justify-center p-4 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 z-10"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 hover:text-gray-700" />
        </button>

        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo (visible only on mobile) */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-3 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-600">D</span>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold text-gray-800 leading-none">Mart</span>
                  <span className="text-xs font-medium text-rose-500 leading-none">Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center lg:text-left">
            {isRegistration ? 'Verify Your Account' : 'Enter Verification Code'}
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center lg:text-left">
            We sent a {expectedOtpLength}-digit code to{' '}
            <span className="font-semibold text-gray-900">
              {formatMobileNumber(displayMobile)}
            </span>
          </p>

          {/* Error Message */}
          {otpVerifyError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{otpVerifyError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-500 mb-3 text-center lg:text-left">
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
                className={`block w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                  errors.otp 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-emerald-500'
                }`}
                autoFocus
              />
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600 text-center">{errors.otp}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={otpVerifyLoading || otp.length !== expectedOtpLength}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpVerifyLoading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOtp}
              disabled={countdown > 0 || resendAttempts >= 3}
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendAttempts >= 3
                ? 'Maximum attempts reached'
                : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : 'Resend Code'
              }
            </button>
            {resendAttempts > 0 && resendAttempts < 3 && (
              <p className="text-xs text-gray-500 mt-1">
                Attempts: {resendAttempts}/3
              </p>
            )}
          </div>

          {/* Change Number */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToInput}
              className="text-sm text-gray-600 hover:text-emerald-600 font-medium transition-colors"
            >
              ← Change mobile number
            </button>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
              Terms
            </Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerifyPage;
