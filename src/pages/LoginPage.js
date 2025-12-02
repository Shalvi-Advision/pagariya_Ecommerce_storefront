import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
            {/* Logo */}
            <div className="mb-8">
              <div 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg"
                style={{ backgroundColor: COLORS.white }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold" style={{ color: COLORS.primary[600] }}>Pagariya Mart</span>
                </div>
              </div>
            </div>

            {/* Illustration SVG */}
            <div className="relative">
              <svg viewBox="0 0 400 500" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Table/Stool */}
                <rect x="50" y="420" width="80" height="15" rx="3" fill="#14b8a6" opacity="0.9"/>
                <rect x="60" y="435" width="60" height="8" rx="2" fill="#0d9488"/>
                
                {/* Items on table */}
                <rect x="65" y="405" width="20" height="15" rx="2" fill="#f59e0b"/>
                <rect x="65" y="400" width="20" height="5" rx="1" fill="#fbbf24"/>
                
                {/* Lamp hanging from ceiling */}
                <line x1="320" y1="20" x2="320" y2="80" stroke="#14b8a6" strokeWidth="2"/>
                <ellipse cx="320" cy="90" rx="40" ry="20" fill="#10b981" opacity="0.8"/>
                
                {/* Person - Body */}
                <ellipse cx="220" cy="380" rx="50" ry="70" fill="#fbbf24"/>
                
                {/* Person - Legs */}
                <rect x="190" y="440" width="25" height="60" rx="5" fill="#0ea5e9"/>
                <rect x="225" y="440" width="25" height="60" rx="5" fill="#0ea5e9"/>
                
                {/* Person - Shoes */}
                <ellipse cx="202" cy="498" rx="18" ry="8" fill="#dc2626"/>
                <ellipse cx="237" cy="498" rx="18" ry="8" fill="#dc2626"/>
                <circle cx="208" cy="498" r="3" fill="#fee2e2"/>
                <circle cx="243" cy="498" r="3" fill="#fee2e2"/>
                
                {/* Person - Head */}
                <circle cx="220" cy="280" r="40" fill="#fcd34d"/>
                
                {/* Person - Hair */}
                <path d="M 180 280 Q 180 240 220 240 Q 260 240 260 280 Q 260 270 220 265 Q 180 270 180 280" fill="#1f2937"/>
                
                {/* Person - Face */}
                <circle cx="205" cy="275" r="5" fill="#1f2937"/>
                <circle cx="235" cy="275" r="5" fill="#1f2937"/>
                
                {/* Glasses */}
                <circle cx="205" cy="275" r="12" fill="none" stroke="#1f2937" strokeWidth="3"/>
                <circle cx="235" cy="275" r="12" fill="none" stroke="#1f2937" strokeWidth="3"/>
                <line x1="217" y1="275" x2="223" y2="275" stroke="#1f2937" strokeWidth="3"/>
                
                {/* Smile */}
                <path d="M 205 290 Q 220 298 235 290" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round"/>
                
                {/* Arm with pointer */}
                <path d="M 170 340 L 100 250 L 105 245" fill="none" stroke="#fbbf24" strokeWidth="20" strokeLinecap="round"/>
                <path d="M 98 238 L 105 245 L 112 238" fill="none" stroke="#fcd34d" strokeWidth="8" strokeLinecap="round"/>
                
                {/* Shopping Bag */}
                <path d="M 250 370 Q 250 360 265 360 L 315 360 Q 330 360 330 370 L 335 450 Q 335 460 320 460 L 260 460 Q 245 460 245 450 Z" fill="#ffffff" stroke="#14b8a6" strokeWidth="3"/>
                
                {/* Bag Handle */}
                <path d="M 270 360 Q 270 345 292.5 345 Q 315 345 315 360" fill="none" stroke="#14b8a6" strokeWidth="3"/>
                
                {/* Pagariya Logo on Bag */}
                <text x="250" y="400" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#10b981">Pagariya</text>
                
                {/* Vegetables in bag */}
                <ellipse cx="280" cy="425" rx="10" ry="12" fill="#f97316"/>
                <ellipse cx="300" cy="430" rx="8" ry="10" fill="#84cc16"/>
                <rect x="308" y="420" width="12" height="25" rx="2" fill="#ef4444"/>
              </svg>
            </div>

            {/* Text below illustration */}
            <p className="mt-8 text-lg font-medium" style={{ color: COLORS.gray[600] }}>
              Fresh groceries delivered to your doorstep
            </p>
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
