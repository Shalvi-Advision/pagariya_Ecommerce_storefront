import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'otp'
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

    if (loginMethod === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
      } else {
        // OTP login validation
        if (!formData.mobileNo.trim()) {
          newErrors.mobileNo = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(formData.mobileNo.replace(/\s+/g, ''))) {
          newErrors.mobileNo = 'Please enter a valid 10-digit mobile number';
        }
      }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (loginMethod === 'email') {
      const result = await login(formData);

      if (result.success) {
        navigate(from, { replace: true });
      }
    } else {
      // OTP login - navigate to OTP input page with form data
      navigate('/otp-input', {
        state: {
          mobileNo: formData.mobileNo,
          from
        }
      });
    }
  };

  const handleMethodSwitch = (method) => {
    setLoginMethod(method);
    setErrors({}); // Clear errors when switching methods
    clearError(); // Clear any existing errors
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

        {/* Login Method Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => handleMethodSwitch('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <EnvelopeIcon className="w-4 h-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => handleMethodSwitch('otp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'otp'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PhoneIcon className="w-4 h-4" />
            OTP
          </button>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {loginMethod === 'email' ? (
              // Email/Password Login Fields
              <>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="Enter your email"
                  required
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Enter your password"
                  required
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="large"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </>
            ) : (
              // OTP Login Fields
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
            )}
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
