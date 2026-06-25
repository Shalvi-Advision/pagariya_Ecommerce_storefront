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

/** Reverse geocode coordinates to a short label and pincode. */
export const reverseGeocodeDetails = async (lat, lng) => {
  if (!hasValidCoords(lat, lng)) return { label: '', pinCode: '' };
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
    return {
      label: parts.join(', ') || data?.display_name || '',
      pinCode: a.postcode || '',
    };
  } catch (e) {
    console.warn('Reverse geocoding failed:', e.message);
  }
  return { label: '', pinCode: '' };
};

/** Reverse geocode coordinates to a short label. */
export const reverseGeocode = async (lat, lng) => {
  const details = await reverseGeocodeDetails(lat, lng);
  return details.label;
};

/** Search addresses via Photon (Komoot / OSM). */
export const searchPhoton = async (query, { lat, lng, pinCode } = {}) => {
  if (!query || query.trim().length < 3) return [];
  try {
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en`;
    // Bias to India
    url += '&bbox=68.1,6.5,97.4,37.1';
    if (lat != null && lng != null && hasValidCoords(lat, lng)) {
      url += `&lat=${lat}&lon=${lng}`;
    }
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data?.features?.length) return [];

    return data.features.map((f) => formatSearchResult(f));
  } catch (e) {
    console.warn('Photon search failed:', e.message);
  }
  return [];
};

const formatNominatimResult = (item) => ({
  id: `nom-${item.place_id}`,
  label: item.display_name,
  addressLine1: [item.address?.house_number, item.address?.road || item.address?.neighbourhood || item.name]
    .filter(Boolean).join(' ') || item.display_name.split(',')[0],
  city: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb || item.address?.county || '',
  pinCode: item.address?.postcode || '',
  lat: parseFloat(item.lat),
  lng: parseFloat(item.lon),
});

const formatSearchResult = (f) => {
  const [lng, lat] = f.geometry.coordinates;
  const p = f.properties || {};
  const line1 = [p.housenumber, p.street].filter(Boolean).join(' ') || p.name || '';
  const city = p.city || p.district || p.county || p.state || '';
  return {
    id: `ph-${lat}-${lng}-${p.osm_id || ''}`,
    label: [line1, city, p.postcode].filter(Boolean).join(', ') || p.name || 'Selected location',
    addressLine1: line1 || p.name || '',
    city,
    pinCode: p.postcode || '',
    lat,
    lng,
  };
};

/** Nominatim fallback when Photon has no hits. */
export const searchNominatim = async (query, { pinCode } = {}) => {
  if (!query || query.trim().length < 3) return [];
  const q = pinCode ? `${query}, ${pinCode}, India` : `${query}, India`;
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=in&addressdetails=1`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await resp.json();
    if (!Array.isArray(data) || !data.length) return [];
    return data.map(formatNominatimResult);
  } catch (e) {
    console.warn('Nominatim search failed:', e.message);
  }
  return [];
};

/** Combined address search — Photon first, Nominatim fallback. */
export const searchAddresses = async (query, options = {}) => {
  const photon = await searchPhoton(query, options);
  if (photon.length > 0) return photon;
  return searchNominatim(query, options);
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
