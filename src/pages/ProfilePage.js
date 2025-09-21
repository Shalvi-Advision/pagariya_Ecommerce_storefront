import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccountSidebar from '../components/AccountSidebar';
import Button from '../components/Button';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        mobile: user.mobile || '+91 | 9324114931',
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
    setIsLoading(true);
    setMessage('');

    try {
      await updateUser(formData);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AccountSidebar />

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

            <form onSubmit={handleSaveChanges} className="space-y-6">
              {/* Mobile Number Section */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">Mobile Number</label>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{formData.mobile}</span>
                  <button
                    type="button"
                    onClick={handleChangeMobile}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Change Mobile Number
                  </button>
                </div>
              </div>

              {/* Name Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm text-gray-500 mb-2">
                    First Name*
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm text-gray-500 mb-2">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              {/* Email Section */}
              <div>
                <label htmlFor="email" className="block text-sm text-gray-500 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Enter email address"
                />
                {formData.email && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-red-600 text-sm">Email is not verified.</span>
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Verify now
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md transition-colors"
                >
                  {isLoading ? 'Saving...' : 'SAVE CHANGES'}
                </Button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="w-full text-center text-red-600 hover:text-red-700 font-bold py-2 transition-colors"
                >
                  DELETE MY ACCOUNT
                </button>
              </div>

              {/* Message */}
              {message && (
                <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
