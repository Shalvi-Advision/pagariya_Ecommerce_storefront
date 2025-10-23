import React, { useEffect } from 'react';
import { usePincode } from '../context/PincodeContext';
import LoadingScreen from './LoadingScreen';

const LocationGuard = ({ children }) => {
  const { 
    confirmedLocation, 
    isPincodeModalOpen, 
    isStoreModalOpen, 
    isStoreDetailsModalOpen,
    isLocationRequired,
    openPincodeModal
  } = usePincode();
  
  // If location is required but no modals are open, reopen the pincode modal
  useEffect(() => {
    if (isLocationRequired && !confirmedLocation && !isPincodeModalOpen && !isStoreModalOpen && !isStoreDetailsModalOpen) {
      openPincodeModal();
    }
  }, [isLocationRequired, confirmedLocation, isPincodeModalOpen, isStoreModalOpen, isStoreDetailsModalOpen, openPincodeModal]);
  
  // Show loading screen while any location modal is open
  if (!confirmedLocation && (isPincodeModalOpen || isStoreModalOpen || isStoreDetailsModalOpen)) {
    return <LoadingScreen message="Please select your location to continue" />;
  }
  
  // If no location and no modals open, show loading while we reopen modal
  if (!confirmedLocation) {
    return <LoadingScreen message="Loading..." />;
  }
  
  return children;
};

export default LocationGuard;