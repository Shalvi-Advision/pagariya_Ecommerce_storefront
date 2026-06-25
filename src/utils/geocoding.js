const NOMINATIM_HEADERS = { 'User-Agent': 'PagariyaMart/1.0 (ecommerce)' };
const INDIA_BOUNDS = { minLat: 6, maxLat: 37, minLon: 68, maxLon: 97 };
const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 }; // Mumbai fallback

export const hasValidCoords = (lat, lng) => {
  const la = parseFloat(lat);
  const lo = parseFloat(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;
  if (la === 0 && lo === 0) return false;
  return (
    la >= INDIA_BOUNDS.minLat && la <= INDIA_BOUNDS.maxLat &&
    lo >= INDIA_BOUNDS.minLon && lo <= INDIA_BOUNDS.maxLon
  );
};

export const isWithinIndia = (lat, lng) => hasValidCoords(lat, lng);

/** Geocode a 6-digit Indian pincode to approximate center. */
export const geocodePincode = async (pincode) => {
  if (!pincode) return null;
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await resp.json();
    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('Pincode geocoding failed:', e.message);
  }
  return null;
};

/** Geocode a full address string. */
export const geocodeAddressText = async ({ addressLine1, city, pinCode }) => {
  const query = [addressLine1, city, pinCode, 'India'].filter(Boolean).join(', ');
  if (!query.trim()) return null;
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await resp.json();
    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('Address geocoding failed:', e.message);
  }
  return geocodePincode(pinCode);
};

/** Reverse geocode coordinates to a short label. */
export const reverseGeocode = async (lat, lng) => {
  if (!hasValidCoords(lat, lng)) return '';
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await resp.json();
    const a = data?.address || {};
    const parts = [
      a.neighbourhood || a.suburb,
      a.city || a.town || a.village,
      a.postcode,
    ].filter(Boolean);
    return parts.join(', ') || data?.display_name || '';
  } catch (e) {
    console.warn('Reverse geocoding failed:', e.message);
  }
  return '';
};

/** Search addresses via Photon (Komoot / OSM). */
export const searchPhoton = async (query, { lat, lng } = {}) => {
  if (!query || query.trim().length < 3) return [];
  try {
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`;
    if (lat != null && lng != null) {
      url += `&lat=${lat}&lon=${lng}`;
    }
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data?.features?.length) return [];

    return data.features.map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const p = f.properties || {};
      const line1 = [p.housenumber, p.street].filter(Boolean).join(' ') || p.name || '';
      return {
        id: `${lat}-${lng}-${p.osm_id || ''}`,
        label: [line1, p.city || p.district, p.postcode].filter(Boolean).join(', '),
        addressLine1: line1,
        city: p.city || p.district || p.county || '',
        pinCode: p.postcode || '',
        lat,
        lng,
      };
    });
  } catch (e) {
    console.warn('Photon search failed:', e.message);
  }
  return [];
};

/** Resolve initial map center from pincode, store, or saved coords. */
export const resolveMapCenter = async ({ pinCode, storeLat, storeLng, savedLat, savedLng }) => {
  if (hasValidCoords(savedLat, savedLng)) {
    return { lat: parseFloat(savedLat), lng: parseFloat(savedLng) };
  }
  if (hasValidCoords(storeLat, storeLng)) {
    return { lat: parseFloat(storeLat), lng: parseFloat(storeLng) };
  }
  const fromPin = await geocodePincode(pinCode);
  if (fromPin) return fromPin;
  return DEFAULT_CENTER;
};

/** Get browser geolocation (returns promise). */
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
