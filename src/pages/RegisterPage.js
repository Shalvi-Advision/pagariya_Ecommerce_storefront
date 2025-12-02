import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
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

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    mobileNo: '',
  });
  const [errors, setErrors] = useState({});
  const [logoError, setLogoError] = useState(false);

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
            {/* User Plus Icon Illustration */}
            <div className="mb-8">
              <div 
                className="mx-auto w-48 h-48 rounded-full shadow-lg flex items-center justify-center"
                style={{ backgroundColor: COLORS.white }}
              >
                <UserPlusIcon style={{ color: COLORS.primary[600] }} className="w-24 h-24" />
              </div>
            </div>

            {/* Message */}
            <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.gray[800] }}>
              Join Pagariya Mart!
            </h3>
            <p className="text-lg mb-4" style={{ color: COLORS.gray[600] }}>
              Create your account in seconds and start shopping for fresh groceries
            </p>
            
            {/* Benefits List */}
            <div 
              className="mt-8 space-y-3 text-left backdrop-blur-sm rounded-2xl p-6"
              style={{
                backgroundColor: hexToRgba(COLORS.white, 0.5)
              }}
            >
              {[
                'Fresh groceries delivered to your doorstep',
                'Exclusive deals and offers',
                'Track your orders in real-time',
                'Easy returns and refunds'
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div 
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: COLORS.primary[600] }}
                  >
                    <svg className="w-4 h-4" style={{ color: COLORS.white }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="font-medium" style={{ color: COLORS.gray[700] }}>{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
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
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" style={{ color: COLORS.primary[600] }}>Pagariya Mart</span>
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
            Create Your Account
          </h1>
          <p className="mb-6 text-center lg:text-left" style={{ color: COLORS.gray[600] }}>
            Quick registration with mobile verification
          </p>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-4 border rounded-lg p-3"
              style={{
                backgroundColor: COLORS.error[50],
                borderColor: COLORS.error[200]
              }}
            >
              <p className="text-sm" style={{ color: COLORS.error[800] }}>{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div 
            className="mb-6 p-4 border rounded-xl"
            style={{
              backgroundColor: COLORS.primary[50],
              borderColor: COLORS.primary[200]
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" style={{ color: COLORS.primary[600] }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm" style={{ color: COLORS.primary[800] }}>
                <p className="font-medium mb-1">Quick & Secure</p>
                <p>We'll send you a verification code to complete your registration</p>
              </div>
            </div>
          </div>

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

            {/* Terms and Privacy */}
            <div className="text-sm" style={{ color: COLORS.gray[600] }}>
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
              ,{' '}
              <Link 
                to="/refunds" 
                className="font-medium transition-colors"
                style={{ color: COLORS.primary[600] }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.primary[600];
                }}
              >
                Refunds
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 uppercase tracking-wide disabled:cursor-not-allowed shadow-lg"
              style={{
                background: loading 
                  ? `linear-gradient(to right, ${COLORS.gray[300]}, ${COLORS.gray[400]})`
                  : `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`,
                opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[700]}, ${COLORS.success[700]})`;
                  e.currentTarget.style.boxShadow = '0 20px 25px rgba(0, 0, 0, 0.12)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary[600]}, ${COLORS.success[600]})`;
                  e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {loading ? 'PROCESSING...' : 'CONTINUE WITH OTP'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: COLORS.gray[600] }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-semibold transition-colors"
                style={{ color: COLORS.primary[600] }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.primary[600];
                }}
              >
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
