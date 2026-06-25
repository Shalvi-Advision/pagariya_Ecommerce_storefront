import { checkPincodeServiceability, getPincodeStores } from '../api/pincodeService';

export const normalizePincode = (pin) => String(pin || '').replace(/\D/g, '').slice(0, 6);

/**
 * When a map/search result implies a different pincode than the customer's session pin,
 * verify that area has delivery service. Reject if not serviceable.
 * Session pincode is always kept on the saved address.
 */
export const validateLocationForSessionPincode = async (detectedPin, sessionPin) => {
  const session = normalizePincode(sessionPin);
  const detected = normalizePincode(detectedPin);

  if (!session) return { ok: true };
  if (!detected || detected === session) return { ok: true };

  try {
    const [availability, storesResponse] = await Promise.all([
      checkPincodeServiceability(detected),
      getPincodeStores(detected),
    ]);

    const serviceable = availability?.success && availability?.serviceable;
    const hasStore =
      storesResponse?.success &&
      Array.isArray(storesResponse.data) &&
      storesResponse.data.length > 0;

    if (!serviceable || !hasStore) {
      return {
        ok: false,
        message: `No delivery service in this area (PIN ${detected}). Please select a location within PIN ${session}.`,
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: `Unable to verify delivery for PIN ${detected}. Please select a location within PIN ${session}.`,
    };
  }
};
