import React, { useState, useEffect } from 'react';
import { MapPinIcon, ClockIcon, PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePincode } from '../context/PincodeContext';

const StoreSelectionModal = ({ isOpen, onClose, onStoreSelect, selectedPincode, isRequired }) => {
  // Get data from PincodeContext
  const {
    availableStores,
    isLoadingStores,
    storesError
  } = usePincode();

  // Stores are loaded automatically by PincodeContext when pincode is selected

  const handleStoreSelect = (store) => {
    console.log('🏪 Store clicked in StoreSelectionModal:', store);
    onStoreSelect(store);
  };

  const handleClose = () => {
    if (!isRequired) {
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Store
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

        {/* Location Info */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Delivering to: {selectedPincode?.pincode}, {selectedPincode?.area}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-96">
          {isLoadingStores ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-gray-600">Loading stores...</span>
            </div>
          ) : storesError ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-600 mb-2">{storesError}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Try again
              </button>
            </div>
          ) : availableStores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No stores available in this area</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableStores.map((store) => (
                <div
                  key={store._id}
                  onClick={() => handleStoreSelect(store)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {store.storeName || store.store_name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {store.storeAddress || store.address}
                      </p>
                      
                      {/* Store Details */}
                      <div className="space-y-1">
                        {(store.storeOpenTime || store.store_open_time) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <ClockIcon className="w-3 h-3" />
                            <span>{store.storeOpenTime || store.store_open_time}</span>
                          </div>
                        )}

                        {(store.storeDeliveryTime || store.delivery_time) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPinIcon className="w-3 h-3" />
                            <span>Delivery: {store.storeDeliveryTime || store.delivery_time}</span>
                          </div>
                        )}

                        {(store.minOrderAmount || store.min_order_amount) && (
                          <div className="text-xs text-gray-500">
                            Min. order: ₹{store.minOrderAmount || store.min_order_amount}
                          </div>
                        )}

                        {(store.storeOfferName || store.offer) && (
                          <div className="text-xs text-green-600 font-medium">
                            {store.storeOfferName || store.offer}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Store Status */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        {(store.homeDelivery || store.delivery_options?.home_delivery) && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Home Delivery
                          </span>
                        )}
                        {(store.selfPickup || store.delivery_options?.self_pickup) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Self Pickup
                          </span>
                        )}
                      </div>

                      {(store.contactNumber || store.contact?.phone) && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <PhoneIcon className="w-3 h-3" />
                          <span>{store.contactNumber || store.contact?.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Store Message */}
                  {(store.storeMessage || store.message) && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      {store.storeMessage || store.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreSelectionModal;
