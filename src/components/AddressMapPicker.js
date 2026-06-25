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

  useEffect(() => {
    let cancelled = false;
    const onChange = onChangeRef;

    const init = async () => {
      setLoading(true);
      const center = await resolveMapCenter({
        pinCode,
        storeLat,
        storeLng,
        savedLat: latitude,
        savedLng: longitude,
      });

      if (cancelled || !mapContainerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          center: [center.lat, center.lng],
          zoom: hasValidCoords(latitude, longitude) ? 16 : 14,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(mapRef.current);

        mapRef.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
            markerRef.current.on('dragend', () => {
              const pos = markerRef.current.getLatLng();
              onChange.current?.({ latitude: pos.lat, longitude: pos.lng, locationLabel: '' });
              scheduleReverseGeocode(pos.lat, pos.lng);
            });
          }
          onChange.current?.({ latitude: lat, longitude: lng, locationLabel: '' });
          scheduleReverseGeocode(lat, lng);
        });
      }

      const startLat = hasValidCoords(latitude, longitude) ? parseFloat(latitude) : center.lat;
      const startLng = hasValidCoords(latitude, longitude) ? parseFloat(longitude) : center.lng;

      if (markerRef.current) {
        markerRef.current.setLatLng([startLat, startLng]);
      } else {
        markerRef.current = L.marker([startLat, startLng], { draggable: true }).addTo(mapRef.current);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          onChange.current?.({ latitude: pos.lat, longitude: pos.lng, locationLabel: '' });
          scheduleReverseGeocode(pos.lat, pos.lng);
        });
      }

      mapRef.current.setView([startLat, startLng], hasValidCoords(latitude, longitude) ? 16 : 14);
      onChange.current?.({ latitude: startLat, longitude: startLng, locationLabel: locationLabel || '' });

      if (locationLabel) {
        setLabel(locationLabel);
      } else if (hasValidCoords(startLat, startLng)) {
        const rev = await reverseGeocode(startLat, startLng);
        if (!cancelled && rev) {
          setLabel(rev);
          onChange.current?.({ latitude: startLat, longitude: startLng, locationLabel: rev });
        }
      }

      setLoading(false);
    };

    init();

    return () => {
      cancelled = true;
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    };
  }, [pinCode, storeLat, storeLng, latitude, longitude, locationLabel, scheduleReverseGeocode]);

  useEffect(() => () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  }, []);

  const handleUseMyLocation = async () => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const pos = await getCurrentPosition();
      if (!hasValidCoords(pos.lat, pos.lng)) {
        setGeoError('Could not get a valid location. Please place the pin manually.');
        return;
      }
      if (mapRef.current) {
        if (markerRef.current) {
          markerRef.current.setLatLng([pos.lat, pos.lng]);
        } else {
          markerRef.current = L.marker([pos.lat, pos.lng], { draggable: true }).addTo(mapRef.current);
        }
        mapRef.current.setView([pos.lat, pos.lng], 16);
        onChangeRef.current?.({ latitude: pos.lat, longitude: pos.lng, locationLabel: '' });
        scheduleReverseGeocode(pos.lat, pos.lng);
      }
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
            Drag the pin to your building gate or society entrance
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
