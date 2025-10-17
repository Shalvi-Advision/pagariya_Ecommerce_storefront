import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { PhoneIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const [loginMethod, setLoginMethod] = useState('otp'); // Only OTP authentication now
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mobileNo: '',
  });
  const [errors, setErrors] = useState({});

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


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-gray-600">
            Or{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
              create a new account
            </Link>
          </p>
        </div>

        {/* OTP Login Header */}
        <div className="flex items-center justify-center gap-2 mb-6 bg-gray-100 p-3 rounded-lg">
          <PhoneIcon className="w-5 h-5 text-primary-600" />
          <h3 className="font-medium text-gray-900">OTP Authentication</h3>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* OTP Login Fields */}
            <>
              <Input
                label="Mobile Number"
                name="mobileNo"
                type="tel"
                value={formData.mobileNo}
                onChange={handleChange}
                error={errors.mobileNo}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                required
              />

              <Button
                type="submit"
                className="w-full"
                size="large"
              >
                Send OTP
              </Button>

              <div className="text-center text-sm text-gray-600">
                We'll send a verification code to your mobile number
              </div>
            </>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
