import React, { useState } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { usePincode } from '../context/PincodeContext';

const PincodeSelectionModal = ({ isOpen, onClose, onPincodeSelect, isRequired }) => {
  const [pincodeInput, setPincodeInput] = useState('');

  const {
    isCheckingServiceability,
    serviceabilityError,
    pincodesList,
    isLoadingPincodes,
    pincodesError
  } = usePincode();

  const handlePincodeSubmit = () => {
    if (!pincodeInput || pincodeInput.length !== 6) {
      return;
    }

    // Create a pincode object that matches the expected format
    const pincodeData = {
      _id: `temp_${pincodeInput}`,
      pincode: pincodeInput,
      area: 'Unknown Area',
      fullAddress: `${pincodeInput}, India`,
      isEnabled: true
    };

    onPincodeSelect(pincodeData);
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setPincodeInput(value);
    }
  };

  const handleClose = () => {
    if (!isRequired) {
      setPincodeInput('');
      onClose();
    }
  };

  const handlePincodeFromListSelect = (pincode) => {
    onPincodeSelect(pincode);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Prevent closing when clicking backdrop if required
        if (e.target === e.currentTarget && !isRequired) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPinIcon className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Select Your Location
            </h3>
            {isRequired && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
                Required
              </span>
            )}
          </div>

          {!isRequired && (
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-96">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">Enter your pincode to find nearby stores</p>
            <p className="text-sm text-gray-500">We'll check if we deliver to your area</p>
          </div>

          {/* Pincode Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pincode
            </label>
            <input
              type="text"
              value={pincodeInput}
              onChange={handleInputChange}
              placeholder="Enter 6-digit pincode"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg font-medium"
              maxLength={6}
            />
          </div>

          {/* Serviceability Error */}
          {serviceabilityError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{serviceabilityError}</p>
            </div>
          )}

          {/* Checking Serviceability */}
          {isCheckingServiceability && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <p className="text-sm text-blue-600">Checking pincode availability...</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handlePincodeSubmit}
            disabled={pincodeInput.length !== 6 || isCheckingServiceability}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-6"
          >
            {isCheckingServiceability ? 'Checking...' : 'Check Availability'}
          </button>

          {/* Show Available Pincodes List when pincode is not serviceable */}
          {serviceabilityError && pincodesList.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Available Pincodes:</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {pincodesList.slice(0, 10).map((pincode) => (
                  <button
                    key={pincode._id}
                    onClick={() => handlePincodeFromListSelect(pincode)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left border border-gray-100"
                  >
                    <MapPinIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {pincode.pincode}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pincode.fullAddress}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {pincodesList.length > 10 && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Showing first 10 locations. Select any pincode to proceed.
                </p>
              )}
            </div>
          )}

          {/* Loading Available Pincodes */}
          {serviceabilityError && isLoadingPincodes && (
            <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                <p className="text-sm text-gray-600">Loading available pincodes...</p>
              </div>
            </div>
          )}

          {/* Error Loading Pincodes */}
          {serviceabilityError && pincodesError && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{pincodesError}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Enter a valid 6-digit pincode to proceed
            </p>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-6 h-4 bg-green-500 rounded-t"></div>
                  <div className="w-6 h-2 bg-gray-300 rounded-b"></div>
                  <div className="text-xs text-gray-600 font-medium">Pagariya</div>
                </div>
                <div className="w-2 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Your <span className="text-red-600 font-bold">Shopping & Savings'</span> Partner
              </p>
              <p className="text-xs text-gray-600 mt-1">
                One-stop shop for your family needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PincodeSelectionModal;