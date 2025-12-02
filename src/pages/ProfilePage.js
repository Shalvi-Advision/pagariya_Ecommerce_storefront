import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccountSidebar from '../components/AccountSidebar';
import Button from '../components/Button';
import SuccessToast from '../components/SuccessToast';
import Loading from '../components/Loading';
import { COLORS } from '../constants/theme';

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
    <div className="min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
      {/* Success Toast */}
      <SuccessToast
        message={authSuccessMessage}
        isVisible={!!authSuccessMessage}
        onClose={clearSuccessMessage}
      />

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:w-64">
          <AccountSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-2 sm:p-4 lg:p-6 xl:p-8">
          <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="mb-3 sm:mb-6 lg:mb-8">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 sm:mb-1.5 lg:mb-2" style={{ color: COLORS.gray[900] }}>Profile</h1>
              <p className="text-[11px] sm:text-xs lg:text-sm xl:text-base leading-relaxed" style={{ color: COLORS.gray[600] }}>
                {user?.name ? `Welcome back, ${user.name}!` : 'Complete your profile to get started'}
              </p>
            </div>

            {/* Profile Status Card */}
            {user && (
              <div className="rounded-lg sm:rounded-xl shadow-sm border p-2.5 sm:p-3 lg:p-4 xl:p-6 mb-3 sm:mb-4 lg:mb-6" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray[200] }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 lg:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.primary[100] }}>
                      <span className="font-semibold text-sm sm:text-base lg:text-lg" style={{ color: COLORS.primary[600] }}>
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold truncate" style={{ color: COLORS.gray[900] }}>{user.name || 'User'}</h3>
                      <p className="text-[11px] sm:text-xs lg:text-sm truncate" style={{ color: COLORS.gray[500] }}>{user.mobile}</p>
                      <p className="text-[9px] sm:text-[10px] lg:text-xs capitalize truncate" style={{ color: COLORS.gray[400] }}>{user.role}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0 self-start sm:self-auto">
                    <div className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-medium" style={{
                      backgroundColor: user.isVerified ? COLORS.success[100] : COLORS.warning[100],
                      color: user.isVerified ? COLORS.success[800] : COLORS.warning[800]
                    }}>
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Form */}
            <div className="rounded-lg sm:rounded-xl shadow-sm border" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray[200] }}>
              <div className="p-2.5 sm:p-3 lg:p-4 xl:p-6">
                {/* Form Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 lg:gap-0 mb-3 sm:mb-4 lg:mb-6">
                  <h2 className="text-sm sm:text-base lg:text-lg font-semibold" style={{ color: COLORS.gray[900] }}>
                    {isEditMode ? 'Edit Profile' : 'Profile Information'}
                  </h2>
                  {!isEditMode && (
                    <button
                      onClick={handleEditProfile}
                      className="inline-flex items-center justify-center px-2.5 sm:px-3 py-2 sm:py-2 border shadow-sm text-[11px] sm:text-xs lg:text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                      style={{
                        borderColor: COLORS.gray[300],
                        color: COLORS.gray[700],
                        backgroundColor: COLORS.white
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.gray[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.white;
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.outline = `2px solid ${COLORS.primary[500]}`;
                        e.currentTarget.style.outlineOffset = '2px';
                      }}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveChanges} className="space-y-3 sm:space-y-4 lg:space-y-6">
                  {/* Mobile Number Section */}
                  <div className="rounded-md sm:rounded-lg p-2.5 sm:p-3 lg:p-4" style={{ backgroundColor: COLORS.gray[50] }}>
                    <label className="block text-[11px] sm:text-xs lg:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: COLORS.gray[700] }}>Mobile Number</label>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <span className="font-medium text-xs sm:text-sm lg:text-base break-all" style={{ color: COLORS.gray[900] }}>{formData.mobile || 'Not provided'}</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-medium" style={{
                          backgroundColor: user?.isVerified ? COLORS.success[100] : COLORS.warning[100],
                          color: user?.isVerified ? COLORS.success[800] : COLORS.warning[800]
                        }}>
                          {user?.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Name Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4 xl:gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-[11px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2" style={{ color: COLORS.gray[700] }}>
                        First Name
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-2.5 sm:px-3 py-2.5 sm:py-2 border rounded-md outline-none text-sm sm:text-base min-h-[44px] sm:min-h-0"
                          style={{
                            borderColor: COLORS.gray[300]
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = COLORS.primary[500];
                            e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.primary[500]}40`;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = COLORS.gray[300];
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          placeholder="Enter first name"
                        />
                      ) : (
                        <p className="py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base" style={{ color: COLORS.gray[900] }}>{formData.firstName || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-[11px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2" style={{ color: COLORS.gray[700] }}>
                        Last Name
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-2.5 sm:px-3 py-2.5 sm:py-2 border rounded-md outline-none text-sm sm:text-base min-h-[44px] sm:min-h-0"
                          style={{
                            borderColor: COLORS.gray[300]
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = COLORS.primary[500];
                            e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.primary[500]}40`;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = COLORS.gray[300];
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          placeholder="Enter last name"
                        />
                      ) : (
                        <p className="py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base" style={{ color: COLORS.gray[900] }}>{formData.lastName || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {/* Email Section */}
                  <div>
                    <label htmlFor="email" className="block text-[11px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2" style={{ color: COLORS.gray[700] }}>
                      Email Address
                    </label>
                    {isEditMode ? (
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-2.5 sm:px-3 py-2.5 sm:py-2 border rounded-md outline-none text-sm sm:text-base min-h-[44px] sm:min-h-0"
                        style={{
                          borderColor: COLORS.gray[300]
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = COLORS.primary[500];
                          e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.primary[500]}40`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = COLORS.gray[300];
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        placeholder="Enter email address"
                      />
                    ) : (
                      <p className="py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base break-all" style={{ color: COLORS.gray[900] }}>{formData.email || 'Not provided'}</p>
                    )}
                  </div>

                  {/* User Role and ID Section */}
                  <div className="rounded-md sm:rounded-lg p-2.5 sm:p-3 lg:p-4" style={{ backgroundColor: COLORS.gray[50] }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
                      <div>
                        <label className="block text-[11px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2" style={{ color: COLORS.gray[700] }}>User Role</label>
                        <p className="py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base capitalize" style={{ color: COLORS.gray[900] }}>{user?.role || 'user'}</p>
                      </div>
                      <div>
                        <label className="block text-[11px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2" style={{ color: COLORS.gray[700] }}>User ID</label>
                        <p className="py-1 sm:py-1.5 lg:py-2 text-[9px] sm:text-[10px] lg:text-xs font-mono break-all" style={{ color: COLORS.gray[900] }}>{user?.id || 'Not available'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditMode && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 lg:gap-3 pt-3 sm:pt-4 lg:pt-6 border-t" style={{ borderColor: COLORS.gray[200] }}>
                      <Button
                        type="submit"
                        disabled={authLoading}
                        className="flex-1 font-medium py-3 sm:py-2 px-3 sm:px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 text-sm sm:text-base"
                        style={{
                          backgroundColor: COLORS.primary[600],
                          color: COLORS.white
                        }}
                        onMouseEnter={(e) => {
                          if (!authLoading) {
                            e.currentTarget.style.backgroundColor = COLORS.primary[700];
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!authLoading) {
                            e.currentTarget.style.backgroundColor = COLORS.primary[600];
                          }
                        }}
                      >
                        {authLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 font-medium py-3 sm:py-2 px-3 sm:px-4 rounded-md transition-colors min-h-[44px] sm:min-h-0 text-sm sm:text-base"
                        style={{
                          backgroundColor: COLORS.gray[100],
                          color: COLORS.gray[700]
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.gray[200];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.gray[100];
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>

                {/* Error Message */}
                {authError && (
                  <div className="mt-2.5 sm:mt-3 lg:mt-4 border rounded-md p-2.5 sm:p-3 lg:p-4" style={{ backgroundColor: COLORS.error[50], borderColor: COLORS.error[200] }}>
                    <div className="flex">
                      <div className="ml-0 sm:ml-3">
                        <h3 className="text-[11px] sm:text-xs lg:text-sm font-medium" style={{ color: COLORS.error[800] }}>Error</h3>
                        <div className="mt-1 sm:mt-1.5 lg:mt-2 text-[11px] sm:text-xs lg:text-sm" style={{ color: COLORS.error[700] }}>
                          <p>{authError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Account Section */}
                <div className="mt-4 sm:mt-6 lg:mt-8 pt-3 sm:pt-4 lg:pt-6 border-t" style={{ borderColor: COLORS.gray[200] }}>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="font-medium text-[11px] sm:text-xs lg:text-sm py-2 sm:py-0 min-h-[44px] sm:min-h-0 w-full sm:w-auto text-left sm:text-left"
                    style={{ color: COLORS.error[600] }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.error[700];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.error[600];
                    }}
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
