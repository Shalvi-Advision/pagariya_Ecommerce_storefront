import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline';

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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1)_0%,transparent_50%)]"></div>
        
        <div className="flex items-center justify-center w-full p-12 relative z-10">
          <div className="max-w-md text-center">
            {/* Phone Icon Illustration */}
            <div className="mb-8">
              <div className="mx-auto w-48 h-48 bg-white rounded-full shadow-lg flex items-center justify-center">
                <PhoneIcon className="w-24 h-24 text-emerald-600" />
              </div>
            </div>

            {/* Message */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {isRegistration ? 'Welcome to D-Mart!' : 'Secure Verification'}
            </h3>
            <p className="text-lg text-gray-600">
              {isRegistration 
                ? 'Complete your registration with OTP verification'
                : 'We\'ll send you a one-time password to verify your identity'}
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
            {isRegistration ? 'Create Your Account' : 'Request OTP'}
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center lg:text-left">
            {isRegistration 
              ? 'Enter your mobile number to complete registration'
              : 'We\'ll send a verification code to your mobile number'}
          </p>

          {/* Error Message */}
          {otpError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{otpError}</p>
            </div>
          )}

          {/* Success Message */}
          {otpSent && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-emerald-800 text-sm">
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
              <label htmlFor="mobileNo" className="block text-sm font-medium text-gray-500 mb-3">
                Enter your 10 digit mobile number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-gray-700 text-base font-medium">+91</span>
                </div>
                <input
                  id="mobileNo"
                  name="mobileNo"
                  type="tel"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder=""
                  className={`block w-full pl-16 pr-4 py-3.5 text-base border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                    errors.mobileNo 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-emerald-500'
                  }`}
                  required
                />
              </div>
              {errors.mobileNo && (
                <p className="mt-2 text-sm text-red-600">{errors.mobileNo}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={otpLoading || countdown > 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpLoading ? 'SENDING...' : countdown > 0 ? `RESEND IN ${countdown}S` : 'SEND OTP'}
            </button>

            {/* Resend Button */}
            {otpSent && countdown === 0 && (
              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full text-emerald-600 hover:text-emerald-700 font-medium py-2 transition-colors"
              >
                Didn't receive? Resend OTP
              </button>
            )}
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-sm text-gray-600 hover:text-emerald-600 font-medium transition-colors"
            >
              ← Back to Login
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

export default OtpInputPage;
