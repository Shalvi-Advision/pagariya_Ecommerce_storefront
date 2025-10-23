import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  ClockIcon, 
  PhoneIcon, 
  XMarkIcon,
  PencilIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatStoreData } from '../api/pincodeService';

const StoreDetailsModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPincode,
  selectedStore,
  isRequired
}) => {
  const [storeDetails, setStoreDetails] = useState(null);

  useEffect(() => {
    if (isOpen && selectedStore) {
      console.log('🏪 StoreDetailsModal received selectedStore:', selectedStore);
      // Use the selected store data directly (already formatted)
      setStoreDetails(selectedStore);
    }
  }, [isOpen, selectedStore]);

  const handleConfirm = () => {
    if (storeDetails) {
      onConfirm({
        pincode: selectedPincode,
        store: storeDetails
      });
    }
  };

  const handleClose = () => {
    if (!isRequired) {
      setStoreDetails(null);
      onClose();
    }
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header - Fixed */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Location
            </h3>
            {isRequired && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
                Required
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Location Display */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedPincode?.pincode}, {selectedPincode?.area}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedPincode?.fullAddress}
                  </p>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <PencilIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Serviceability Confirmation Card */}
          <div className="px-6 py-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              {/* Illustration */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center">
                  {/* Shopping basket illustration */}
                  <div className="relative">
                    <div className="w-12 h-8 bg-teal-500 rounded-t-lg"></div>
                    <div className="w-12 h-2 bg-teal-600 rounded-b-lg"></div>
                    {/* Grocery items in basket */}
                    <div className="absolute -top-1 left-1 w-2 h-2 bg-yellow-300 rounded"></div>
                    <div className="absolute -top-1 left-3 w-2 h-2 bg-green-300 rounded"></div>
                    <div className="absolute -top-1 left-5 w-2 h-2 bg-blue-300 rounded"></div>
                    <div className="absolute -top-1 left-7 w-2 h-2 bg-red-300 rounded"></div>
                    {/* D-Mart text */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-teal-600">
                      D-Mart
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Message */}
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Great, We are available here!
                </h4>
                <p className="text-sm text-gray-500">
                  Explore our wide range of products delivered straight to your home!
                </p>
              </div>
            </div>
          </div>

        {/* Store Details */}
        {storeDetails ? (
          <div className="px-6 py-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Selected Store Details</h5>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Store:</span>
                  <span className="ml-2 text-gray-600">
                    {storeDetails.storeName || storeDetails.store_name || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <span className="ml-2 text-gray-600">
                    {storeDetails.storeAddress || storeDetails.address || 'N/A'}
                  </span>
                </div>

                {(storeDetails.storeOpenTime || storeDetails.store_open_time) && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      {storeDetails.storeOpenTime || storeDetails.store_open_time}
                    </span>
                  </div>
                )}

                {(storeDetails.storeDeliveryTime || storeDetails.delivery_time) && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      Delivery: {storeDetails.storeDeliveryTime || storeDetails.delivery_time}
                    </span>
                  </div>
                )}

                {(storeDetails.minOrderAmount || storeDetails.min_order_amount) && (
                  <div>
                    <span className="font-medium text-gray-700">Min. Order:</span>
                    <span className="ml-2 text-gray-600">
                      ₹{storeDetails.minOrderAmount || storeDetails.min_order_amount}
                    </span>
                  </div>
                )}

                {(storeDetails.storeOfferName || storeDetails.offer) && (
                  <div>
                    <span className="font-medium text-gray-700">Offers:</span>
                    <span className="ml-2 text-green-600 font-medium">
                      {storeDetails.storeOfferName || storeDetails.offer}
                    </span>
                  </div>
                )}

                {(storeDetails.contactNumber || storeDetails.contact?.phone) && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      {storeDetails.contactNumber || storeDetails.contact?.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="bg-red-50 rounded-lg p-4">
              <h5 className="font-semibold text-red-900 mb-3">Debug Information</h5>
              <div className="text-sm text-red-700">
                <p>No store details available</p>
                <p>selectedStore: {JSON.stringify(selectedStore)}</p>
                <p>storeDetails: {JSON.stringify(storeDetails)}</p>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Action Button - Fixed at Bottom */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={!storeDetails}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            CONFIRM LOCATION
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailsModal;
