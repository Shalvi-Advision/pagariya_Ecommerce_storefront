// Delivery Slots API service functions
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

/**
 * Get delivery slots from API
 * @returns {Promise<Object>} - Delivery slots response
 */
export const getDeliverySlots = async () => {
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

    const url = `${API_BASE_URL}/delivery-slots/get-delivery-slots`;
    const requestBody = {
      store_code: storeCode,
      project_code: projectCode
    };

    console.log('📞 Calling delivery slots API:', {
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

    console.log('📥 Delivery slots API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Delivery slots API error:', errorText);
      throw new Error(`Failed to fetch delivery slots: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Delivery slots API response data:', data);

    return data;
  } catch (error) {
    console.error('❌ Error fetching delivery slots:', error);
    throw error;
  }
};

/**
 * Transform API delivery slot data to UI format
 * @param {Object} apiSlot - Delivery slot from API
 * @returns {Object} - Delivery slot in UI format
 */
export const transformDeliverySlotFromAPI = (apiSlot) => {
  return {
    id: apiSlot.id,
    iddelivery_slot: apiSlot.iddelivery_slot,
    slotFrom: apiSlot.delivery_slot_from,
    slotTo: apiSlot.delivery_slot_to,
    storeCode: apiSlot.store_code,
    isActive: apiSlot.is_active === 'yes'
  };
};

/**
 * Convert time string (HH:MM:SS) to time string (HH:MM AM/PM)
 * @param {string} timeString - Time in HH:MM:SS format
 * @returns {string} - Time in HH:MM AM/PM format
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const minute = minutes || '00';

  if (hour === 0) {
    return `12:${minute} AM`;
  } else if (hour < 12) {
    return `${hour}:${minute} AM`;
  } else if (hour === 12) {
    return `12:${minute} PM`;
  } else {
    return `${hour - 12}:${minute} PM`;
  }
};

/**
 * Generate time slots from API delivery slot data
 * @param {Array} apiSlots - Array of delivery slots from API
 * @returns {Array} - Array of formatted time slots
 */
export const generateTimeSlotsFromAPI = (apiSlots) => {
  if (!apiSlots || apiSlots.length === 0) {
    // Return empty array if no API data - no fallback slots
    return [];
  }

  const today = new Date();
  const timeSlots = [];
  let slotId = 1;

  // Generate slots for next 2 days
  for (let i = 1; i <= 2; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const day = targetDate.getDate();
    const month = targetDate.toLocaleDateString('en-US', { month: 'long' });
    const year = targetDate.getFullYear();

    const dateString = `${dayName} ${day}-${month}-${year}`;

    // Use all active slots from API directly
    const activeSlots = apiSlots.filter(slot => slot.isActive);

    let slotsForDate = [];

    if (activeSlots.length > 0) {
      // Map API slots directly to UI format
      slotsForDate = activeSlots.map(slot => ({
        id: slotId++,
        time: `${formatTime(slot.slotFrom)} - ${formatTime(slot.slotTo)}`,
        available: true,
        deliverySlotId: slot.iddelivery_slot
      }));
    } else {
      // No active slots found
      slotsForDate = [];
    }

    timeSlots.push({
      date: dateString,
      slots: slotsForDate
    });
  }

  return timeSlots;
};

/**
 * Generate default time slots when API data is not available
 * @returns {Array} - Default time slots
 */
export const generateDefaultTimeSlots = () => {
  const today = new Date();
  const timeSlots = [];
  let slotId = 1;

  for (let i = 1; i <= 2; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const day = targetDate.getDate();
    const month = targetDate.toLocaleDateString('en-US', { month: 'long' });
    const year = targetDate.getFullYear();

    const dateString = `${dayName} ${day}-${month}-${year}`;

    const availableSlots = [
      { time: '07:00 AM - 10:00 AM', available: true },
      { time: '10:00 AM - 12:30 PM', available: true },
      { time: '11:00 AM - 02:00 PM', available: Math.random() > 0.2 },
      { time: '12:00 PM - 03:00 PM', available: true },
      { time: '02:00 PM - 05:00 PM', available: true },
      { time: '04:30 PM - 07:30 PM', available: Math.random() > 0.1 },
      { time: '07:30 PM - 10:00 PM', available: true },
      { time: '08:00 PM - 11:00 PM', available: Math.random() > 0.15 }
    ];

    timeSlots.push({
      date: dateString,
      slots: availableSlots.map(slot => ({
        id: slotId++,
        time: slot.time,
        available: slot.available
      }))
    });
  }

  return timeSlots;
};

/**
 * Generate time slots for a given time range
 * @param {string} fromTime - Start time in HH:MM:SS format
 * @param {string} toTime - End time in HH:MM:SS format
 * @param {number} startSlotId - Starting slot ID
 * @param {number|string} deliverySlotId - Delivery slot ID from API (iddelivery_slot)
 * @returns {Array} - Array of time slots
 */
const generateSlotsForTimeRange = (fromTime, toTime, startSlotId, deliverySlotId = null) => {
  const slots = [];
  let currentSlotId = startSlotId;

  // Parse from and to times
  const [fromHour, fromMin] = fromTime.split(':').map(Number);
  const [toHour, toMin] = toTime.split(':').map(Number);

  let currentHour = fromHour;
  let currentMin = fromMin;

  // Generate slots in 2-3 hour intervals
  while (currentHour < toHour || (currentHour === toHour && currentMin < toMin)) {
    let nextHour = currentHour + 2;
    let nextMin = currentMin + 30;

    if (nextMin >= 60) {
      nextHour += 1;
      nextMin -= 60;
    }

    // Make sure we don't exceed the end time
    if (nextHour > toHour || (nextHour === toHour && nextMin > toMin)) {
      nextHour = toHour;
      nextMin = toMin;
    }

    // Format times
    const startTime = format12HourTime(currentHour, currentMin);
    const endTime = format12HourTime(nextHour, nextMin);

    if (nextHour <= toHour) {
      slots.push({
        id: currentSlotId++,
        time: `${startTime} - ${endTime}`,
        available: true,
        deliverySlotId: deliverySlotId
      });
    }

    currentHour = nextHour;
    currentMin = nextMin;

    // Break if we've reached the end
    if (currentHour === toHour && currentMin >= toMin) {
      break;
    }
  }

  return slots;
};

/**
 * Format time in 12-hour format
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {string} - Formatted time string
 */
const format12HourTime = (hour, minute) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMin = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMin} ${ampm}`;
};

