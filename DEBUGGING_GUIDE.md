# Merchandising APIs Debug Guide

## Issue: APIs Not Being Called

The merchandising APIs (best-sellers, popular-categories, advertisements) are not being called because the **store code is not available** in localStorage.

## Debug Logs Added

I've added comprehensive console logging to all three merchandising components to help identify the exact issue.

---

## How to Debug

### Step 1: Open Browser Console
1. Press **F12** or **Ctrl+Shift+I** (Windows/Linux) or **Cmd+Option+I** (Mac)
2. Go to the **Console** tab
3. Refresh the page

### Step 2: Check Console Logs

You should see logs in this order:

#### **Expected Logs (If Working):**
```
🎬 BestsellerProducts: Component mounted/rendered
🔄 BestsellerProducts: Store code initialization useEffect fired
🔄 BestsellerProducts: Updating store code...
🔍 BestsellerProducts: Getting store code from localStorage
📦 BestsellerProducts: Raw localStorage data: {"pincode":{...},"store":{...}}
📍 BestsellerProducts: Parsed location: {pincode: {...}, store: {...}}
🏪 BestsellerProducts: Extracted store_code: "AVB"
✅ BestsellerProducts: Setting storeCode state to: AVB
🔄 BestsellerProducts: Fetch useEffect fired, storeCode: AVB
🚀 BestsellerProducts: Starting fetch for store code: AVB
📥 BestsellerProducts: API response received: {success: true, data: [...]}
```

#### **Current Problem (If Not Working):**
```
🎬 BestsellerProducts: Component mounted/rendered
🔄 BestsellerProducts: Store code initialization useEffect fired
🔄 BestsellerProducts: Updating store code...
🔍 BestsellerProducts: Getting store code from localStorage
⚠️ BestsellerProducts: No confirmedLocation in localStorage  <-- ISSUE HERE
✅ BestsellerProducts: Setting storeCode state to: null
🔄 BestsellerProducts: Fetch useEffect fired, storeCode: null
⏳ BestsellerProducts: Waiting for store code to be set... (storeCode is null/undefined)
```

---

## Root Cause Identification

### Scenario 1: No Location Selected
**Logs show:**
```
⚠️ BestsellerProducts: No confirmedLocation in localStorage
⏳ BestsellerProducts: Waiting for store code to be set...
```

**Solution:** User needs to select a location (pincode + store) first.

**Steps to Fix:**
1. Look for "Select Location" button in header
2. Click it and select a pincode
3. Choose a store
4. Confirm the selection
5. Page should reload and fetch data

---

### Scenario 2: Location Data Missing store_code
**Logs show:**
```
📦 BestsellerProducts: Raw localStorage data: {"pincode":{...},"store":{...}}
📍 BestsellerProducts: Parsed location: {pincode: {...}, store: {...}}
🏪 BestsellerProducts: Extracted store_code: null  <-- ISSUE HERE
```

**Solution:** Location data structure is wrong.

**Check localStorage:**
1. In Console tab, type:
   ```javascript
   localStorage.getItem('confirmedLocation')
   ```
2. Check the store object structure
3. It should have `store_code` or `storeCode` field

**Expected Structure:**
```json
{
  "pincode": {
    "pincode": "421506",
    "area": "Some Area"
  },
  "store": {
    "store_code": "AVB",  <-- THIS IS REQUIRED
    "storeName": "Store Name",
    "storeId": "123"
  }
}
```

**To Fix:**
1. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
2. Refresh page
3. Select location again properly

---

### Scenario 3: Components Not Mounting
**No logs at all**

**Solution:** Components are not being rendered on the page.

**Check:**
1. Are the components imported in the main page?
2. Are they included in the JSX?
3. Are there any rendering conditions preventing them?

---

## Quick Diagnostics

### Test 1: Check if localStorage has location data
```javascript
// Run in Console
localStorage.getItem('confirmedLocation')
```

**Expected:** JSON string with pincode and store data
**If null:** No location selected yet

### Test 2: Check store_code extraction
```javascript
// Run in Console
const locationData = localStorage.getItem('confirmedLocation');
if (locationData) {
  const location = JSON.parse(locationData);
  console.log('Store code:', location?.store?.store_code);
} else {
  console.log('No location data');
}
```

**Expected:** Should print store code like "AVB"
**If null/undefined:** Store data is missing or malformed

### Test 3: Manually set location data (for testing)
```javascript
// Run in Console
const testLocation = {
  pincode: {
    pincode: "421506",
    area: "Test Area"
  },
  store: {
    store_code: "AVB",
    storeName: "Test Store",
    storeId: "1"
  }
};
localStorage.setItem('confirmedLocation', JSON.stringify(testLocation));
window.dispatchEvent(new CustomEvent('locationUpdated', { detail: testLocation }));
// Then refresh the page
```

---

## Component-Specific Logs

### BestsellerProducts
All logs prefixed with: `BestsellerProducts:`

### AdvertisementCarousel
All logs prefixed with: `AdvertisementCarousel:`

### PopularCategoriesAPI
All logs prefixed with: `PopularCategoriesAPI:`

---

## What Each Log Means

| Emoji | Meaning |
|-------|---------|
| 🎬 | Component mounted/rendered |
| 🔄 | Process starting/updating |
| 🔍 | Searching/looking for data |
| 📦 | Raw data retrieved |
| 📍 | Data parsed successfully |
| 🏪 | Store code extracted |
| ✅ | Success/completed |
| 🚀 | API call starting |
| 📥 | API response received |
| ⚠️ | Warning (not critical) |
| ❌ | Error occurred |
| ⏳ | Waiting for something |
| 📡 | Event received |
| 🧹 | Cleanup happening |

---

## Common Issues & Solutions

### Issue 1: "Waiting for store code to be set..."
**Cause:** No location selected or localStorage empty

**Solution:**
1. Click "Select Location" in header
2. Choose pincode and store
3. Confirm selection

---

### Issue 2: Store code is null even after selecting location
**Cause:** Location data structure doesn't have store_code field

**Solution:**
Check the PincodeContext.js `handleConfirmLocation` function:
- Ensure it saves `store_code` field
- Field name should be exactly: `store_code` (lowercase with underscore)

**Quick Fix:**
```javascript
// In PincodeContext.js, ensure this structure:
const locationData = {
  pincode: selectedPincode,
  store: {
    ...selectedStore,
    store_code: selectedStore.store_code || selectedStore.storeCode
  }
};
```

---

### Issue 3: APIs called but returns 500 errors
**Cause:** Backend data issues (we fixed this already)

**Solution:**
Run the seed script on backend:
```bash
cd /Users/gauravpawar/Desktop/Ecomapi/EcommerceAPI_Web
node seed-merchandising-data.js
```

---

### Issue 4: localStorage has old data format
**Cause:** Previous version stored different structure

**Solution:**
```javascript
// Clear and reset
localStorage.clear();
// Refresh page and select location again
```

---

## Debugging Workflow

```
1. Open Console
   ↓
2. Refresh Page
   ↓
3. Check for component mount logs (🎬)
   ├─ Yes → Component is rendering
   └─ No  → Component not mounted (check imports)
   ↓
4. Check for localStorage logs (📦)
   ├─ "No confirmedLocation" → Need to select location
   └─ Shows data → Continue
   ↓
5. Check store_code extraction (🏪)
   ├─ Has store_code → Should work
   └─ store_code is null → Data structure problem
   ↓
6. Check API call logs (🚀)
   ├─ API call started → Check Network tab
   └─ No API call → store_code is null
   ↓
7. Check API response (📥)
   ├─ Success → APIs working!
   └─ Error → Backend issue
```

---

## Next Steps After Debugging

Once you run the page and check console:

1. **Copy ALL console logs** (right-click → Save as...)
2. **Check the specific error** you're seeing
3. **Run the Quick Diagnostics** commands above
4. **Share the output** so I can help further

---

## Testing the Fix

After selecting location properly:

1. Open Network tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Refresh page
4. You should see 3 POST requests:
   - `/api/best-sellers/list`
   - `/api/popular-categories/list`
   - `/api/advertisements/active`

All should return status **200 OK**.

---

**Build Status:** ✅ Debug build successful (172.35 kB)
**Debug Logs:** ✅ Added to all 3 components
**Ready to Test:** ✅ Yes - refresh page and check console

**What to do:** Open browser console, refresh the page, and send me the logs you see!
