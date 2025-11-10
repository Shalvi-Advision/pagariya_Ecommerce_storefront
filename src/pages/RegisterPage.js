import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    mobileNo: '',
  });
  const [errors, setErrors] = useState({});

  const { loading, error, clearError } = useAuth();
  const navigate = useNavigate();

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
    if (error) {
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

    // Navigate to OTP input page for registration
    navigate('/otp-input', {
      state: {
        mobileNo: formData.mobileNo,
        isRegistration: true, // Flag to indicate this is for registration
      }
    });
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1)_0%,transparent_50%)]"></div>
        
        <div className="flex items-center justify-center w-full p-12 relative z-10">
          <div className="max-w-md text-center">
            {/* User Plus Icon Illustration */}
            <div className="mb-8">
              <div className="mx-auto w-48 h-48 bg-white rounded-full shadow-lg flex items-center justify-center">
                <UserPlusIcon className="w-24 h-24 text-emerald-600" />
              </div>
            </div>

            {/* Message */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Join Pagariya Mart!
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              Create your account in seconds and start shopping for fresh groceries
            </p>
            
            {/* Benefits List */}
            <div className="mt-8 space-y-3 text-left bg-white/50 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">Fresh groceries delivered to your doorstep</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">Exclusive deals and offers</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">Track your orders in real-time</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">Easy returns and refunds</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
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
                <span className="text-2xl font-bold text-emerald-600">Pagariya Mart</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center lg:text-left">
            Create Your Account
          </h1>
          <p className="text-gray-600 mb-6 text-center lg:text-left">
            Quick registration with mobile verification
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-emerald-800">
                <p className="font-medium mb-1">Quick & Secure</p>
                <p>We'll send you a verification code to complete your registration</p>
              </div>
            </div>
          </div>

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

            {/* Terms and Privacy */}
            <div className="text-sm text-gray-600">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                Terms
              </Link>
              ,{' '}
              <Link to="/refunds" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                Refunds
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                Privacy Policy
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'PROCESSING...' : 'CONTINUE WITH OTP'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
