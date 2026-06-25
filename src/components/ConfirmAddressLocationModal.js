import React, { useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import AddressMapPicker from './AddressMapPicker';
import { hasValidCoords } from '../utils/geocoding';
import { updateAddress, transformAddressToAPI } from '../api/addressApi';
import { resolvePincodeForLocation, normalizePincode } from '../utils/addressPincodeValidation';
import { COLORS } from '../constants/theme';

const ConfirmAddressLocationModal = ({
  address,
  storeLat,
  storeLng,
  onClose,
  onConfirmed,
}) => {
  const [addressPinCode, setAddressPinCode] = useState(
    () => normalizePincode(address?.pinCode)
  );
  const [coords, setCoords] = useState({
    latitude: address?.latitude || '',
    longitude: address?.longitude || '',
    locationLabel: address?.area_id || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const lastValidLocationRef = useRef(
    hasValidCoords(address?.latitude, address?.longitude)
      ? {
          latitude: String(address.latitude),
          longitude: String(address.longitude),
          locationLabel: address?.area_id || '',
          pinCode: normalizePincode(address?.pinCode),
        }
      : null
  );

  const handleLocationChange = async ({ latitude, longitude, locationLabel, detectedPinCode }) => {
    if (!detectedPinCode) {
      setCoords({
        latitude: String(latitude),
        longitude: String(longitude),
        locationLabel: locationLabel || coords.locationLabel,
      });
      if (error) setError('');
      return;
    }

    const result = await resolvePincodeForLocation(detectedPinCode, addressPinCode);
    if (!result.ok) {
      setError(result.message);
      if (lastValidLocationRef.current) {
        setCoords({
          latitude: lastValidLocationRef.current.latitude,
          longitude: lastValidLocationRef.current.longitude,
          locationLabel: lastValidLocationRef.current.locationLabel,
        });
        setAddressPinCode(lastValidLocationRef.current.pinCode || addressPinCode);
      } else if (hasValidCoords(storeLat, storeLng)) {
        setCoords({
          latitude: String(storeLat),
          longitude: String(storeLng),
          locationLabel: '',
        });
      }
      return;
    }

    const update = {
      latitude: String(latitude),
      longitude: String(longitude),
      locationLabel: locationLabel || '',
      pinCode: result.pinCode,
    };
    lastValidLocationRef.current = update;
    setCoords(update);
    setAddressPinCode(result.pinCode);
    if (error) setError('');
  };

  const handleConfirm = async () => {
    if (!hasValidCoords(coords.latitude, coords.longitude)) {
      setError('Please place the pin on your exact delivery location.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const apiData = transformAddressToAPI({
        ...address,
        pinCode: addressPinCode || address.pinCode,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        area_id: coords.locationLabel || address.area_id || '',
      });

      await updateAddress(address.id, {
        ...apiData,
        mongoId: address.mongoId,
        idaddress_book: address.idaddress_book,
      });

      onConfirmed?.({
        ...address,
        pinCode: addressPinCode || address.pinCode,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        area_id: coords.locationLabel || address.area_id || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to save location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] p-3 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl shadow-xl max-w-lg w-full max-h-[95vh] overflow-y-auto bg-white">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: COLORS.gray[200] }}>
          <div>
            <h2 className="text-base sm:text-lg font-bold" style={{ color: COLORS.gray[900] }}>
              Confirm delivery location
            </h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.gray[500] }}>
              Required for accurate delivery fee
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1" style={{ color: COLORS.gray[400] }}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm" style={{ color: COLORS.gray[700] }}>
            {address?.addressLine1}, {address?.city} - {addressPinCode || address?.pinCode}
          </p>

          <AddressMapPicker
            pinCode={addressPinCode || address?.pinCode}
            storeLat={storeLat}
            storeLng={storeLng}
            latitude={coords.latitude}
            longitude={coords.longitude}
            locationLabel={coords.locationLabel}
            onLocationChange={handleLocationChange}
          />

          {error && (
            <p className="text-xs sm:text-sm" style={{ color: COLORS.error[600] }}>{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 border rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ borderColor: COLORS.gray[300], color: COLORS.gray[700] }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: COLORS.primary[600] }}
            >
              {saving ? 'Saving...' : 'Confirm location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAddressLocationModal;
