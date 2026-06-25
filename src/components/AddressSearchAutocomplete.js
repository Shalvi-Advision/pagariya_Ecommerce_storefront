import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { searchAddresses } from '../utils/geocoding';
import { COLORS } from '../constants/theme';

const AddressSearchAutocomplete = ({
  pinCode,
  biasLat,
  biasLng,
  onSelect,
  disabled,
  value = '',
  onChangeQuery,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query || query.trim().length < 3) {
      setResults([]);
      setOpen(false);
      setSearched(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      setSearched(false);
      const items = await searchAddresses(query.trim(), {
        lat: biasLat,
        lng: biasLng,
        pinCode,
      });
      setResults(items);
      setOpen(true);
      setSearched(true);
      setSearching(false);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, pinCode, biasLat, biasLng]);

  const handleInputChange = (e) => {
    const next = e.target.value;
    setQuery(next);
    onChangeQuery?.(next);
  };

  const handleSelect = (item) => {
    setQuery(item.label);
    setOpen(false);
    onSelect?.(item);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: COLORS.gray[700] }}>
        Search address
      </label>
      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: COLORS.gray[400] }}
        />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => (results.length > 0 || searched) && setOpen(true)}
          className="w-full pl-9 pr-3 py-2.5 sm:py-2 border rounded-lg focus:outline-none text-sm min-h-[44px] sm:min-h-0"
          style={{ borderColor: COLORS.gray[300] }}
          placeholder="Search area, society, street, landmark..."
          autoComplete="off"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: COLORS.primary[500] }} />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute z-[600] w-full mt-1 bg-white border rounded-lg shadow-lg max-h-52 overflow-y-auto"
          style={{ borderColor: COLORS.gray[200] }}
        >
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-xs sm:text-sm hover:bg-primary-50 border-b last:border-b-0 transition-colors"
                style={{ color: COLORS.gray[800], borderColor: COLORS.gray[100] }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && searched && !searching && results.length === 0 && query.trim().length >= 3 && (
        <div
          className="absolute z-[600] w-full mt-1 bg-white border rounded-lg shadow-lg px-3 py-3 text-xs sm:text-sm"
          style={{ borderColor: COLORS.gray[200], color: COLORS.gray[500] }}
        >
          No addresses found. Try a nearby landmark or drag the pin on the map.
        </div>
      )}

      {query.trim().length > 0 && query.trim().length < 3 && (
        <p className="text-[10px] sm:text-xs mt-1" style={{ color: COLORS.gray[400] }}>
          Type at least 3 characters to search
        </p>
      )}
    </div>
  );
};

export default AddressSearchAutocomplete;
