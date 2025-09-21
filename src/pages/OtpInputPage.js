import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { PhoneIcon } from '@heroicons/react/24/outline';

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
  }, [otpSent, otpMobile, navigate, from]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      // Start countdown for resend (typically 60 seconds)
      setCountdown(60);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <PhoneIcon className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isRegistration ? 'Create your account' : 'Enter your mobile number'}
          </h2>
          <p className="mt-2 text-gray-600">
            We'll send you a verification code
            {isRegistration ? ' to complete your registration' : ' to sign in'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {otpError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{otpError}</p>
              </div>
            )}

            <Input
              label="Mobile Number"
              name="mobileNo"
              type="tel"
              value={formData.mobileNo}
              onChange={handleChange}
              error={errors.mobileNo}
              placeholder="Enter 10-digit mobile number"
              required
              maxLength={10}
            />

            <Button
              type="submit"
              disabled={otpLoading || countdown > 0}
              className="w-full"
              size="large"
            >
              {otpLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>

          {/* Resend OTP section */}
          {otpSent && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm text-center">
                OTP sent successfully to {otpMobile}
              </p>
              <button
                onClick={handleResendOtp}
                disabled={countdown > 0}
                className="mt-2 w-full text-primary-600 hover:text-primary-500 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          )}
        </Card>

        <div className="mt-8 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-sm text-gray-600 hover:text-primary-600 font-medium"
          >
            ← Back to Login Options
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpInputPage;
