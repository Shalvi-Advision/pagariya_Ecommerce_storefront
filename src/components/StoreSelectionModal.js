import React, { useState, useEffect } from 'react';
import { MapPinIcon, ClockIcon, PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getPincodeStores, formatStoreData } from '../api/pincodeService';

const StoreSelectionModal = ({ isOpen, onClose, onStoreSelect, selectedPincode, isRequired }) => {
  // Local state for stores fetched directly from API
  const [availableStores, setAvailableStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storesError, setStoresError] = useState(null);

  // Fetch stores dynamically when modal opens and pincode is available
  useEffect(() => {
    const fetchStores = async () => {
      // Only fetch if modal is open and pincode is available
      if (!isOpen) {
        return;
      }

      // Handle different pincode formats
      let pincodeValue = null;
      if (typeof selectedPincode === 'string') {
        pincodeValue = selectedPincode;
      } else if (selectedPincode?.pincode) {
        pincodeValue = selectedPincode.pincode;
      } else {
        console.warn('⚠️ StoreSelectionModal: No valid pincode found', selectedPincode);
        return;
      }

      // Ensure pincode is a string and trim whitespace
      pincodeValue = String(pincodeValue).trim();
      
      if (!pincodeValue) {
        console.warn('⚠️ StoreSelectionModal: Empty pincode value');
        return;
      }

      console.log('🔄 StoreSelectionModal: Fetching stores for pincode:', pincodeValue);
      console.log('🔄 StoreSelectionModal: Selected pincode object:', selectedPincode);
      console.log('🔄 StoreSelectionModal: Pincode type:', typeof pincodeValue);
      console.log('🔄 StoreSelectionModal: Pincode value:', JSON.stringify(pincodeValue));
      
      setIsLoadingStores(true);
      setStoresError(null);
      setAvailableStores([]);

      try {
        // Fetch stores from API
        const response = await getPincodeStores(pincodeValue);
        console.log('📦 StoreSelectionModal: API Response:', response);
        console.log('📦 StoreSelectionModal: Response success:', response.success);
        console.log('📦 StoreSelectionModal: Response count:', response.count);
        console.log('📦 StoreSelectionModal: Response data:', response.data);

        if (response.success && response.data && response.data.length > 0) {
          // Format all stores regardless of is_enabled status
          const formattedStores = response.data.map(formatStoreData);
          console.log('✅ StoreSelectionModal: Formatted stores (all stores, including disabled):', formattedStores);
          console.log('✅ StoreSelectionModal: Total stores to display:', formattedStores.length);
          
          // Set all stores without filtering - show both enabled and disabled stores
          setAvailableStores(formattedStores);
        } else {
          console.log('❌ StoreSelectionModal: No stores found or API error:', response);
          setStoresError(response.message || 'No stores found for this pincode');
          setAvailableStores([]);
        }
      } catch (error) {
        console.error('❌ StoreSelectionModal: Error fetching stores:', error);
        setStoresError('Failed to load stores. Please try again.');
        setAvailableStores([]);
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, [isOpen, selectedPincode]);

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
              {availableStores.map((store) => {
                // Check if store is disabled
                const isDisabled = store.isEnabled === false || 
                                  store.is_enabled === 'Disabled' || 
                                  store.is_enabled === false;
                
                return (
                <div
                  key={store._id}
                  onClick={() => handleStoreSelect(store)}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    isDisabled 
                      ? 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:shadow-sm opacity-90' 
                      : 'border-gray-200 hover:border-green-500 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${isDisabled ? 'text-gray-600' : 'text-gray-900'}`}>
                          {store.storeName || store.store_name}
                        </h4>
                        {isDisabled && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                            Disabled
                          </span>
                        )}
                      </div>
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
              );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreSelectionModal;
