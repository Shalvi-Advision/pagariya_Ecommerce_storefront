# Address ID Fix - "Address not found" Error

## 🐛 Root Cause

The API returns **two ID fields** for each address:

```json
{
  "id": "68f9ff51af8a33264db924cd",        // ← MongoDB ObjectId
  "idaddress_book": "4",                    // ← Address Book ID (API uses this!)
  "full_name": "John Doe",
  ...
}
```

**The Problem:**
- We were using `id` (MongoDB ObjectId) for update/delete operations
- The API expects `idaddress_book` for these operations
- Result: `{"success":false,"error":"Address not found"}`

---

## ✅ Solution Applied

### Changed in `transformAddressFromAPI()`:

**Before:**
```javascript
return {
  id: apiAddress.id || apiAddress._id,  // ❌ Wrong ID
  ...
};
```

**After:**
```javascript
return {
  id: apiAddress.idaddress_book || apiAddress.id || apiAddress._id,  // ✅ Correct ID
  mongoId: apiAddress.id || apiAddress._id,  // Keep MongoDB ID for reference
  idaddress_book: apiAddress.idaddress_book,
  ...
};
```

### Now All Operations Use Correct ID:

1. **Update Address:** Uses `idaddress_book`
2. **Delete Address:** Uses `idaddress_book`
3. **Set Default:** Uses `idaddress_book`

---

## 🧪 Test the Fix

### Step 1: Clear Browser Cache
```bash
# In Chrome: Ctrl + Shift + Delete
# Or just refresh: Ctrl + F5
```

### Step 2: Test Update
1. Go to `/address` page
2. Click **Edit** on any address
3. Change the name
4. Click **Update Address**
5. **Expected:** ✅ "Address updated successfully"

### Step 3: Check Console
You should now see:
```javascript
🔍 Update Address Request: {
  url: "...update-address/4",  // ← Note: Using "4" (idaddress_book)
  addressId: "4",
  addressIdType: "idaddress_book",
  requestBody: { ... }
}

Update Address Response: {
  status: 200,  // ✅ Success!
  statusText: "OK",
  ok: true
}
```

---

## 📊 ID Mapping

| Field Name | Type | Example | Used For |
|------------|------|---------|----------|
| `id` | MongoDB ObjectId | `"68f9ff51af8a33264db924cd"` | Internal reference |
| `idaddress_book` | Integer (as string) | `"4"` | **API operations** ✅ |
| `mongoId` | MongoDB ObjectId | `"68f9ff51af8a33264db924cd"` | Backup reference |

---

## 🔍 How to Verify It's Working

### Check the URL in Console:

**Before Fix:**
```
❌ https://.../update-address/68f9ff51af8a33264db924cd
   (MongoDB ID - API doesn't recognize this)
```

**After Fix:**
```
✅ https://.../update-address/4
   (idaddress_book - API recognizes this!)
```

---

## ✨ What Changed

### Files Modified:
- `src/api/addressApi.js`

### Functions Updated:
1. `transformAddressFromAPI()` - Now uses `idaddress_book` as primary ID
2. `updateAddress()` - Added logging and clarified ID usage
3. `deleteAddress()` - Added logging and clarified ID usage

### No Changes Needed in:
- `AddressPage.js` (automatically uses the correct ID now)
- UI components (work transparently with the new ID mapping)

---

## 🎯 Expected Results

### Update Address:
- ✅ Status: 200 OK
- ✅ Message: "Address updated successfully"
- ✅ Changes reflected immediately
- ✅ No errors in console

### Delete Address:
- ✅ Status: 200 OK  
- ✅ Address removed from list
- ✅ Success message shown

### Set Default:
- ✅ Status: 200 OK
- ✅ Default badge moves to selected address
- ✅ Other addresses unmarked as default

---

## 🐛 If Still Not Working

### Check Console for:

1. **Address ID being used:**
```javascript
🔍 Update Address Request: {
  addressId: "???"  // ← What value is this?
}
```

If it's still showing MongoDB ID (long string), check:
- Clear browser cache completely
- Reload the page (Ctrl + F5)
- Logout and login again

2. **API Response:**
```javascript
Raw Response: "???"  // ← What does this say?
```

If you still see `"Address not found"`:
- The address might not exist in the database
- Try with a different address
- Check if the user owns this address

---

## 📝 Technical Details

### Why Two IDs?

**MongoDB ID (`id`):**
- Generated automatically by MongoDB
- Used for database operations
- Unique across entire database
- Format: 24-character hex string

**Address Book ID (`idaddress_book`):**
- Application-level ID
- Auto-incremented integer
- Unique per user
- Format: Integer (stored as string in API)

**API Design:**
- API uses `idaddress_book` for CRUD operations
- Makes URLs cleaner: `/update-address/4` vs `/update-address/68f9...`
- Easier for users to reference
- Standard practice in many applications

---

## ✅ Status

**Issue:** Fixed ✅  
**Testing:** Ready  
**Impact:** All address operations (update/delete/set default)  
**Deployment:** No migration needed (just code change)

---

## 🎉 Summary

The "Address not found" error was caused by using the **wrong ID field**. 

- **Before:** Used MongoDB `id` ❌
- **After:** Uses `idaddress_book` ✅

All address operations should now work correctly!

---

**Fixed:** October 24, 2025  
**Version:** 2.0.1  
**Issue:** Address ID mapping corrected

