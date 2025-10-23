import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkPincodeServiceability } from '../api/pincodeService';

const PincodeContext = createContext();

export const usePincode = () => {
  const context = useContext(PincodeContext);
  if (!context) {
    throw new Error('usePincode must be used within a PincodeProvider');
  }
  return context;
};

export const PincodeProvider = ({ children }) => {
  // Modal states
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isStoreDetailsModalOpen, setIsStoreDetailsModalOpen] = useState(false);

  // Selection states
  const [selectedPincode, setSelectedPincode] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [confirmedLocation, setConfirmedLocation] = useState(null);

  // Serviceability states
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [serviceabilityError, setServiceabilityError] = useState(null);

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('confirmedLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setConfirmedLocation(parsed);
        setSelectedPincode(parsed.pincode);
        setSelectedStore(parsed.store);
      } catch (error) {
        console.error('Error parsing saved location:', error);
        localStorage.removeItem('confirmedLocation');
      }
    }
  }, []);

  // Save location to localStorage when confirmed
  useEffect(() => {
    if (confirmedLocation) {
      localStorage.setItem('confirmedLocation', JSON.stringify(confirmedLocation));
    }
  }, [confirmedLocation]);

  // Check if location is set
  const isLocationSet = !!confirmedLocation;

  // Open pincode selection modal
  const openPincodeModal = () => {
    setIsPincodeModalOpen(true);
    setServiceabilityError(null);
  };

  // Close pincode selection modal
  const closePincodeModal = () => {
    setIsPincodeModalOpen(false);
    setServiceabilityError(null);
  };

  // Handle pincode selection
  const handlePincodeSelect = async (pincode) => {
    setSelectedPincode(pincode);
    setIsCheckingServiceability(true);
    setServiceabilityError(null);

    try {
      const response = await checkPincodeServiceability(pincode.pincode);
      
      if (response.success && response.data) {
        // Pincode is serviceable, proceed to store selection
        closePincodeModal();
        setIsStoreModalOpen(true);
      } else {
        // Pincode is not serviceable
        setServiceabilityError('Sorry, we do not deliver to this location yet. Please try a different pincode.');
      }
    } catch (error) {
      console.error('Error checking serviceability:', error);
      // For demo purposes, allow all pincodes to proceed
      console.log('🚨 API unavailable, allowing pincode selection for demo');
      closePincodeModal();
      setIsStoreModalOpen(true);
    } finally {
      setIsCheckingServiceability(false);
    }
  };

  // Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setIsStoreModalOpen(false);
    setIsStoreDetailsModalOpen(true);
  };

  // Close store selection modal
  const closeStoreModal = () => {
    setIsStoreModalOpen(false);
  };

  // Handle final confirmation
  const handleConfirmLocation = (locationData) => {
    setConfirmedLocation(locationData);
    setSelectedPincode(locationData.pincode);
    setSelectedStore(locationData.store);
    setIsStoreDetailsModalOpen(false);
  };

  // Close store details modal
  const closeStoreDetailsModal = () => {
    setIsStoreDetailsModalOpen(false);
  };

  // Reset location selection
  const resetLocation = () => {
    setSelectedPincode(null);
    setSelectedStore(null);
    setConfirmedLocation(null);
    setServiceabilityError(null);
    localStorage.removeItem('confirmedLocation');
  };

  // Get display text for header
  const getLocationDisplayText = () => {
    if (!confirmedLocation) return 'Select Location';
    
    const { pincode } = confirmedLocation;
    return pincode.pincode;
  };

  // Get store display text for header
  const getStoreDisplayText = () => {
    if (!confirmedLocation?.store) return '';
    return confirmedLocation.store.storeName;
  };

  // Get full address for display
  const getFullAddress = () => {
    if (!confirmedLocation) return '';
    const { pincode, store } = confirmedLocation;
    return store ? store.storeName : `${pincode.pincode}, India`;
  };

  // Check if current location is serviceable (for API calls)
  const isCurrentLocationServiceable = () => {
    return !!confirmedLocation;
  };

  // Get current pincode for API calls
  const getCurrentPincode = () => {
    return confirmedLocation?.pincode?.pincode || null;
  };

  // Get current store code for API calls
  const getCurrentStoreCode = () => {
    return confirmedLocation?.store?.storeCode || null;
  };

  const value = {
    // Modal states
    isPincodeModalOpen,
    isStoreModalOpen,
    isStoreDetailsModalOpen,
    
    // Selection states
    selectedPincode,
    selectedStore,
    confirmedLocation,
    
    // Serviceability states
    isCheckingServiceability,
    serviceabilityError,
    
    // Location status
    isLocationSet,
    
    // Modal controls
    openPincodeModal,
    closePincodeModal,
    closeStoreModal,
    closeStoreDetailsModal,
    
    // Selection handlers
    handlePincodeSelect,
    handleStoreSelect,
    handleConfirmLocation,
    
    // Utility functions
    resetLocation,
    getLocationDisplayText,
    getStoreDisplayText,
    getFullAddress,
    isCurrentLocationServiceable,
    getCurrentPincode,
    getCurrentStoreCode,
  };

  return (
    <PincodeContext.Provider value={value}>
      {children}
    </PincodeContext.Provider>
  );
};

export default PincodeContext;