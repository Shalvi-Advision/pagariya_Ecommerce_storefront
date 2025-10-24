# Address CRUD API Integration - Complete Guide

## 🎉 Overview

Successfully integrated real-time address management APIs into the AddressPage component. The page now uses live APIs for all CRUD operations (Create, Read, Update, Delete) instead of dummy data.

---

## 📁 Files Created/Modified

### **New Files:**
1. `src/api/addressApi.js` - Address API service functions

### **Modified Files:**
1. `src/pages/AddressPage.js` - Updated to use real APIs

---

## 🔌 API Endpoints Integrated

### 1. **Get All Addresses**
```
POST {{baseUrl}}/api/address-crud/get-addresses
```

**Request Body:**
```json
{
  "store_code": "AVB",
  "project_code": "PROJ001"
}
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "message": "Found 4 address(es) for mobile number: 9876543210",
  "store_code": "AVB",
  "project_code": "PROJ001",
  "mobile_number": "9876543210",
  "data": [
    {
      "id": "68f9ff51af8a33264db924cd",
      "idaddress_book": "4",
      "full_name": "John Doe",
      "mobile_number": "9876543210",
      "email_id": "john@example.com",
      "delivery_addr_line_1": "123 Main Street",
      "delivery_addr_line_2": "Apt 4B",
      "delivery_addr_city": "Mumbai",
      "delivery_addr_pincode": "400001",
      "is_default": "Yes",
      "latitude": "",
      "longitude": "",
      "area_id": ""
    }
  ]
}
```

---

### 2. **Add New Address**
```
POST {{baseUrl}}/api/address-crud/add-address
```

**Request Body:**
```json
{
  "store_code": "AVB",
  "project_code": "PROJ001",
  "full_name": "John Doe",
  "email_id": "john@example.com",
  "delivery_addr_line_1": "123 Main Street",
  "delivery_addr_line_2": "Apt 4B",
  "delivery_addr_city": "Mumbai",
  "delivery_addr_pincode": "400001",
  "is_default": "Yes",
  "latitude": "19.0760",
  "longitude": "72.8777",
  "area_id": "Downtown"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address added successfully",
  "store_code": "AVB",
  "project_code": "PROJ001",
  "data": {
    "id": "68fb6f2bd327d503ad6f660a",
    "idaddress_book": "7",
    "full_name": "John Doe",
    "mobile_number": "9876543210",
    "email_id": "john@example.com",
    "delivery_addr_line_1": "123 Main Street",
    "delivery_addr_line_2": "Apt 4B",
    "delivery_addr_city": "Mumbai",
    "delivery_addr_pincode": "400001",
    "is_default": "Yes",
    "latitude": "19.0760",
    "longitude": "72.8777",
    "area_id": "Downtown"
  }
}
```

---

### 3. **Update Address**
```
PUT {{baseUrl}}/api/address-crud/update-address/{{address_id}}
```

**Request Body:**
```json
{
  "store_code": "AVB",
  "project_code": "PROJ001",
  "full_name": "John Doe Updated",
  "email_id": "john.updated@example.com",
  "delivery_addr_line_1": "456 Updated Street",
  "delivery_addr_city": "Delhi",
  "delivery_addr_pincode": "110001",
  "is_default": "No"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "store_code": "AVB",
  "project_code": "PROJ001",
  "data": {
    "id": "68fb6f2bd327d503ad6f660a",
    "full_name": "John Doe Updated",
    "email_id": "john.updated@example.com",
    ...
  }
}
```

---

### 4. **Delete Address**
```
DELETE {{baseUrl}}/api/address-crud/delete-address/{{address_id}}
```

**Request Body:**
```json
{
  "store_code": "AVB",
  "project_code": "PROJ001"
}
```

---

## 🔧 Implementation Details

### **API Service (`src/api/addressApi.js`)**

#### Key Functions:

1. **`getAddresses()`** - Fetch all addresses for authenticated user
2. **`addAddress(addressData)`** - Add new address
3. **`updateAddress(addressId, addressData)`** - Update existing address
4. **`deleteAddress(addressId)`** - Delete address
5. **`setDefaultAddress(addressId, addressData)`** - Set address as default

#### Helper Functions:

1. **`getStoreCode()`** - Get store_code from localStorage
2. **`getAuthToken()`** - Get JWT token from localStorage
3. **`transformAddressFromAPI(apiAddress)`** - Convert API format to UI format
4. **`transformAddressToAPI(uiAddress)`** - Convert UI format to API format

---

### **Data Mapping**

#### API Fields → UI Fields:

| API Field | UI Field | Type |
|-----------|----------|------|
| `full_name` | `name` | string |
| `email_id` | `email` | string |
| `mobile_number` | `phone` | string |
| `delivery_addr_line_1` | `addressLine1` | string |
| `delivery_addr_line_2` | `addressLine2` | string |
| `delivery_addr_city` | `city` | string |
| `delivery_addr_pincode` | `pinCode` | string |
| `is_default` | `isDefault` | "Yes"/"No" → boolean |
| `latitude` | `latitude` | string |
| `longitude` | `longitude` | string |
| `area_id` | `area_id` | string |

---

## ✨ New Features Added

### 1. **Loading State**
- Displays spinner while loading addresses
- "Loading addresses..." message
- Prevents interaction during loading

### 2. **Success Messages**
- "Address added successfully"
- "Address updated successfully"
- "Address deleted successfully"
- "Default address updated successfully"
- Auto-hides after 3 seconds

### 3. **Error Handling**
- API error messages displayed
- User-friendly error text
- Dismissible error alerts

### 4. **Email Field**
- Added email input to form
- Optional field with validation
- Displayed in address cards

### 5. **Submit Loading**
- "Saving..." button text during submission
- Spinner animation on button
- Disabled state prevents double submission

### 6. **Real-time Updates**
- Automatically reloads addresses after changes
- Keeps UI in sync with server

---

## 🎨 UI Enhancements

### **Success Alert**
```jsx
{successMessage && (
  <div className="mb-4 bg-green-50 border border-green-200 text-green-800 ...">
    <CheckCircleIcon className="w-5 h-5" />
    <span>{successMessage}</span>
  </div>
)}
```

### **Error Alert**
```jsx
{apiError && (
  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 ...">
    <span>{apiError}</span>
  </div>
)}
```

### **Loading State**
```jsx
{loading ? (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 ..."></div>
    <p>Loading addresses...</p>
  </div>
) : ...}
```

### **Submit Button**
```jsx
<button type="submit" disabled={submitLoading}>
  {submitLoading ? (
    <>
      <div className="animate-spin ..."></div>
      <span>Saving...</span>
    </>
  ) : (
    <span>{editingAddress ? 'Update Address' : 'Save Address'}</span>
  )}
</button>
```

---

## 🔄 User Flow

### **View Addresses**
1. User navigates to Address Page
2. `loadAddresses()` called on mount
3. API fetches addresses with auth token
4. Addresses displayed in grid layout

### **Add New Address**
1. User clicks "Add New Address"
2. Modal opens with empty form
3. User fills in details
4. Click "Save Address"
5. If default: Unset other default addresses first
6. API creates new address
7. Success message shown
8. Addresses reloaded
9. Modal closes

### **Edit Address**
1. User clicks edit icon on address card
2. Modal opens with prefilled form
3. User modifies details
4. Click "Update Address"
5. If setting as default: Unset others first
6. API updates address
7. Success message shown
8. Addresses reloaded
9. Modal closes

### **Delete Address**
1. User clicks delete icon
2. Confirmation dialog appears
3. User confirms
4. API deletes address
5. Success message shown
6. Addresses reloaded

### **Set Default**
1. User clicks "Set as Default"
2. All other addresses set to non-default
3. Selected address set as default
4. Success message shown
5. Addresses reloaded

---

## 🔐 Authentication

### **Token Management**
```javascript
const token = getAuthToken();

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  },
  body: JSON.stringify(requestBody)
});
```

### **Auto-populated Fields**
- `store_code` - From localStorage.confirmedLocation
- `project_code` - From APP_CONSTANTS
- `mobile_number` - From user session (auto-added by API)

---

## 🧪 Testing Guide

### **Test 1: Load Addresses**
1. Navigate to /address page
2. **Expected:** Loading spinner appears
3. **Expected:** Addresses load from API
4. **Expected:** Addresses displayed in grid

### **Test 2: Add Address**
1. Click "Add New Address"
2. Fill form with valid data
3. Check "Set as default"
4. Click "Save Address"
5. **Expected:** Success message appears
6. **Expected:** New address appears in list
7. **Expected:** Marked as default

### **Test 3: Edit Address**
1. Click edit icon on any address
2. Modify name field
3. Click "Update Address"
4. **Expected:** Success message
5. **Expected:** Changes reflected in list

### **Test 4: Delete Address**
1. Click delete icon
2. Confirm deletion
3. **Expected:** Success message
4. **Expected:** Address removed from list

### **Test 5: Set Default**
1. Click "Set as Default" on non-default address
2. **Expected:** Success message
3. **Expected:** Old default unmarked
4. **Expected:** New address marked as default

### **Test 6: Validation**
1. Click "Add New Address"
2. Try to submit empty form
3. **Expected:** Validation errors shown
4. **Expected:** Required fields highlighted

### **Test 7: Error Handling**
1. Disconnect internet
2. Try to add address
3. **Expected:** Error message displayed
4. **Expected:** User-friendly error text

---

## ⚠️ Important Notes

### **Default Address Logic**
- Only ONE address can be default at a time
- When setting new default, others are automatically unset
- System ensures data consistency

### **Required vs Optional Fields**
**Required:**
- Full Name
- Address Line 1
- City
- PIN Code (6 digits)

**Optional:**
- Email (validated if provided)
- Address Line 2
- Latitude/Longitude
- Area ID

### **Phone Number**
- Phone number is auto-populated from logged-in user
- Comes from authentication session
- Not editable in form (mobile_number from API)

---

## 🔧 Configuration

### **Change API Base URL**
File: `src/constants/index.js`
```javascript
API_BASE_URL: process.env.REACT_APP_API_URL || "https://your-api.com/api"
```

### **Change Store Code Default**
File: `src/constants/index.js`
```javascript
DEFAULT_STORE_CODE: process.env.REACT_APP_DEFAULT_STORE_CODE || 'YOUR_CODE'
```

### **Change Project Code**
File: `src/constants/index.js`
```javascript
PROJECT_CODE: process.env.REACT_APP_PROJECT_CODE || 'YOUR_PROJECT'
```

---

## 🐛 Troubleshooting

### **Issue: Addresses not loading**
**Checks:**
1. Is user logged in? (Check auth token in localStorage)
2. Is store_code set? (Check confirmedLocation in localStorage)
3. Check browser console for API errors
4. Verify API endpoint is accessible

**Fix:**
```javascript
// Check auth token
localStorage.getItem('auth_token')

// Check store code
JSON.parse(localStorage.getItem('confirmedLocation'))?.store?.store_code
```

---

### **Issue: "Failed to add address"**
**Checks:**
1. All required fields filled?
2. PIN code is 6 digits?
3. Email format valid (if provided)?
4. Check API response in Network tab

---

### **Issue: Default address not updating**
**Checks:**
1. Check if API returned success
2. Verify loadAddresses() is called after update
3. Check if other addresses were properly unset

---

## 📊 API Response Handling

### **Success Response**
```javascript
if (response.success && response.data) {
  const transformedAddresses = response.data.map(transformAddressFromAPI);
  setAddresses(transformedAddresses);
  setSuccessMessage('Operation successful');
}
```

### **Error Response**
```javascript
catch (error) {
  console.error('API Error:', error);
  setApiError(error.message || 'Operation failed. Please try again.');
}
```

---

## 🎯 Summary

### **What Changed:**
- ❌ Removed dummy data (DUMMY_ADDRESSES)
- ✅ Integrated 4 real-time APIs (GET, POST, PUT, DELETE)
- ✅ Added loading states and error handling
- ✅ Added success/error message displays
- ✅ Added email field to form
- ✅ Improved validation
- ✅ Auto-reload after operations

### **Benefits:**
- 🔄 Real-time data synchronization
- 🔐 Secure with JWT authentication
- 🎨 Better UX with loading/success/error states
- ✅ Robust error handling
- 📱 Responsive and accessible
- 🚀 Production-ready

---

## ✅ Status

**Integration:** ✅ Complete  
**Testing:** ✅ Verified  
**Documentation:** ✅ Complete  
**Status:** 🚀 Production Ready

---

**Last Updated:** October 24, 2025  
**Version:** 2.0.0  
**API Integration:** Address CRUD Complete

