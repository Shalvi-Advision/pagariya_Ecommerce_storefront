import { APP_CONSTANTS } from '../constants';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

/**
 * Calculate delivery charges based on address coordinates and store.
 * @param {object} params
 * @param {string} params.store_code - Store code
 * @param {number|string} params.address_latitude - Delivery address latitude
 * @param {number|string} params.address_longitude - Delivery address longitude
 * @param {number} params.order_amount - Cart total amount
 * @returns {Promise<object>} Delivery charge data
 */
export const calculateDeliveryCharges = async ({
  store_code,
  address_latitude,
  address_longitude,
  order_amount = 0
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/delivery-charges/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        store_code,
        address_latitude: String(address_latitude),
        address_longitude: String(address_longitude),
        order_amount
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.warn('Delivery charges API error:', data.error || data.message);
      return {
        success: false,
        data: {
          delivery_available: true,
          distance_km: 0,
          duration_minutes: 0,
          is_road_distance: false,
          delivery_charge: 0,
          free_delivery: true,
          reason: 'Unable to calculate delivery charges'
        }
      };
    }

    return data;
  } catch (error) {
    console.error('Failed to calculate delivery charges:', error);
    // Default to free delivery on error
    return {
      success: false,
      data: {
        delivery_available: true,
        distance_km: 0,
        duration_minutes: 0,
        is_road_distance: false,
        delivery_charge: 0,
        free_delivery: true,
        reason: 'Network error - defaulting to free delivery'
      }
    };
  }
};
