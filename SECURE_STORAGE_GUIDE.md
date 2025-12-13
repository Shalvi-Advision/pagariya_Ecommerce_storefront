# Secure Storage with 30-Day Token & Store Code Caching

## Overview

This implementation provides a robust caching system for authentication tokens and store codes with automatic 30-day expiration. The system ensures that users remain logged in for 30 days unless they explicitly sign out.

## Features

✅ **30-Day Token Caching** - Authentication tokens are cached for 30 days
✅ **30-Day Store Code Caching** - Store codes and location data persist for 30 days  
✅ **Automatic Expiration** - Items automatically expire after 30 days
✅ **PWA Support** - Uses both localStorage and IndexedDB for offline support
✅ **Backward Compatible** - Migrates existing data to new format automatically
✅ **Auto Cleanup** - Expired items are automatically removed

## Architecture

### Core Components

1. **SecureStorage** (`src/services/secureStorage.js`)
   - Base storage class with expiration management
   - Handles both localStorage and IndexedDB
   - Automatic cleanup of expired items

2. **TokenStorage** 
   - Manages authentication tokens
   - 30-day expiration by default
   - Integrates with existing auth flow

3. **StoreCodeStorage**
   - Manages store codes and location data
   - 30-day expiration by default
   - Supports full location object storage

4. **UserDataStorage**
   - Manages user profile data
   - 30-day expiration by default
   - Backward compatible with legacy 'user' key

## Usage

### Token Management

```javascript
import { TokenStorage } from './services/secureStorage';

// Store token (automatically expires in 30 days)
TokenStorage.setToken('your-jwt-token');

// Get token (returns null if expired)
const token = TokenStorage.getToken();

// Check if token is valid
const isValid = TokenStorage.hasValidToken();

// Get days until expiry
const daysLeft = TokenStorage.getDaysUntilExpiry();

// Clear token
TokenStorage.clearToken();
```

### Store Code Management

```javascript
import { StoreCodeStorage } from './services/secureStorage';

// Store code with location data
StoreCodeStorage.setStoreCode('AVB', {
  store: {
    store_code: 'AVB',
    name: 'Main Store',
    address: '123 Main St'
  },
  pincode: {
    pincode: '440010'
  }
});

// Get store code
const storeCode = StoreCodeStorage.getStoreCode();

// Get full location data
const locationData = StoreCodeStorage.getLocationData();

// Check if valid
const hasValid = StoreCodeStorage.hasValidStoreCode();

// Clear store code
StoreCodeStorage.clearStoreCode();
```

### Using the Hook

```javascript
import { useStoreCode } from './hooks/useStoreCode';

function MyComponent() {
  const {
    storeCode,
    locationData,
    isLoading,
    setStoreCode,
    clearStoreCode,
    hasValidStoreCode,
    getDaysUntilExpiry
  } = useStoreCode();

  const handleSetStore = () => {
    setStoreCode('AVB', { /* location data */ });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Store Code: {storeCode}</p>
      <p>Days until expiry: {getDaysUntilExpiry()}</p>
      <button onClick={handleSetStore}>Set Store</button>
      <button onClick={clearStoreCode}>Clear Store</button>
    </div>
  );
}
```

### User Data Management

```javascript
import { UserDataStorage } from './services/secureStorage';

// Store user data
UserDataStorage.setUserData({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  mobile: '9876543210'
});

// Get user data
const user = UserDataStorage.getUserData();

// Clear user data
UserDataStorage.clearUserData();
```

## Storage Format

Data is stored in the following format:

```json
{
  "value": "actual-data-here",
  "expiry": 1704067200000,
  "createdAt": 1701475200000
}
```

- `value`: The actual data being stored
- `expiry`: Timestamp when the data expires (30 days from creation)
- `createdAt`: Timestamp when the data was created

## Automatic Cleanup

The system automatically cleans up expired items:

1. **On App Load**: `initializeStorage()` is called in AuthContext
2. **Periodic Cleanup**: Every hour, expired items are removed
3. **On Access**: When accessing data, expired items return null and are removed

## Migration from Legacy Storage

The system automatically migrates data from the old format:

```javascript
// Old format (plain string or JSON)
localStorage.setItem('auth_token', 'token-value');

// New format (with expiration)
{
  "value": "token-value",
  "expiry": 1704067200000,
  "createdAt": 1701475200000
}
```

When old format data is detected, it's automatically migrated to the new format with a 30-day expiration.

## Integration Points

### 1. AuthContext (`src/context/AuthContext.js`)

```javascript
import { TokenStorage, UserDataStorage, initializeStorage } from '../services/secureStorage';

// Initialize on mount
useEffect(() => {
  initializeStorage();
  // ... rest of initialization
}, []);

// Use TokenStorage for token operations
const token = TokenStorage.getToken();
const user = UserDataStorage.getUserData();
```

### 2. API Service (`src/services/api.js`)

```javascript
import { TokenStorage } from './secureStorage';

export const getStoredToken = () => {
  return TokenStorage.getToken();
};

export const setStoredToken = async (token) => {
  TokenStorage.setToken(token);
};

export const clearStoredToken = () => {
  TokenStorage.clearToken();
};
```

### 3. Location/Store Selection Components

```javascript
import { useStoreCode } from '../hooks/useStoreCode';

function LocationModal() {
  const { setStoreCode } = useStoreCode();

  const handleConfirmLocation = (location) => {
    const storeCode = location.store.store_code;
    setStoreCode(storeCode, location);
  };
}
```

## Logout Behavior

When a user signs out, all cached data is cleared:

```javascript
const logout = async () => {
  // Clear token (removes from both localStorage and IndexedDB)
  TokenStorage.clearToken();
  
  // Clear user data
  UserDataStorage.clearUserData();
  
  // Optionally clear store code
  StoreCodeStorage.clearStoreCode();
  
  // Clear user-specific data
  localStorage.removeItem(`cart_${userId}`);
  localStorage.removeItem(`orders_${userId}`);
};
```

## Security Considerations

1. **Client-Side Storage**: Data is stored client-side, so sensitive information should not be stored
2. **Token Expiration**: Tokens should have server-side expiration as well
3. **HTTPS Only**: Always use HTTPS in production
4. **XSS Protection**: Ensure proper XSS protection in your application

## Testing

### Check Token Expiration

```javascript
// Get days until token expires
const days = TokenStorage.getDaysUntilExpiry();
console.log(`Token expires in ${days} days`);

// Check if token is valid
const isValid = TokenStorage.hasValidToken();
console.log(`Token is valid: ${isValid}`);
```

### Manual Expiration Test

```javascript
// Set token with short expiration (1 minute for testing)
import SecureStorage from './services/secureStorage';
SecureStorage.setItem('test_token', 'value', 60 * 1000); // 1 minute

// Wait 1 minute and check
setTimeout(() => {
  const value = SecureStorage.getItem('test_token');
  console.log('Value after 1 minute:', value); // Should be null
}, 61 * 1000);
```

## Troubleshooting

### Token Not Persisting

1. Check browser console for errors
2. Verify localStorage is enabled
3. Check if data is being cleared somewhere
4. Verify expiration time is set correctly

### Store Code Not Loading

1. Check if `initializeStorage()` is called
2. Verify store code is being set correctly
3. Check browser console for migration messages
4. Verify localStorage has the data

### Data Expiring Too Soon

1. Check the `EXPIRY_DURATION` constant (should be 30 days)
2. Verify system time is correct
3. Check for any code clearing the data

## Console Logging

The system provides helpful console logs:

```
✅ Stored auth_token with expiry: 1/13/2026, 12:00:00 PM
📍 Loaded store code from cache: AVB
🗑️ Removed auth_token from storage
🧹 Cleared 3 expired items from storage
⚠️ auth_token has expired. Removing...
📦 Migrating legacy user to new format
```

## Performance

- **Minimal Overhead**: Only checks expiration when accessing data
- **Efficient Cleanup**: Periodic cleanup runs every hour
- **IndexedDB**: Async operations don't block main thread
- **Caching**: Reduces API calls by persisting data locally

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ PWA support

## Future Enhancements

- [ ] Configurable expiration per item
- [ ] Encryption for sensitive data
- [ ] Compression for large data
- [ ] Sync across tabs
- [ ] Background sync for PWA
