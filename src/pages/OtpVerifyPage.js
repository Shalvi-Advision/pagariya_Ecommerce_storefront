import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { PhoneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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

    // Auto-submit when OTP is complete
    if (value.length === (otpLength || 4)) {
      handleSubmit(null, value);
    }
  };

  const validateOtpForm = (otpValue = otp) => {
    const newErrors = {};

    if (!otpValue.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otpValue.length !== (otpLength || 4)) {
      newErrors.otp = `Please enter ${otpLength || 4} digit OTP`;
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

  const formatMobileNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `+91 ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
    }
    return number;
  };

  const displayMobile = mobileNo || otpMobile;
  const expectedOtpLength = otpLength || 4;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <PhoneIcon className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isRegistration ? 'Verify your account' : 'Enter verification code'}
          </h2>
          <p className="mt-2 text-gray-600">
            We sent a {expectedOtpLength}-digit code to{' '}
            <span className="font-medium text-gray-900">
              {formatMobileNumber(displayMobile)}
            </span>
            {isRegistration ? ' to complete your registration' : ' to sign in'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {otpVerifyError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{otpVerifyError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 text-center">
                Enter {expectedOtpLength}-digit OTP
              </label>
              <Input
                ref={otpInputRef}
                type="text"
                value={otp}
                onChange={handleOtpChange}
                onKeyDown={handleKeyDown}
                error={errors.otp}
                placeholder={`Enter ${expectedOtpLength} digit code`}
                maxLength={expectedOtpLength}
                className="text-center text-2xl font-mono tracking-widest"
                inputClassName="text-center"
              />
            </div>

            <Button
              type="submit"
              disabled={otpVerifyLoading || otp.length !== expectedOtpLength}
              className="w-full"
              size="large"
            >
              {otpVerifyLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>

          {/* Resend OTP section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOtp}
              disabled={countdown > 0 || resendAttempts >= 3}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendAttempts >= 3
                ? 'Maximum resend attempts reached'
                : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : 'Resend code'
              }
            </button>
          </div>

          {/* Back button */}
          <div className="mt-4 text-center">
            <button
              onClick={handleBackToInput}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Change mobile number
            </button>
          </div>
        </Card>

        <div className="mt-8 text-center">
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

export default OtpVerifyPage;
