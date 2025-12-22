import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextOptimized';
import { XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
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

const LoginPage = () => {
  const [loginMethod, setLoginMethod] = useState('otp'); // Only OTP authentication now
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mobileNo: '',
  });
  const [errors, setErrors] = useState({});
  const [logoError, setLogoError] = useState(false);

  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
    
    // OTP login validation
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

    // OTP login - navigate to OTP input page with form data
    navigate('/otp-input', {
      state: {
        mobileNo: formData.mobileNo,
        from
      }
    });
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Basket Image (hidden on mobile) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          backgroundColor: COLORS.primary[50] // Light green background
        }}
      >
        <div className="flex flex-col items-center justify-center w-full h-full p-12 relative z-10">
          <div className="max-w-md w-full flex flex-col items-center">
            {/* Pagariya Mart Logo */}
            

            {/* Basket Image */}
            <div className="w-full flex items-center justify-center mb-6">
              <img
                src={`${process.env.PUBLIC_URL}/images/download.png`}
                alt="Fresh fruits and vegetables in basket"
                className="w-full h-auto object-contain"
                style={{
                  maxHeight: '35vh',
                  maxWidth: '400px'
                }}
              />
            </div>

            {/* Text below illustration */}
            <div className="w-full text-center space-y-6">
              {/* Main Headline */}
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: 'serif' }}>
                <span style={{ color: COLORS.gray[900] }}>Fresh Groceries,</span>{' '}
                <span style={{ color: COLORS.primary[600] }}>Delivered Fast</span>
              </h2>

              {/* Descriptive Paragraph */}
              <p className="text-base sm:text-lg leading-relaxed" style={{ color: COLORS.gray[600], fontFamily: 'sans-serif' }}>
              Get premium wheat, pulses, dry fruits, juices, soaps & more delivered to your doorstep.
              </p>

              {/* Feature Highlights */}
              <div className="flex items-center justify-center gap-8 sm:gap-12 pt-4">
                {/* Left Feature - 100% Fresh */}
                

                {/* Right Feature - 5000+ Products */}
               
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
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
                  <span className="text-lg font-bold" style={{ color: COLORS.primary[600] }}>Pagariya Mart</span>
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
            Let's Get You Logged In
          </h1>

          {/* Error Message */}
          {error && (
            <div 
              className="mt-4 border rounded-lg p-3"
              style={{
                backgroundColor: COLORS.error[50],
                borderColor: COLORS.error[200]
              }}
            >
              <p className="text-sm" style={{ color: COLORS.error[800] }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
              className="w-full font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 uppercase tracking-wide disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading ? COLORS.gray[300] : COLORS.primary[600],
                color: loading ? COLORS.gray[700] : COLORS.white,
                opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = COLORS.primary[700];
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = COLORS.primary[600];
                }
              }}
            >
              {loading ? 'Please wait...' : 'CONTINUE'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: COLORS.gray[600] }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-semibold transition-colors"
                style={{ color: COLORS.primary[600] }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.primary[600];
                }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
