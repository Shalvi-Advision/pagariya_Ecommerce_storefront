// Address CRUD API service functions
import { APP_CONSTANTS } from '../constants';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

// Helper to get store_code from localStorage
const getStoreCode = () => {
  try {
    const locationData = localStorage.getItem('confirmedLocation');
    if (locationData) {
      const location = JSON.parse(locationData);
      // Try both storeCode and store_code (for backwards compatibility)
      return location?.store?.storeCode || location?.store?.store_code;
    }
  } catch (error) {
    console.error('Failed to get store_code from localStorage:', error);
  }
  // Return null to indicate no store code is available
  // This will cause the API call to fail gracefully with a proper error message
  return null;
};

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Helper to get mobile number from user data
const getMobileNumber = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user?.mobile || user?.phone || user?.mobile_number || '';
    }
  } catch (error) {
    console.warn('Failed to get mobile number:', error);
  }
  return '';
};

const resolveEmailId = (email) => {
  if (email && String(email).trim()) return String(email).trim();
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      if (user?.email) return String(user.email).trim();
    }
  } catch (_) { /* ignore */ }
  const mobile = getMobileNumber();
  if (mobile) return `${mobile}@pagariyamart.local`;
  return 'customer@pagariyamart.local';
};

/**
 * Get all addresses for the authenticated user
 * @returns {Promise<Object>} - Address list response
 */
export const getAddresses = async () => {
  try {
    const storeCode = getStoreCode();
    
    // Validate that store code exists in localStorage
    if (!storeCode) {
      const error = new Error('Store code not found. Please select a location first.');
      error.code = 'STORE_CODE_MISSING';
      console.error('❌ Store code validation failed:', error);
      throw error;
    }
    
    const projectCode = APP_CONSTANTS.PROJECT_CODE;
    const token = getAuthToken();

    const url = `${API_BASE_URL}/address-crud/get-addresses`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        store_code: storeCode,
        project_code: projectCode
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch addresses: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug: Log the addresses to see their IDs
    if (data.success && data.data) {
      console.log('📋 Loaded Addresses:', data.data.map(addr => ({
        id: addr.id,
        idaddress_book: addr.idaddress_book,
        full_name: addr.full_name,
        is_default: addr.is_default
      })));
      
      // Also log the first address in detail to see all available fields
      if (data.data.length > 0) {
        console.log('📝 First Address Details:', data.data[0]);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
};

/**
 * Add a new address
 * @param {Object} addressData - Address details
 * @returns {Promise<Object>} - Add address response
 */
export const addAddress = async (addressData) => {
  try {
    const storeCode = getStoreCode();
    
    // Validate that store code exists in localStorage
    if (!storeCode) {
      const error = new Error('Store code not found. Please select a location first.');
      error.code = 'STORE_CODE_MISSING';
      console.error('❌ Store code validation failed:', error);
      throw error;
    }
    
    const projectCode = APP_CONSTANTS.PROJECT_CODE;
    const token = getAuthToken();

    const url = `${API_BASE_URL}/address-crud/add-address`;
    
    const requestBody = {
      store_code: storeCode,
      project_code: projectCode,
      full_name: addressData.full_name,
      email_id: addressData.email_id || '',
      delivery_addr_line_1: addressData.delivery_addr_line_1,
      delivery_addr_line_2: addressData.delivery_addr_line_2 || '',
      delivery_addr_city: addressData.delivery_addr_city,
      delivery_addr_pincode: addressData.delivery_addr_pincode,
      is_default: addressData.is_default ? 'Yes' : 'No',
      latitude: addressData.latitude || '',
      longitude: addressData.longitude || '',
      area_id: addressData.area_id || ''
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to add address: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
};

/**
 * Helper function to update address with specific ID
 * @param {string} addressId - Address ID
 * @param {Object} addressData - Updated address details
 * @param {string} storeCode - Store code
 * @param {string} projectCode - Project code
 * @param {string} token - Auth token
 * @returns {Promise<Object>} - Update address response
 */
const updateAddressWithId = async (addressId, addressData, storeCode, projectCode, token) => {
  const url = `${API_BASE_URL}/address-crud/update-address/${addressId}`;
  
  // Debug: Log the exact URL being constructed
  console.log('🌐 updateAddressWithId URL Construction:', {
    API_BASE_URL,
    endpoint: '/address-crud/update-address/',
    addressId: addressId,
    fullUrl: url,
    addressIdType: typeof addressId
  });
  
  const requestBody = {
    store_code: storeCode,
    project_code: projectCode,
    full_name: addressData.full_name,
    email_id: addressData.email_id || '',
    delivery_addr_line_1: addressData.delivery_addr_line_1,
    delivery_addr_line_2: addressData.delivery_addr_line_2 || '',
    delivery_addr_city: addressData.delivery_addr_city,
    delivery_addr_pincode: addressData.delivery_addr_pincode,
    is_default: addressData.is_default ? 'Yes' : 'No',
    latitude: addressData.latitude || '',
    longitude: addressData.longitude || '',
    area_id: addressData.area_id || ''
  };

  console.log('🔄 Retry with ID:', { 
    url, 
    addressId, 
    addressIdType: typeof addressId,
    requestBody,
    storeCode,
    projectCode,
    hasToken: !!token,
    tokenLength: token ? token.length : 0
  });

  console.log('🌐 Making API request:', {
    url,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: requestBody
  });

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorData = {};
    try {
      errorData = JSON.parse(responseText);
    } catch (e) {
      console.error('Could not parse error response as JSON');
    }
    
    console.error('❌ updateAddressWithId failed:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      addressId: addressId,
      errorData: errorData,
      responseText: responseText,
      requestBody: requestBody
    });
    
    const errorMessage = errorData.message || errorData.error || responseText || `Failed to update address: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
};

/**
 * Update an existing address
 * @param {string} addressId - Address ID
 * @param {Object} addressData - Updated address details
 * @returns {Promise<Object>} - Update address response
 */
export const updateAddress = async (addressId, addressData) => {
  try {
    const storeCode = getStoreCode();
    
    // Validate that store code exists in localStorage
    if (!storeCode) {
      const error = new Error('Store code not found. Please select a location first.');
      error.code = 'STORE_CODE_MISSING';
      console.error('❌ Store code validation failed:', error);
      throw error;
    }
    
    const projectCode = APP_CONSTANTS.PROJECT_CODE;
    const token = getAuthToken();

    // Try the provided ID first
    const apiAddressId = addressId;
    const url = `${API_BASE_URL}/address-crud/update-address/${apiAddressId}`;
    
    // Debug: Also log the exact URL being constructed
    console.log('🌐 API URL Construction:', {
      API_BASE_URL,
      endpoint: '/address-crud/update-address/',
      addressId: apiAddressId,
      fullUrl: url
    });
    
    // Debug: Log what we're trying
    console.log('🔍 Update Address - Trying with ID:', {
      providedId: addressId,
      apiAddressId: apiAddressId,
      url: url,
      method: 'PUT',
      addressData: addressData,
      storeCode: storeCode,
      projectCode: projectCode,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
    
    const requestBody = {
      store_code: storeCode,
      project_code: projectCode,
      full_name: addressData.full_name,
      email_id: addressData.email_id || '',
      delivery_addr_line_1: addressData.delivery_addr_line_1,
      delivery_addr_line_2: addressData.delivery_addr_line_2 || '',
      delivery_addr_city: addressData.delivery_addr_city,
      delivery_addr_pincode: addressData.delivery_addr_pincode,
      is_default: addressData.is_default ? 'Yes' : 'No',
      latitude: addressData.latitude || '',
      longitude: addressData.longitude || '',
      area_id: addressData.area_id || ''
    };

    console.log('🔍 Update Address Request:', { 
      url, 
      addressId: apiAddressId,
      addressIdType: typeof addressId,
      addressIdValue: addressId,
      storeCode,
      projectCode,
      requestBody 
    });

    console.log('🌐 Making API request:', {
      url,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: requestBody
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Update Address Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Try to get response text first
    const responseText = await response.text();
    console.log('Raw Response:', responseText);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
      
      console.error('Update Address API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        responseText,
        requestBody,
        url,
        addressId: apiAddressId
      });
      
      // Check if it's a 404 (Resource not found)
      if (response.status === 404) {
        console.log('🔄 404 Error - Available IDs for fallback:', {
          currentId: addressId,
          idaddress_book: addressData.idaddress_book,
          mongoId: addressData.mongoId,
          addressData: addressData
        });
        
        // Try with idaddress_book if we have it and the current ID is not idaddress_book
        if (addressData.idaddress_book && addressData.idaddress_book !== addressId) {
          console.log('🔄 404 Error - Trying with idaddress_book:', addressData.idaddress_book);
          return await updateAddressWithId(addressData.idaddress_book, addressData, storeCode, projectCode, token);
        }
        // Try with MongoDB ID if we have it and the current ID is not MongoDB ID
        if (addressData.mongoId && addressData.mongoId !== addressId) {
          console.log('🔄 404 Error - Trying with MongoDB ID:', addressData.mongoId);
          return await updateAddressWithId(addressData.mongoId, addressData, storeCode, projectCode, token);
        }
        throw new Error(`Address not found. Please check if the address ID (${apiAddressId}) is correct.`);
      }
      
      const errorMessage = errorData.message || errorData.error || responseText || `Failed to update address: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Could not parse success response as JSON');
      throw new Error('Invalid response format from server');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating address:', error);
    console.error('Request details:', { addressId, addressData });
    throw error;
  }
};

/**
 * Delete an address
 * @param {string} addressId - Address ID
 * @returns {Promise<Object>} - Delete address response
 */
export const deleteAddress = async (addressId) => {
  try {
    const storeCode = getStoreCode();
    
    // Validate that store code exists in localStorage
    if (!storeCode) {
      const error = new Error('Store code not found. Please select a location first.');
      error.code = 'STORE_CODE_MISSING';
      console.error('❌ Store code validation failed:', error);
      throw error;
    }
    
    const projectCode = APP_CONSTANTS.PROJECT_CODE;
    const token = getAuthToken();

    // IMPORTANT: Use idaddress_book for the API, not MongoDB id
    const apiAddressId = addressId;
    const url = `${API_BASE_URL}/address-crud/delete-address/${apiAddressId}`;
    
    console.log('🗑️ Delete Address Request:', { url, addressId: apiAddressId });
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        store_code: storeCode,
        project_code: projectCode
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete address: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

/**
 * Set an address as default
 * @param {string} addressId - Address ID to set as default
 * @param {Object} addressData - Complete address data
 * @returns {Promise<Object>} - Update response
 */
export const setDefaultAddress = async (addressId, addressData) => {
  try {
    // Use the update API to set is_default to "Yes"
    return await updateAddress(addressId, {
      ...addressData,
      is_default: true
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};

/**
 * Transform API address data to UI format
 * @param {Object} apiAddress - Address from API
 * @returns {Object} - Address in UI format
 */
export const transformAddressFromAPI = (apiAddress) => {
  return {
    // Use MongoDB ID for API operations (URL parameter)
    id: apiAddress.id || apiAddress._id || apiAddress.idaddress_book,
    mongoId: apiAddress.id || apiAddress._id, // Keep MongoDB ID for reference
    idaddress_book: apiAddress.idaddress_book,
    name: apiAddress.full_name,
    email: apiAddress.email_id,
    addressLine1: apiAddress.delivery_addr_line_1,
    addressLine2: apiAddress.delivery_addr_line_2,
    city: apiAddress.delivery_addr_city,
    pinCode: apiAddress.delivery_addr_pincode,
    isDefault: apiAddress.is_default === 'Yes',
    latitude: apiAddress.latitude,
    longitude: apiAddress.longitude,
    area_id: apiAddress.area_id
  };
};

/**
 * Transform UI address data to API format
 * @param {Object} uiAddress - Address from UI
 * @returns {Object} - Address in API format
 */
export const transformAddressToAPI = (uiAddress) => {
  return {
    full_name: uiAddress.name,
    email_id: resolveEmailId(uiAddress.email),
    delivery_addr_line_1: uiAddress.addressLine1,
    delivery_addr_line_2: uiAddress.addressLine2 || '',
    delivery_addr_city: uiAddress.city,
    delivery_addr_pincode: uiAddress.pinCode,
    is_default: uiAddress.isDefault,
    latitude: uiAddress.latitude || '',
    longitude: uiAddress.longitude || '',
    area_id: uiAddress.area_id || ''
  };
};

