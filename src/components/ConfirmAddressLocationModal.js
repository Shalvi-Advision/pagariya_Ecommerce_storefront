import React, { useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import AddressMapPicker from './AddressMapPicker';
import { hasValidCoords } from '../utils/geocoding';
import { updateAddress, transformAddressToAPI } from '../api/addressApi';
import { validateLocationForSessionPincode, normalizePincode } from '../utils/addressPincodeValidation';
import { usePincode } from '../context/PincodeContext';
import { COLORS } from '../constants/theme';

const ConfirmAddressLocationModal = ({
  address,
  storeLat,
  storeLng,
  onClose,
  onConfirmed,
}) => {
  const { getCurrentPincode } = usePincode();
  const getLockedPincode = () =>
    normalizePincode(getCurrentPincode() || address?.pinCode);

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
        }
      : null
  );

  const handleLocationChange = async ({ latitude, longitude, locationLabel, detectedPinCode }) => {
    const lockedPinCode = getLockedPincode();

    if (!detectedPinCode) {
      setCoords({
        latitude: String(latitude),
        longitude: String(longitude),
        locationLabel: locationLabel || coords.locationLabel,
      });
      if (error) setError('');
      return;
    }

    const validation = await validateLocationForSessionPincode(detectedPinCode, lockedPinCode);
    if (!validation.ok) {
      setError(validation.message);
      if (lastValidLocationRef.current) {
        setCoords(lastValidLocationRef.current);
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
    };
    lastValidLocationRef.current = update;
    setCoords(update);
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
      const lockedPinCode = getLockedPincode();
      const apiData = transformAddressToAPI({
        ...address,
        pinCode: lockedPinCode || address.pinCode,
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
        pinCode: lockedPinCode || address.pinCode,
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
            {address?.addressLine1}, {address?.city} - {getLockedPincode() || address?.pinCode}
          </p>

          <AddressMapPicker
            pinCode={getLockedPincode() || address?.pinCode}
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
