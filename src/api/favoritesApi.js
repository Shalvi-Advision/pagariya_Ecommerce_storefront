import { apiPost } from '../services/api';
import { APP_CONSTANTS } from '../constants';
import { getStoredToken } from '../services/api';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;
const PROJECT_CODE = APP_CONSTANTS.PROJECT_CODE;

/**
 * Get store code from localStorage
 */
const getStoreCode = () => {
  const locationData = localStorage.getItem('confirmedLocation');
  if (locationData) {
    try {
      const location = JSON.parse(locationData);
      return location?.store?.store_code || location?.store?.storeCode || APP_CONSTANTS.DEFAULT_STORE_CODE;
    } catch (error) {
      console.error('Error parsing location data:', error);
      return APP_CONSTANTS.DEFAULT_STORE_CODE;
    }
  }
  return APP_CONSTANTS.DEFAULT_STORE_CODE;
};

/**
 * Add a product to favorites
 * @param {string} p_code - Product code
 * @returns {Promise<Object>} API response
 */
export const addToFavorites = async (p_code) => {
  try {
    const store_code = getStoreCode();
    
    const requestBody = {
      store_code,
      project_code: PROJECT_CODE,
      p_code
    };

    console.log('🔗 Adding to favorites:', requestBody);

    const response = await apiPost('/favorites/add-to-favorites', requestBody);
    
    console.log('✅ Add to favorites response:', response);
    
    return response;
  } catch (error) {
    console.error('❌ Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Remove a product from favorites
 * @param {string} p_code - Product code
 * @returns {Promise<Object>} API response
 */
export const removeFromFavorites = async (p_code) => {
  try {
    const store_code = getStoreCode();
    
    const requestBody = {
      store_code,
      project_code: PROJECT_CODE,
      p_code
    };

    console.log('🔗 Removing from favorites:', requestBody);

    const response = await apiPost('/favorites/remove-from-favorites', requestBody);
    
    console.log('✅ Remove from favorites response:', response);
    
    return response;
  } catch (error) {
    console.error('❌ Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Get all favorites for the current user
 * @returns {Promise<Object>} API response with favorites list
 */
export const getFavorites = async () => {
  try {
    const store_code = getStoreCode();
    
    const requestBody = {
      store_code,
      project_code: PROJECT_CODE
    };

    console.log('🔗 Getting favorites:', requestBody);

    const response = await apiPost('/favorites/get-favorites', requestBody);
    
    console.log('✅ Get favorites response:', response);
    
    return response;
  } catch (error) {
    console.error('❌ Error getting favorites:', error);
    throw error;
  }
};

export default {
  addToFavorites,
  removeFromFavorites,
  getFavorites
};

