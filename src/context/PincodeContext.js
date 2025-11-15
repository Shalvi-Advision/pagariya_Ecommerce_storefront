import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  // Mandatory location states
  const [isLocationRequired, setIsLocationRequired] = useState(false);
  const [hasCheckedInitialLocation, setHasCheckedInitialLocation] = useState(false);

  // Loading and error states for better reactivity
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [isLoadingPincodes, setIsLoadingPincodes] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [serviceabilityError, setServiceabilityError] = useState(null);
  const [pincodesError, setPincodesError] = useState(null);
  const [storesError, setStoresError] = useState(null);

  // Cache states for better UX
  const [pincodesList, setPincodesList] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);

  // Sync state with localStorage helper
  const syncWithLocalStorage = useCallback(() => {
    if (confirmedLocation) {
      localStorage.setItem('confirmedLocation', JSON.stringify(confirmedLocation));
      // Dispatch custom event to notify components of location change
      window.dispatchEvent(new CustomEvent('locationUpdated', {
        detail: confirmedLocation
      }));
    }
  }, [confirmedLocation]);

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

  // Check if location is required on mount
  useEffect(() => {
    if (!hasCheckedInitialLocation) {
      setHasCheckedInitialLocation(true);
    }
  }, [hasCheckedInitialLocation]);

  // Check if location is required after initial load
  useEffect(() => {
    if (hasCheckedInitialLocation && !confirmedLocation) {
      setIsLocationRequired(true);
      setIsPincodeModalOpen(true);
    }
  }, [hasCheckedInitialLocation, confirmedLocation]);

  // Sync with localStorage whenever confirmedLocation changes
  useEffect(() => {
    syncWithLocalStorage();
  }, [syncWithLocalStorage]);

  // Load enabled pincodes
  const loadPincodes = async () => {
    setIsLoadingPincodes(true);
    setPincodesError(null);
    try {
      const { getAllPincodes, formatPincodeData } = await import('../api/pincodeService');
      const response = await getAllPincodes();

      if (response.success && response.data) {
        const formattedPincodes = response.data.map(formatPincodeData);
        setPincodesList(formattedPincodes);
      } else {
        setPincodesError('Failed to load pincodes');
      }
    } catch (error) {
      console.error('Error loading pincodes:', error);
      setPincodesError('Unable to load pincodes. Please try again.');
    } finally {
      setIsLoadingPincodes(false);
    }
  };

  // Load stores for a pincode
  const loadStores = async (pincode) => {
    console.log('🔄 Loading stores for pincode:', pincode);
    setIsLoadingStores(true);
    setStoresError(null);
    try {
      const { getPincodeStores, formatStoreData } = await import('../api/pincodeService');
      const response = await getPincodeStores(pincode);
      
      console.log('📦 API Response for stores:', response);

      if (response.success && response.data) {
        // Format all stores regardless of is_enabled status
        const formattedStores = response.data.map(formatStoreData);
        console.log('✅ Formatted stores (all stores, including disabled):', formattedStores);
        console.log('✅ Total stores to display:', formattedStores.length);
        // Set all stores without filtering - show both enabled and disabled stores
        setAvailableStores(formattedStores);
      } else {
        console.log('❌ No stores found or API error:', response);
        setStoresError(response.message || 'No stores found for this pincode');
        setAvailableStores([]);
      }
    } catch (error) {
      console.error('❌ Error loading stores:', error);
      setStoresError('Failed to load stores. Please try again.');
      setAvailableStores([]);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Check if location is set
  const isLocationSet = !!confirmedLocation;

  // Get store code for API calls
  const getStoreCodeForAPI = () => {
    return confirmedLocation?.store?.store_code || null;
  };

  // Open pincode selection modal
  const openPincodeModal = () => {
    setIsPincodeModalOpen(true);
    setServiceabilityError(null);
    // Don't load pincodes automatically - let user enter pincode first
  };

  // Close pincode selection modal
  const closePincodeModal = () => {
    if (!isLocationRequired) {
      setIsPincodeModalOpen(false);
      setServiceabilityError(null);
    }
  };

  // Handle pincode selection
  const handlePincodeSelect = async (pincode) => {
    console.log('🎯 Handling pincode selection:', pincode);
    setSelectedPincode(pincode);
    setIsCheckingServiceability(true);
    setServiceabilityError(null);

    try {
      const { checkPincodeServiceability } = await import('../api/pincodeService');
      const response = await checkPincodeServiceability(pincode.pincode);
      
      console.log('🔍 Serviceability check response:', response);

      if (response.success && response.available) {
        // Pincode is serviceable, proceed to store selection
        console.log('✅ Pincode is serviceable, opening store modal');
        closePincodeModal();
        setIsStoreModalOpen(true);
        // Load stores for the selected pincode
        loadStores(pincode.pincode);
      } else {
        // Pincode is not serviceable - load available pincodes for user to choose from
        console.log('❌ Pincode not serviceable, loading alternatives');
        setServiceabilityError(response.message || 'Sorry, we do not deliver to this location yet. Please select from available pincodes below.');
        // Load available pincodes to show alternatives
        loadPincodes();
      }
    } catch (error) {
      console.error('❌ Error checking serviceability:', error);
      setServiceabilityError('Unable to verify pincode. Please try again.');
    } finally {
      setIsCheckingServiceability(false);
    }
  };

  // Handle store selection
  const handleStoreSelect = (store) => {
    console.log('🏪 Store selected in PincodeContext:', store);
    setSelectedStore(store);
    setIsStoreModalOpen(false);
    setIsStoreDetailsModalOpen(true);
  };

  // Close store selection modal
  const closeStoreModal = () => {
    if (!isLocationRequired) {
      setIsStoreModalOpen(false);
    }
  };

  // Handle final confirmation
  const handleConfirmLocation = (locationData) => {
    // Validate storeCode exists
    if (!locationData.store?.storeCode && !locationData.store?.store_code) {
      console.error('Store code missing!', locationData.store);
      return;
    }

    setConfirmedLocation(locationData);
    setSelectedPincode(locationData.pincode);
    setSelectedStore(locationData.store);
    setIsStoreDetailsModalOpen(false);
    setIsLocationRequired(false); // Allow app access
  };

  // Close store details modal
  const closeStoreDetailsModal = () => {
    if (!isLocationRequired) {
      setIsStoreDetailsModalOpen(false);
    }
  };

  // Reset location selection
  const resetLocation = () => {
    setSelectedPincode(null);
    setSelectedStore(null);
    setConfirmedLocation(null);
    setServiceabilityError(null);
    localStorage.removeItem('confirmedLocation');
    setIsLocationRequired(true);
    setIsPincodeModalOpen(true);
    // Dispatch event to notify components of location reset
    window.dispatchEvent(new CustomEvent('locationUpdated', {
      detail: null
    }));
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
    return confirmedLocation?.store?.storeCode || confirmedLocation?.store?.store_code || null;
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

    // Mandatory location states
    isLocationRequired,
    hasCheckedInitialLocation,

    // Loading states
    isCheckingServiceability,
    isLoadingPincodes,
    isLoadingStores,

    // Error states
    serviceabilityError,
    pincodesError,
    storesError,

    // Cache states
    pincodesList,
    availableStores,

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

    // Data loading functions
    loadPincodes,
    loadStores,

    // Utility functions
    resetLocation,
    getLocationDisplayText,
    getStoreDisplayText,
    getFullAddress,
    isCurrentLocationServiceable,
    getCurrentPincode,
    getCurrentStoreCode,
    getStoreCodeForAPI,
  };

  return (
    <PincodeContext.Provider value={value}>
      {children}
    </PincodeContext.Provider>
  );
};

export default PincodeContext;