import { checkPincodeServiceability, getPincodeStores } from '../api/pincodeService';

export const normalizePincode = (pin) => String(pin || '').replace(/\D/g, '').slice(0, 6);

const isPincodeServiceable = (availability) =>
  availability?.success && (availability?.serviceable || availability?.available);

const pincodeHasStores = (storesResponse) =>
  storesResponse?.success &&
  Array.isArray(storesResponse.data) &&
  storesResponse.data.length > 0;

/**
 * Resolve which pincode to use for an address when map/search detects a pin.
 * - Same pin or no detection → keep current pin
 * - Different pin with stores → adopt the new pin
 * - Different pin without service → reject and keep current pin
 */
export const resolvePincodeForLocation = async (detectedPin, currentPin) => {
  const current = normalizePincode(currentPin);
  const detected = normalizePincode(detectedPin);

  if (!detected) return { ok: true, pinCode: current };
  if (!current || detected === current) return { ok: true, pinCode: current || detected };

  try {
    const [availability, storesResponse] = await Promise.all([
      checkPincodeServiceability(detected),
      getPincodeStores(detected),
    ]);

    if (!isPincodeServiceable(availability) || !pincodeHasStores(storesResponse)) {
      return {
        ok: false,
        pinCode: current,
        message: `No delivery service in this area (PIN ${detected}). Please select a location within PIN ${current}.`,
      };
    }

    return { ok: true, pinCode: detected, pinChanged: true };
  } catch {
    return {
      ok: false,
      pinCode: current,
      message: `Unable to verify delivery for PIN ${detected}. Please select a location within PIN ${current}.`,
    };
  }
};

/** @deprecated use resolvePincodeForLocation */
export const validateLocationForSessionPincode = async (detectedPin, sessionPin) => {
  const result = await resolvePincodeForLocation(detectedPin, sessionPin);
  return { ok: result.ok, message: result.message };
};
