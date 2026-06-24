import React, { useState } from 'react';
import { 
  XMarkIcon, 
  MapPinIcon,
  TruckIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { usePincode } from '../context/PincodeContext';
import { COLORS } from '../constants/theme';
import { APP_CONSTANTS, LOGO_URL } from '../constants';

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backgroundColor: hexToRgba(COLORS.black, 0.5)
      }}
      onClick={(e) => {
        // Prevent closing when clicking backdrop if required
        if (e.target === e.currentTarget && !isRequired) {
          handleClose();
        }
      }}
    >
      <div
        className="rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col"
        style={{
          backgroundColor: COLORS.white,
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.12)',
          maxHeight: '85vh'
        }}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{
            borderColor: COLORS.primary[200]
          }}
        >
          <div className="flex items-center gap-3">
            <MapPinIcon style={{ color: COLORS.primary[600] }} className="w-6 h-6" />
            <h3
              className="text-lg font-semibold"
              style={{ color: COLORS.gray[900] }}
            >
              Select Your Location
            </h3>
            {isRequired && (
              <span
                className="px-2 py-1 text-xs font-medium rounded"
                style={{
                  backgroundColor: COLORS.error[100],
                  color: COLORS.error[600]
                }}
              >
                Required
              </span>
            )}
          </div>

          {!isRequired && (
            <button
              onClick={handleClose}
              className="p-1 rounded-full transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.gray[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <XMarkIcon style={{ color: COLORS.gray[500] }} className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {/* Only show intro text when no error */}
          {!serviceabilityError && (
            <div className="text-center mb-6">
              <p className="mb-2" style={{ color: COLORS.gray[600] }}>Enter your pincode to find nearby stores</p>
              <p className="text-sm" style={{ color: COLORS.gray[500] }}>We'll check if we deliver to your area</p>
            </div>
          )}

          {/* Pincode Input */}
          <div className={serviceabilityError ? "mb-4" : "mb-6"}>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.gray[700] }}
            >
              Pincode
            </label>
            <input
              type="text"
              value={pincodeInput}
              onChange={handleInputChange}
              placeholder="Enter 6-digit pincode"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none text-center text-lg font-medium"
              style={{
                borderColor: COLORS.gray[300],
                color: COLORS.gray[800]
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary[500];
                e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(COLORS.primary[500], 0.5)}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.gray[300];
                e.currentTarget.style.boxShadow = 'none';
              }}
              maxLength={6}
            />
          </div>

          {/* Serviceability Error */}
          {serviceabilityError && (
            <div
              className="mb-4 p-3 border rounded-md"
              style={{
                backgroundColor: COLORS.error[50],
                borderColor: COLORS.error[200]
              }}
            >
              <p className="text-sm" style={{ color: COLORS.error[600] }}>{serviceabilityError}</p>
            </div>
          )}

          {/* Checking Serviceability */}
          {isCheckingServiceability && (
            <div
              className="mb-4 p-3 border rounded-md"
              style={{
                backgroundColor: COLORS.primary[50],
                borderColor: COLORS.primary[200]
              }}
            >
              <div className="flex items-center justify-center">
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"
                  style={{ borderColor: COLORS.primary[600] }}
                ></div>
                <p className="text-sm" style={{ color: COLORS.primary[600] }}>Checking pincode availability...</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handlePincodeSubmit}
            disabled={pincodeInput.length !== 6 || isCheckingServiceability}
            className="w-full py-3 px-4 rounded-lg font-medium disabled:cursor-not-allowed transition-colors mb-4"
            style={{
              backgroundColor: pincodeInput.length === 6 && !isCheckingServiceability ? COLORS.primary[600] : COLORS.gray[300],
              color: COLORS.white,
              border: 'none',
              cursor: pincodeInput.length === 6 && !isCheckingServiceability ? 'pointer' : 'not-allowed'
            }}
            onMouseEnter={(e) => {
              if (pincodeInput.length === 6 && !isCheckingServiceability) {
                e.currentTarget.style.backgroundColor = COLORS.primary[700];
              }
            }}
            onMouseLeave={(e) => {
              if (pincodeInput.length === 6 && !isCheckingServiceability) {
                e.currentTarget.style.backgroundColor = COLORS.primary[600];
              } else {
                e.currentTarget.style.backgroundColor = COLORS.gray[300];
              }
            }}
          >
            {isCheckingServiceability ? 'Checking...' : 'Check Availability'}
          </button>

          {/* Show Available Pincodes List when pincode is not serviceable */}
          {serviceabilityError && pincodesList.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-3" style={{ color: COLORS.gray[700] }}>Available Pincodes:</h4>
              <div className="space-y-2">
                {pincodesList.slice(0, 10).map((pincode) => (
                  <button
                    key={pincode._id}
                    onClick={() => handlePincodeFromListSelect(pincode)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left border"
                    style={{
                      borderColor: COLORS.primary[100]
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.primary[50];
                      e.currentTarget.style.borderColor = COLORS.primary[200];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.white;
                      e.currentTarget.style.borderColor = COLORS.primary[100];
                    }}
                  >
                    <MapPinIcon style={{ color: COLORS.primary[600] }} className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: COLORS.gray[900] }}>
                        {pincode.pincode}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.gray[500] }}>
                        {pincode.fullAddress}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {pincodesList.length > 10 && (
                <p className="text-xs text-center mt-3" style={{ color: COLORS.gray[500] }}>
                  Showing first 10 locations. Select any pincode to proceed.
                </p>
              )}
            </div>
          )}

          {/* Loading Available Pincodes */}
          {serviceabilityError && isLoadingPincodes && (
            <div
              className="mt-4 p-3 border rounded-md"
              style={{
                backgroundColor: COLORS.gray[50],
                borderColor: COLORS.gray[200]
              }}
            >
              <div className="flex items-center justify-center">
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"
                  style={{ borderColor: COLORS.gray[500] }}
                ></div>
                <p className="text-sm" style={{ color: COLORS.gray[600] }}>Loading available pincodes...</p>
              </div>
            </div>
          )}

          {/* Error Loading Pincodes */}
          {serviceabilityError && pincodesError && (
            <div
              className="mt-4 p-3 border rounded-md"
              style={{
                backgroundColor: COLORS.error[50],
                borderColor: COLORS.error[200]
              }}
            >
              <p className="text-sm" style={{ color: COLORS.error[600] }}>{pincodesError}</p>
            </div>
          )}

          {/* Instructions - Only show when no error */}
          {!serviceabilityError && (
            <div className="mt-4 text-center">
              <p className="text-xs" style={{ color: COLORS.gray[500] }}>
                Enter a valid 6-digit pincode to proceed
              </p>
            </div>
          )}
        </div>

        {/* Bottom Banner - Fixed at bottom */}
        <div className="px-3 pb-3 flex-shrink-0">
          <div
            className="rounded-lg p-2.5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[700]} 100%)`,
            }}
          >
            {/* Decorative Pattern */}
            <div
              className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
              style={{ backgroundColor: COLORS.white }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: COLORS.white }}
            ></div>

            <div className="relative z-10">
              {/* Brand Logo */}
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={LOGO_URL}
                  alt={APP_CONSTANTS.APP_NAME}
                  className="h-8 w-auto object-contain bg-white rounded-md px-1"
                />
                <p className="text-sm font-extrabold tracking-wide" style={{ color: COLORS.white }}>
                  {APP_CONSTANTS.APP_NAME}
                </p>
              </div>

              {/* Features - Horizontal Inline Layout */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <TruckIcon
                    className="w-3.5 h-3.5"
                    style={{ color: COLORS.white }}
                  />
                  <span className="text-xs font-medium" style={{ color: COLORS.white }}>
                    Fast Delivery
                  </span>
                </div>
                
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
                
                <div className="flex items-center gap-1.5">
                  <TagIcon
                    className="w-3.5 h-3.5"
                    style={{ color: COLORS.white }}
                  />
                  <span className="text-xs font-medium" style={{ color: COLORS.white }}>
                    Best Prices
                  </span>
                </div>
                
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
                
                <div className="flex items-center gap-1.5">
                  <SparklesIcon
                    className="w-3.5 h-3.5"
                    style={{ color: COLORS.white }}
                  />
                  <span className="text-xs font-medium" style={{ color: COLORS.white }}>
                    Quality Assured
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PincodeSelectionModal;