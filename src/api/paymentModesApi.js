// Payment Modes API service functions
import { APP_CONSTANTS } from '../constants';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

// Helper to get store_code from localStorage
const getStoreCode = () => {
  try {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      const location = JSON.parse(locationData);
      return location?.store?.store_code || APP_CONSTANTS.DEFAULT_STORE_CODE;
    }
  } catch (error) {
    console.warn('Failed to get store_code:', error);
  }
  return APP_CONSTANTS.DEFAULT_STORE_CODE;
};

/**
 * Get payment modes from API
 * @returns {Promise<Object>} - Payment modes response
 */
export const getPaymentModes = async () => {
  try {
    const storeCode = getStoreCode();
    const projectCode = APP_CONSTANTS.PROJECT_CODE;

    const url = `${API_BASE_URL}/payment-modes/get-payment-modes`;
    const requestBody = {
      store_code: storeCode,
      project_code: projectCode
    };

    console.log('💳 Calling payment modes API:', {
      url,
      store_code: storeCode,
      project_code: projectCode
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('💳 Payment modes API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Payment modes API error:', errorText);
      throw new Error(`Failed to fetch payment modes: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Payment modes API response data:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching payment modes:', error);
    throw error;
  }
};

/**
 * Transform API payment mode data to UI format
 * @param {Object} apiPaymentMode - Payment mode from API
 * @returns {Object} - Payment mode in UI format
 */
export const transformPaymentModeFromAPI = (apiPaymentMode) => {
  return {
    id: apiPaymentMode.id,
    idpayment_mode: apiPaymentMode.idpayment_mode,
    name: apiPaymentMode.payment_mode_name,
    isEnabled: apiPaymentMode.is_enabled === 'Yes'
  };
};

/**
 * Map API payment mode names to UI payment method identifiers
 * @param {string} apiPaymentModeName - Payment mode name from API
 * @returns {string|null} - UI payment method identifier or null if no match
 */
export const mapPaymentModeToUI = (apiPaymentModeName) => {
  const modeMap = {
    'POD': 'cod', // Cash on Delivery
    'Online Payment': 'card', // Card payment
    'Bank Transfer': 'netbanking',
    'Redeem Points': 'points', // Not implemented yet
  };
  
  return modeMap[apiPaymentModeName] || null;
};

/**
 * Get enabled payment modes from API
 * @returns {Promise<Array>} - Array of enabled payment modes
 */
export const getEnabledPaymentModes = async () => {
  try {
    const response = await getPaymentModes();
    
    if (response.success && response.data && response.data.length > 0) {
      // Transform and filter enabled payment modes
      const enabledModes = response.data
        .map(transformPaymentModeFromAPI)
        .filter(mode => mode.isEnabled);
      
      console.log('✅ Enabled payment modes:', enabledModes);
      return enabledModes;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching enabled payment modes:', error);
    return [];
  }
};

