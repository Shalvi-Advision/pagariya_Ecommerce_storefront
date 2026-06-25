import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { searchPhoton } from '../utils/geocoding';
import { COLORS } from '../constants/theme';

const AddressSearchAutocomplete = ({ pinCode, biasLat, biasLng, onSelect, disabled }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

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
      return;
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const searchQuery = pinCode ? `${query}, ${pinCode}, India` : query;
      const items = await searchPhoton(searchQuery, { lat: biasLat, lng: biasLng });
      setResults(items);
      setOpen(items.length > 0);
      setSearching(false);
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, pinCode, biasLat, biasLng]);

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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full pl-9 pr-3 py-2.5 sm:py-2 border rounded-lg focus:outline-none text-sm min-h-[44px] sm:min-h-0"
          style={{ borderColor: COLORS.gray[300] }}
          placeholder="Search area, society, street..."
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: COLORS.primary[500] }} />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute z-[600] w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{ borderColor: COLORS.gray[200] }}
        >
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-xs sm:text-sm hover:bg-gray-50 border-b last:border-b-0"
                style={{ color: COLORS.gray[800], borderColor: COLORS.gray[100] }}
                onClick={() => handleSelect(item)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearchAutocomplete;
