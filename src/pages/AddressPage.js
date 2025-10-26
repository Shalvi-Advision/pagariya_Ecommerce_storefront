import React, { useState, useEffect } from 'react';
import AccountSidebar from '../components/AccountSidebar';
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { usePincode } from '../context/PincodeContext';
import { 
  getAddresses, 
  addAddress, 
  updateAddress, 
  deleteAddress,
  setDefaultAddress,
  transformAddressFromAPI,
  transformAddressToAPI 
} from '../api/addressApi';

const AddressPage = () => {
  const { getCurrentPincode, confirmedLocation } = usePincode();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pinCode: '',
    isDefault: false
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses();
  }, []);

  // Initialize pincode from context when confirmed location changes
  useEffect(() => {
    const currentPincode = getCurrentPincode();
    if (currentPincode) {
      setFormData(prev => ({
        ...prev,
        pinCode: currentPincode
      }));
    }
  }, [confirmedLocation, getCurrentPincode]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setApiError('');
      const response = await getAddresses();
      
      if (response.success && response.data) {
        // Transform API data to UI format
        const transformedAddresses = response.data.map(transformAddressFromAPI);
        setAddresses(transformedAddresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
      setApiError('Failed to load addresses. Please try again.');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    // PIN code validation is not needed as it's automatically set from context
    if (!formData.pinCode.trim()) newErrors.pinCode = 'PIN code is required';
    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode.replace(/\s/g, ''))) newErrors.pinCode = 'PIN code must be 6 digits';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    const currentPincode = getCurrentPincode();
    setFormData({
      name: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pinCode: currentPincode || '',
      isDefault: false
    });
    setErrors({});
    setApiError('');
    setShowAddModal(true);
  };

  const handleEditAddress = (address) => {
    // Store the original address data to preserve all IDs
    setEditingAddress(address);
    const currentPincode = getCurrentPincode();
    setFormData({
      name: address.name,
      email: address.email || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      pinCode: currentPincode || address.pinCode, // Use current pincode from context, fallback to address pincode
      isDefault: address.isDefault
    });
    setErrors({});
    setApiError('');
    setShowAddModal(true);
  };

  const handleDeleteAddress = async (address) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        setApiError('');
        await deleteAddress(address.id);
        setSuccessMessage('Address deleted successfully');
        // Reload addresses after deletion
        await loadAddresses();
      } catch (error) {
        console.error('Failed to delete address:', error);
        setApiError(error.message || 'Failed to delete address. Please try again.');
      }
    }
  };

  const handleSetDefault = async (address) => {
    try {
      setApiError('');
      
      // First, update all other addresses to non-default
      const updatePromises = addresses
        .filter(addr => addr.id !== address.id && addr.isDefault)
        .map(addr => {
          const apiData = transformAddressToAPI({ ...addr, isDefault: false });
          return updateAddress(addr.id, apiData);
        });
      
      await Promise.all(updatePromises);
      
      // Then set the selected address as default
      const apiData = transformAddressToAPI({ ...address, isDefault: true });
      // Pass the complete address data including all IDs
      await setDefaultAddress(address.id, { ...apiData, mongoId: address.mongoId, idaddress_book: address.idaddress_book });
      
      setSuccessMessage('Default address updated successfully');
      // Reload addresses
      await loadAddresses();
    } catch (error) {
      console.error('Failed to set default address:', error);
      setApiError(error.message || 'Failed to set default address. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      setApiError('');

      // Transform form data to API format
      const apiData = transformAddressToAPI(formData);

      if (editingAddress) {
        // Update existing address
        
        // If setting as default, first unset other default addresses
        if (formData.isDefault) {
          const updatePromises = addresses
            .filter(addr => addr.id !== editingAddress.id && addr.isDefault)
            .map(addr => {
              const data = transformAddressToAPI({ ...addr, isDefault: false });
              // Pass complete address data with all IDs
              return updateAddress(addr.id, { ...data, mongoId: addr.mongoId, idaddress_book: addr.idaddress_book });
            });
          await Promise.all(updatePromises);
        }
        
        // Debug: Log the address data being used for update
        console.log('🔍 Updating address with:', {
          editingAddressId: editingAddress.id,
          editingAddressMongoId: editingAddress.mongoId,
          editingAddressIdaddressBook: editingAddress.idaddress_book,
          apiData: apiData
        });
        
        // Pass complete address data with all IDs for the main update
        await updateAddress(editingAddress.id, { ...apiData, mongoId: editingAddress.mongoId, idaddress_book: editingAddress.idaddress_book });
        setSuccessMessage('Address updated successfully');
      } else {
        // Add new address
        
        // If setting as default, first unset other default addresses
        if (formData.isDefault) {
          const updatePromises = addresses
            .filter(addr => addr.isDefault)
            .map(addr => {
              const data = transformAddressToAPI({ ...addr, isDefault: false });
              // Pass complete address data with all IDs
              return updateAddress(addr.id, { ...data, mongoId: addr.mongoId, idaddress_book: addr.idaddress_book });
            });
          await Promise.all(updatePromises);
        }
        
        await addAddress(apiData);
        setSuccessMessage('Address added successfully');
      }

      // Reload addresses
      await loadAddresses();

      // Close modal and reset form
      setShowAddModal(false);
      setEditingAddress(null);
      const currentPincode = getCurrentPincode();
      setFormData({
        name: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        pinCode: currentPincode || '',
        isDefault: false
      });
    } catch (error) {
      console.error('Failed to save address:', error);
      setApiError(error.message || 'Failed to save address. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingAddress(null);
    setErrors({});
    setApiError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AccountSidebar />

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8">
          <div className="max-w-6xl">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>{successMessage}</span>
                </div>
                <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {apiError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
                <span>{apiError}</span>
                <button onClick={() => setApiError('')} className="text-red-600 hover:text-red-800">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Addresses</h1>
              <button
                onClick={handleAddAddress}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Add New Address</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
            
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading addresses...</p>
                </div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPinIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                  <p className="text-gray-600 mb-6">Add your first address to get started</p>
                  <button
                    onClick={handleAddAddress}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    Add New Address
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {addresses.map((address, index) => (
                  <div
                    key={address.mongoId || address.id || `address-${index}`}
                    className={`bg-white rounded-lg shadow-sm border-2 p-4 sm:p-6 relative transition-all hover:shadow-md ${
                      address.isDefault ? 'border-emerald-500' : 'border-gray-200'
                    }`}
                  >
                    {/* Default Badge */}
                    {address.isDefault && (
                      <div className="flex items-center justify-end mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      </div>
                    )}

                    {/* Address Details */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{address.name}</h3>
                      {address.email && <p className="text-sm text-gray-600 mb-1">Email: {address.email}</p>}
                      <p className="text-sm text-gray-600 mt-2">
                        {address.addressLine1}
                        {address.addressLine2 && <>, {address.addressLine2}</>}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city} - {address.pinCode}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="ml-auto text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* API Error in Modal */}
              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {apiError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="House no., Building name"
                />
                {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>}
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Road name, Area, Colony"
                />
              </div>

              {/* City and PIN Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN Code <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Fixed from selected location)</span>
                  </label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    readOnly
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    placeholder="6-digit PIN"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PIN code is automatically set from your selected location
                  </p>
                </div>
              </div>

              {/* Set as Default */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="text-emerald-600 focus:ring-emerald-500 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Set as default address</label>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingAddress ? 'Update Address' : 'Save Address'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressPage;
