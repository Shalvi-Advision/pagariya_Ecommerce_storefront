import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    mobileNo: '',
    projectCode: 'RET5890',
  });
  const [errors, setErrors] = useState({});

  const { loading, error, clearError } = useAuth();
  const navigate = useNavigate();

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

    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNo.replace(/\s+/g, ''))) {
      newErrors.mobileNo = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.projectCode.trim()) {
      newErrors.projectCode = 'Project code is required';
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
        projectCode: formData.projectCode,
        isRegistration: true, // Flag to indicate this is for registration
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">
            Or{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              sign in to existing account
            </Link>
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Quick Registration</p>
              <p>Enter your mobile number below. We'll send you a verification code to complete your registration.</p>
            </div>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
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
              maxLength={10}
              required
            />

            <Input
              label="Project Code"
              name="projectCode"
              type="text"
              value={formData.projectCode}
              onChange={handleChange}
              error={errors.projectCode}
              placeholder="Enter project code"
              required
              readOnly
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="large"
            >
              {loading ? 'Processing...' : 'Continue with OTP'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              We'll send a verification code to your mobile number to complete registration
            </div>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
