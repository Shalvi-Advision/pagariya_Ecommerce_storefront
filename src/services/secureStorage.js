/**
 * Secure Storage Service with 30-day expiration
 * Handles token and store code caching with automatic expiration
 */

const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    STORE_CODE: 'store_code',
    CONFIRMED_LOCATION: 'confirmedLocation',
    TOKEN_EXPIRY: 'token_expiry',
    STORE_CODE_EXPIRY: 'store_code_expiry',
};

const EXPIRY_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Storage utility class for managing cached data with expiration
 */
class SecureStorage {
    /**
     * Set item in storage with expiration
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @param {number} expiryMs - Expiration time in milliseconds (default: 30 days)
     */
    static setItem(key, value, expiryMs = EXPIRY_DURATION) {
        try {
            const now = Date.now();
            const expiryTime = now + expiryMs;

            const storageData = {
                value: value,
                expiry: expiryTime,
                createdAt: now,
            };

            // Store in localStorage
            localStorage.setItem(key, JSON.stringify(storageData));

            // Also store in IndexedDB for PWA support
            this.setItemIndexedDB(key, storageData);

            console.log(`✅ Stored ${key} with expiry:`, new Date(expiryTime).toLocaleString());

            return true;
        } catch (error) {
            console.error(`❌ Error storing ${key}:`, error);
            return false;
        }
    }

    /**
     * Get item from storage, checking expiration
     * @param {string} key - Storage key
     * @returns {any|null} - Stored value or null if expired/not found
     */
    static getItem(key) {
        try {
            const storedData = localStorage.getItem(key);

            if (!storedData) {
                return null;
            }

            // Try to parse as JSON with expiry
            try {
                const parsedData = JSON.parse(storedData);

                // Check if it's our new format with expiry
                if (parsedData && typeof parsedData === 'object' && 'expiry' in parsedData) {
                    const now = Date.now();

                    // Check if expired
                    if (now > parsedData.expiry) {
                        console.warn(`⚠️ ${key} has expired. Removing...`);
                        this.removeItem(key);
                        return null;
                    }

                    // Return the actual value
                    return parsedData.value;
                }

                // Legacy format without expiry - return as is but migrate it
                console.log(`📦 Migrating legacy ${key} to new format`);
                this.setItem(key, parsedData);
                return parsedData;
            } catch (parseError) {
                // Not JSON, return as string
                return storedData;
            }
        } catch (error) {
            console.error(`❌ Error getting ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove item from storage
     * @param {string} key - Storage key
     */
    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            this.removeItemIndexedDB(key);
            console.log(`🗑️ Removed ${key} from storage`);
        } catch (error) {
            console.error(`❌ Error removing ${key}:`, error);
        }
    }

    /**
     * Check if item exists and is not expired
     * @param {string} key - Storage key
     * @returns {boolean} - True if exists and not expired
     */
    static hasValidItem(key) {
        const value = this.getItem(key);
        return value !== null;
    }

    /**
     * Get remaining time until expiry
     * @param {string} key - Storage key
     * @returns {number|null} - Milliseconds until expiry, or null if not found
     */
    static getTimeUntilExpiry(key) {
        try {
            const storedData = localStorage.getItem(key);

            if (!storedData) {
                return null;
            }

            const parsedData = JSON.parse(storedData);

            if (parsedData && typeof parsedData === 'object' && 'expiry' in parsedData) {
                const now = Date.now();
                const remaining = parsedData.expiry - now;
                return remaining > 0 ? remaining : 0;
            }

            return null;
        } catch (error) {
            console.error(`❌ Error getting expiry for ${key}:`, error);
            return null;
        }
    }

    /**
     * Store item in IndexedDB for PWA support
     * @param {string} key - Storage key
     * @param {object} data - Data to store
     */
    static async setItemIndexedDB(key, data) {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return;
        }

        try {
            const db = await this.openDB();
            const transaction = db.transaction(['storage'], 'readwrite');
            const store = transaction.objectStore('storage');

            await store.put({
                id: key,
                ...data,
            });

            db.close();
        } catch (error) {
            console.warn('IndexedDB storage failed:', error);
        }
    }

    /**
     * Remove item from IndexedDB
     * @param {string} key - Storage key
     */
    static async removeItemIndexedDB(key) {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return;
        }

        try {
            const db = await this.openDB();
            const transaction = db.transaction(['storage'], 'readwrite');
            const store = transaction.objectStore('storage');

            await store.delete(key);

            db.close();
        } catch (error) {
            console.warn('IndexedDB removal failed:', error);
        }
    }

    /**
     * Open IndexedDB database
     * @returns {Promise<IDBDatabase>}
     */
    static openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SecureStorageDB', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('storage')) {
                    db.createObjectStore('storage', { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Clear all expired items from storage
     */
    static clearExpiredItems() {
        try {
            const now = Date.now();
            let clearedCount = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                try {
                    const storedData = localStorage.getItem(key);
                    const parsedData = JSON.parse(storedData);

                    if (parsedData && typeof parsedData === 'object' && 'expiry' in parsedData) {
                        if (now > parsedData.expiry) {
                            this.removeItem(key);
                            clearedCount++;
                        }
                    }
                } catch (error) {
                    // Skip items that aren't in our format
                    continue;
                }
            }

            if (clearedCount > 0) {
                console.log(`🧹 Cleared ${clearedCount} expired items from storage`);
            }
        } catch (error) {
            console.error('❌ Error clearing expired items:', error);
        }
    }
}

/**
 * Token-specific storage methods
 */
export const TokenStorage = {
    /**
     * Store authentication token with 30-day expiration
     * @param {string} token - JWT token
     */
    setToken: (token) => {
        SecureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token, EXPIRY_DURATION);
        // Also store timestamp for backward compatibility
        localStorage.setItem('token_timestamp', Date.now().toString());
    },

    /**
     * Get authentication token if not expired
     * @returns {string|null} - Token or null if expired/not found
     */
    getToken: () => {
        return SecureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    },

    /**
     * Remove authentication token
     */
    clearToken: () => {
        SecureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem('token_timestamp');
    },

    /**
     * Check if token exists and is valid
     * @returns {boolean}
     */
    hasValidToken: () => {
        return SecureStorage.hasValidItem(STORAGE_KEYS.AUTH_TOKEN);
    },

    /**
     * Get days until token expires
     * @returns {number|null}
     */
    getDaysUntilExpiry: () => {
        const ms = SecureStorage.getTimeUntilExpiry(STORAGE_KEYS.AUTH_TOKEN);
        return ms ? Math.floor(ms / (24 * 60 * 60 * 1000)) : null;
    },
};

/**
 * Store code-specific storage methods
 */
export const StoreCodeStorage = {
    /**
     * Store store code with 30-day expiration
     * @param {string} storeCode - Store code
     * @param {object} locationData - Full location data (optional)
     */
    setStoreCode: (storeCode, locationData = null) => {
        SecureStorage.setItem(STORAGE_KEYS.STORE_CODE, storeCode, EXPIRY_DURATION);

        // Also store full location data if provided
        if (locationData) {
            SecureStorage.setItem(STORAGE_KEYS.CONFIRMED_LOCATION, locationData, EXPIRY_DURATION);
        }
    },

    /**
     * Get store code if not expired
     * @returns {string|null} - Store code or null if expired/not found
     */
    getStoreCode: () => {
        // First try to get from dedicated store_code key
        let storeCode = SecureStorage.getItem(STORAGE_KEYS.STORE_CODE);

        // Fallback to extracting from confirmedLocation
        if (!storeCode) {
            const locationData = SecureStorage.getItem(STORAGE_KEYS.CONFIRMED_LOCATION);
            if (locationData && locationData.store) {
                storeCode = locationData.store.store_code || locationData.store.storeCode;

                // Migrate to dedicated key
                if (storeCode) {
                    this.setStoreCode(storeCode, locationData);
                }
            }
        }

        return storeCode;
    },

    /**
     * Get full location data if not expired
     * @returns {object|null}
     */
    getLocationData: () => {
        return SecureStorage.getItem(STORAGE_KEYS.CONFIRMED_LOCATION);
    },

    /**
     * Remove store code and location data
     */
    clearStoreCode: () => {
        SecureStorage.removeItem(STORAGE_KEYS.STORE_CODE);
        SecureStorage.removeItem(STORAGE_KEYS.CONFIRMED_LOCATION);
    },

    /**
     * Check if store code exists and is valid
     * @returns {boolean}
     */
    hasValidStoreCode: () => {
        return SecureStorage.hasValidItem(STORAGE_KEYS.STORE_CODE) ||
            SecureStorage.hasValidItem(STORAGE_KEYS.CONFIRMED_LOCATION);
    },

    /**
     * Get days until store code expires
     * @returns {number|null}
     */
    getDaysUntilExpiry: () => {
        const ms = SecureStorage.getTimeUntilExpiry(STORAGE_KEYS.STORE_CODE);
        return ms ? Math.floor(ms / (24 * 60 * 60 * 1000)) : null;
    },
};

/**
 * User data storage methods
 */
export const UserDataStorage = {
    /**
     * Store user data with 30-day expiration
     * @param {object} userData - User data object
     */
    setUserData: (userData) => {
        SecureStorage.setItem(STORAGE_KEYS.USER_DATA, userData, EXPIRY_DURATION);
        // Also store in legacy 'user' key for backward compatibility
        localStorage.setItem('user', JSON.stringify(userData));
    },

    /**
     * Get user data if not expired
     * @returns {object|null}
     */
    getUserData: () => {
        // Try new format first
        let userData = SecureStorage.getItem(STORAGE_KEYS.USER_DATA);

        // Fallback to legacy 'user' key
        if (!userData) {
            const legacyUser = localStorage.getItem('user');
            if (legacyUser) {
                try {
                    userData = JSON.parse(legacyUser);
                    // Migrate to new format
                    this.setUserData(userData);
                } catch (error) {
                    console.error('Error parsing legacy user data:', error);
                }
            }
        }

        return userData;
    },

    /**
     * Remove user data
     */
    clearUserData: () => {
        SecureStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem('user');
    },

    /**
     * Check if user data exists and is valid
     * @returns {boolean}
     */
    hasValidUserData: () => {
        return SecureStorage.hasValidItem(STORAGE_KEYS.USER_DATA);
    },
};

/**
 * Initialize storage - clear expired items on app load
 */
export const initializeStorage = () => {
    console.log('🔧 Initializing secure storage...');
    SecureStorage.clearExpiredItems();

    // Set up periodic cleanup (every hour)
    setInterval(() => {
        SecureStorage.clearExpiredItems();
    }, 60 * 60 * 1000);
};

export default SecureStorage;
