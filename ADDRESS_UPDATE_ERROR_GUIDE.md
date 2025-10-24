# Address Update Error - Troubleshooting Guide

## 🐛 Error Details

**Error Message:**
```
Error: Failed to update address
at updateAddress (addressApi.js:175:1)
at async handleSubmit (AddressPage.js:205:1)
```

---

## 🔍 Step-by-Step Debugging

### Step 1: Open Browser Console

1. Open your app in browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Keep it open while testing

### Step 2: Try to Update an Address

1. Navigate to `/address` page
2. Click **Edit** icon on any address
3. Modify any field (e.g., change name)
4. Click **Update Address**

### Step 3: Check Console Logs

You should now see detailed logs. Look for:

#### A. Request Details
```javascript
Update Address Request: {
  url: "https://...api/address-crud/update-address/12345",
  addressId: "12345",
  requestBody: { ... }
}
```

#### B. Response Status
```javascript
Update Address Response: {
  status: 400,  // ← Check this number
  statusText: "Bad Request",
  ok: false
}
```

#### C. Raw Response
```javascript
Raw Response: "Detailed error message from API"
```

---

## 🎯 Common Issues & Solutions

### Issue 1: Status 400 (Bad Request)

**Possible Causes:**
- Missing required fields
- Invalid field format
- Wrong data type

**Check the Raw Response** for exact error message from API

**Solution:**
```javascript
// Make sure all required fields are present:
{
  "store_code": "AVB",          // ✅ Required
  "project_code": "PROJ001",    // ✅ Required
  "full_name": "Name",          // ✅ Required
  "mobile_number": "1234567890", // ✅ Required
  "delivery_addr_line_1": "...", // ✅ Required
  "delivery_addr_city": "...",   // ✅ Required
  "delivery_addr_pincode": "...", // ✅ Required (6 digits)
  "is_default": "Yes" or "No"    // ✅ Required ("Yes"/"No", not true/false)
}
```

---

### Issue 2: Status 401 (Unauthorized)

**Cause:** Missing or invalid JWT token

**Solution:**

1. Check if token exists:
```javascript
// In browser console:
localStorage.getItem('auth_token')
```

2. If null or undefined:
   - You need to login again
   - Navigate to `/login`
   - Login with mobile number
   - Verify OTP

3. Token might be expired:
   - Login again to get fresh token

---

### Issue 3: Status 404 (Not Found)

**Cause:** Address ID doesn't exist or wrong URL

**Check:**
1. The address ID in the URL
2. Verify the endpoint format: `/api/address-crud/update-address/{id}`

**Debug:**
```javascript
// Check if address ID is valid
console.log('Address ID:', editingAddress.id);
```

---

### Issue 4: Status 500 (Internal Server Error)

**Cause:** Server-side error

**Solutions:**
1. Check API server logs
2. Verify database is accessible
3. Contact backend team
4. Check if the request body format matches API expectations

---

## 🧪 Use Test Script

We've created a test script to debug the API directly:

### How to Use:

1. **Get Your Address ID:**
```javascript
// In browser console on /address page:
// Click edit on an address and check the console
console.log(editingAddress.id);
```

2. **Get Your Auth Token:**
```javascript
// In browser console:
localStorage.getItem('auth_token')
```

3. **Update the test file:**

Edit `test-address-update.js`:
```javascript
const ADDRESS_ID = "YOUR_REAL_ADDRESS_ID"; // ← Paste here
const AUTH_TOKEN = "YOUR_JWT_TOKEN";       // ← Paste here
```

4. **Run the test:**
```bash
node test-address-update.js
```

5. **Check the output** for detailed request/response information

---

## 📋 Checklist

Before updating an address, verify:

- [ ] User is logged in (auth_token exists)
- [ ] Store code is set in localStorage
- [ ] Address ID is valid
- [ ] All required fields are filled
- [ ] PIN code is 6 digits
- [ ] Mobile number is valid
- [ ] is_default is "Yes" or "No" (not boolean)

---

## 🔧 Quick Fixes

### Fix 1: Ensure Phone Number is Present

The address should have a `phone` field:

```javascript
// Check in console when editing:
console.log('Address data:', editingAddress);
console.log('Has phone?', editingAddress.phone);
```

If phone is missing, it might not be loaded from API correctly.

---

### Fix 2: Verify Data Transformation

```javascript
// The transformation should map:
{
  name: "..." → full_name: "..."
  phone: "..." → mobile_number: "..."
  email: "..." → email_id: "..."
  addressLine1: "..." → delivery_addr_line_1: "..."
  city: "..." → delivery_addr_city: "..."
  pinCode: "..." → delivery_addr_pincode: "..."
  isDefault: true/false → is_default: "Yes"/"No"
}
```

---

### Fix 3: Check API Endpoint

Verify the endpoint URL in console logs:

**Should be:**
```
https://ecommerceapi-web.onrender.com/api/address-crud/update-address/{id}
```

**Check for:**
- Correct domain
- Correct path
- Address ID appended to URL
- No extra slashes or spaces

---

## 🆘 If Nothing Works

1. **Export your request data:**
```javascript
// In browser console after clicking Update:
// Copy the requestBody from console logs
copy(requestBody) // This copies to clipboard
```

2. **Test with Postman:**
   - Method: PUT
   - URL: `{{baseUrl}}/api/address-crud/update-address/{{address_id}}`
   - Headers: 
     - `Content-Type: application/json`
     - `Authorization: Bearer {{token}}`
   - Body: Paste the copied requestBody

3. **Compare:**
   - Check if Postman request works
   - If yes, compare request bodies
   - Look for differences

---

## 📞 Get More Information

After implementing the enhanced logging, you'll see in console:

```javascript
Update Address Request: { ... }     // ← What we're sending
Update Address Response: { ... }    // ← What status we got
Raw Response: "..."                 // ← Exact API response
Update Address API Error: { ... }   // ← Detailed error info (if error)
```

**Share these logs** if you need further help - they contain all the information needed to diagnose the issue!

---

## ✅ Expected Successful Flow

When everything works correctly, console should show:

```javascript
✅ Update Address Request: {
  url: "https://.../update-address/12345",
  addressId: "12345",
  requestBody: { ... }
}

✅ Update Address Response: {
  status: 200,
  statusText: "OK",
  ok: true
}

✅ Raw Response: {
  "success": true,
  "message": "Address updated successfully",
  "data": { ... }
}

✅ Success message appears: "Address updated successfully"
✅ Address list reloads with updated data
```

---

## 🎯 Next Steps

1. **Clear browser cache and cookies**
2. **Login again** to get fresh token
3. **Try updating an address** with console open
4. **Share the console logs** from:
   - "Update Address Request"
   - "Update Address Response"  
   - "Raw Response"

This will help identify the exact issue!

---

**Last Updated:** October 24, 2025  
**Version:** 1.0.1  
**Status:** Enhanced Debugging Active

