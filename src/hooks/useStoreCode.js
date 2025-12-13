/**
 * Custom hook for managing store code and location data with 30-day caching
 */
import { useCallback, useEffect, useState } from 'react';
import { StoreCodeStorage } from '../services/secureStorage';

export const useStoreCode = () => {
    const [storeCode, setStoreCodeState] = useState(null);
    const [locationData, setLocationDataState] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load store code and location on mount
    useEffect(() => {
        const loadStoreCode = () => {
            const code = StoreCodeStorage.getStoreCode();
            const location = StoreCodeStorage.getLocationData();

            setStoreCodeState(code);
            setLocationDataState(location);
            setIsLoading(false);

            console.log('📍 Loaded store code from cache:', code);
            if (location) {
                console.log('📍 Loaded location data from cache:', location);
            }
        };

        loadStoreCode();
    }, []);

    /**
     * Set store code and location data with 30-day expiration
     * @param {string} code - Store code
     * @param {object} location - Full location data (optional)
     */
    const setStoreCode = useCallback((code, location = null) => {
        StoreCodeStorage.setStoreCode(code, location);
        setStoreCodeState(code);
        setLocationDataState(location);

        console.log('✅ Store code cached for 30 days:', code);
    }, []);

    /**
     * Clear store code and location data
     */
    const clearStoreCode = useCallback(() => {
        StoreCodeStorage.clearStoreCode();
        setStoreCodeState(null);
        setLocationDataState(null);

        console.log('🗑️ Store code cleared from cache');
    }, []);

    /**
     * Check if store code is valid (exists and not expired)
     */
    const hasValidStoreCode = useCallback(() => {
        return StoreCodeStorage.hasValidStoreCode();
    }, []);

    /**
     * Get days until store code expires
     */
    const getDaysUntilExpiry = useCallback(() => {
        return StoreCodeStorage.getDaysUntilExpiry();
    }, []);

    return {
        storeCode,
        locationData,
        isLoading,
        setStoreCode,
        clearStoreCode,
        hasValidStoreCode,
        getDaysUntilExpiry,
    };
};

export default useStoreCode;
