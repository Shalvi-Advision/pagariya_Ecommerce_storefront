import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  hasValidCoords,
  reverseGeocode,
  resolveMapCenter,
  getCurrentPosition,
} from '../utils/geocoding';
import { COLORS } from '../constants/theme';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const AddressMapPicker = ({
  pinCode,
  storeLat,
  storeLng,
  latitude,
  longitude,
  onLocationChange,
  locationLabel = '',
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onLocationChange);
  const reverseTimerRef = useRef(null);
  const skipNextExternalSync = useRef(false);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [label, setLabel] = useState(locationLabel);

  onChangeRef.current = onLocationChange;

  const scheduleReverseGeocode = useCallback((lat, lng) => {
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    reverseTimerRef.current = setTimeout(async () => {
      const rev = await reverseGeocode(lat, lng);
      if (rev) {
        setLabel(rev);
        onChangeRef.current?.({ latitude: lat, longitude: lng, locationLabel: rev });
      }
    }, 600);
  }, []);

  const attachMarkerDrag = useCallback((marker) => {
    marker.off('dragend');
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      skipNextExternalSync.current = true;
      onChangeRef.current?.({ latitude: pos.lat, longitude: pos.lng, locationLabel: label });
      scheduleReverseGeocode(pos.lat, pos.lng);
    });
  }, [label, scheduleReverseGeocode]);

  const placePin = useCallback((lat, lng, { pan = true, zoom = 17, reverse = true, external = false } = {}) => {
    if (!mapRef.current || !hasValidCoords(lat, lng)) return;
    if (!external) skipNextExternalSync.current = true;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      attachMarkerDrag(markerRef.current);
    }

    if (pan) {
      mapRef.current.flyTo([lat, lng], zoom, { duration: 0.6 });
    }

    if (!external) {
      onChangeRef.current?.({ latitude: lat, longitude: lng, locationLabel: label });
      if (reverse) scheduleReverseGeocode(lat, lng);
    }
  }, [attachMarkerDrag, label, scheduleReverseGeocode]);

  // Initialize map once
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      const center = await resolveMapCenter({
        pinCode,
        storeLat,
        storeLng,
        savedLat: latitude,
        savedLng: longitude,
      });

      if (cancelled || !mapContainerRef.current || mapRef.current) {
        setLoading(false);
        return;
      }

      const startLat = hasValidCoords(latitude, longitude) ? parseFloat(latitude) : center.lat;
      const startLng = hasValidCoords(latitude, longitude) ? parseFloat(longitude) : center.lng;

      mapRef.current = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: hasValidCoords(latitude, longitude) ? 16 : 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapRef.current);

      markerRef.current = L.marker([startLat, startLng], { draggable: true }).addTo(mapRef.current);
      attachMarkerDrag(markerRef.current);

      mapRef.current.on('click', (e) => {
        placePin(e.latlng.lat, e.latlng.lng, { pan: false });
      });

      if (locationLabel) {
        setLabel(locationLabel);
      } else if (hasValidCoords(startLat, startLng)) {
        const rev = await reverseGeocode(startLat, startLng);
        if (!cancelled && rev) {
          setLabel(rev);
          onChangeRef.current?.({ latitude: startLat, longitude: startLng, locationLabel: rev });
        }
      } else {
        onChangeRef.current?.({ latitude: startLat, longitude: startLng, locationLabel: '' });
      }

      setLoading(false);
    };

    init();

    return () => {
      cancelled = true;
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [pinCode, attachMarkerDrag, placePin, latitude, longitude, locationLabel, storeLat, storeLng]);

  // Sync map when search / parent updates coordinates
  useEffect(() => {
    if (!mapRef.current) return;
    if (skipNextExternalSync.current) {
      skipNextExternalSync.current = false;
      return;
    }
    if (!hasValidCoords(latitude, longitude)) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    placePin(lat, lng, { pan: true, zoom: 17, reverse: false, external: true });
    if (locationLabel) setLabel(locationLabel);
  }, [latitude, longitude, locationLabel, placePin]);

  const handleUseMyLocation = async () => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const pos = await getCurrentPosition();
      if (!hasValidCoords(pos.lat, pos.lng)) {
        setGeoError('Could not get a valid location. Please place the pin manually.');
        return;
      }
      placePin(pos.lat, pos.lng);
    } catch (err) {
      setGeoError(
        err.code === 1
          ? 'Location permission denied. Enable location access or drag the pin.'
          : 'Could not detect your location. Drag the pin to your delivery point.'
      );
    } finally {
      setGeoLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs sm:text-sm font-semibold" style={{ color: COLORS.gray[900] }}>
            Delivery location <span style={{ color: COLORS.error[500] }}>*</span>
          </p>
          <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: COLORS.gray[500] }}>
            Search above or drag the pin to your building gate
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors disabled:opacity-60 shrink-0"
          style={{ borderColor: COLORS.primary[300], color: COLORS.primary[700], backgroundColor: COLORS.primary[50] }}
        >
          {geoLoading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <MapPinIcon className="w-4 h-4" />}
          Use my location
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: COLORS.gray[200] }}>
        {loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.primary[600] }} />
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-[220px] sm:h-[260px] z-0" />
      </div>

      {label && (
        <p className="text-xs flex items-start gap-1.5" style={{ color: COLORS.gray[600] }}>
          <MapPinIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: COLORS.primary[500] }} />
          <span>Deliver here: <strong>{label}</strong></span>
        </p>
      )}

      {geoError && <p className="text-xs" style={{ color: COLORS.error[600] }}>{geoError}</p>}
      <p className="text-[10px]" style={{ color: COLORS.gray[400] }}>© OpenStreetMap contributors</p>
    </div>
  );
};

export default AddressMapPicker;
