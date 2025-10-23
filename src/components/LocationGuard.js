import React from 'react';
import { usePincode } from '../context/PincodeContext';
import LoadingScreen from './LoadingScreen';

const LocationGuard = ({ children }) => {
  const { confirmedLocation, isPincodeModalOpen, isStoreModalOpen, isStoreDetailsModalOpen } = usePincode();

  // Show loading screen while any location modal is open
  if (!confirmedLocation && (isPincodeModalOpen || isStoreModalOpen || isStoreDetailsModalOpen)) {
    return <LoadingScreen message="Please select your location to continue" />;
  }

  // If no location and no modals open, something went wrong - show loading
  if (!confirmedLocation) {
    return <LoadingScreen message="Loading..." />;
  }

  return children;
};

export default LocationGuard;
