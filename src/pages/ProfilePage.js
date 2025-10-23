import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccountSidebar from '../components/AccountSidebar';
import Button from '../components/Button';
import SuccessToast from '../components/SuccessToast';
import Loading from '../components/Loading';

const ProfilePage = () => {
  const {
    user,
    updateProfile,
    loading: authLoading,
    error: authError,
    successMessage: authSuccessMessage,
    clearError,
    setSuccessMessage,
    clearSuccessMessage
  } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Load profile data from auth context
  useEffect(() => {
    if (user) {
      // Split name into first and last name for display
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        firstName: firstName,
        lastName: lastName
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    clearError();

    // Combine firstName and lastName into name
    const profileData = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email
    };

    const result = await updateProfile(profileData);
    if (result.success) {
      setIsEditMode(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
    clearError();
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    clearError();
    // Reset form data to original user data
    if (user) {
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        firstName: firstName,
        lastName: lastName
      });
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Implement delete account functionality
      console.log('Delete account requested');
    }
  };

  const handleChangeMobile = () => {
    // Implement change mobile number functionality
    console.log('Change mobile number requested');
  };

  const handleVerifyEmail = () => {
    // Implement email verification functionality
    console.log('Verify email requested');
  };

  // Show loading state
  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      <SuccessToast
        message={authSuccessMessage}
        isVisible={!!authSuccessMessage}
        onClose={clearSuccessMessage}
      />

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-64">
          <AccountSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {user?.name ? `Welcome back, ${user.name}!` : 'Complete your profile to get started'}
              </p>
            </div>

            {/* Profile Status Card */}
            {user && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-lg">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.name || 'User'}</h3>
                      <p className="text-sm text-gray-500">{user.mobile}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6">
                {/* Form Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isEditMode ? 'Edit Profile' : 'Profile Information'}
                  </h2>
                  {!isEditMode && (
                    <button
                      onClick={handleEditProfile}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveChanges} className="space-y-6">
                  {/* Mobile Number Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-gray-900 font-medium">{formData.mobile || 'Not provided'}</span>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user?.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user?.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Name Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm sm:text-base"
                          placeholder="Enter first name"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{formData.firstName || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm sm:text-base"
                          placeholder="Enter last name"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{formData.lastName || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {/* Email Section */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditMode ? (
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm sm:text-base"
                        placeholder="Enter email address"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{formData.email || 'Not provided'}</p>
                    )}
                  </div>

                  {/* User Role and ID Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                        <p className="text-gray-900 py-2 capitalize">{user?.role || 'user'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                        <p className="text-gray-900 py-2 text-xs font-mono">{user?.id || 'Not available'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditMode && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                      <Button
                        type="submit"
                        disabled={authLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {authLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>

                {/* Error Message */}
                {authError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{authError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Account Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
