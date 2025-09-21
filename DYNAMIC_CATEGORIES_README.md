# Dynamic Categories Implementation

This document describes the implementation of dynamic categories and departments using the provided APIs.

## Overview

The "All Categories" menu now dynamically loads department and category data from the backend APIs instead of using hardcoded values. This allows for real-time updates to the category structure without code changes.

## API Endpoints

### 1. Get Active Departments
- **Endpoint**: `{{base_url}}/api/departments/get_active_department_list`
- **Method**: POST
- **Body**:
  ```json
  {
    "project_code": "{{project_code}}"
  }
  ```

### 2. Get Active Categories
- **Endpoint**: `{{base_url}}/api/categories/get_active_categories_list`
- **Method**: POST
- **Body**:
  ```json
  {
    "department_id": "2",
    "store_code": "{{store_code}}",
    "project_code": "{{project_code}}"
  }
  ```

## Implementation Details

### Files Modified

1. **`src/services/groceryApi.js`**
   - Added `getActiveDepartments()` method
   - Added `getActiveCategories(departmentId)` method
   - Added `getDepartmentsWithCategories()` method for combined data fetching

2. **`src/components/CategoriesDrawer.js`**
   - Replaced hardcoded categories with API data
   - Added loading states and error handling
   - Added fallback to hardcoded categories if API fails
   - Added dynamic icon mapping for departments

3. **`env.example`**
   - Added `REACT_APP_PROJECT_CODE` configuration
   - Added `REACT_APP_STORE_CODE` configuration

### Key Features

- **Dynamic Loading**: Categories are loaded from API when the drawer opens
- **Loading States**: Shows spinner while fetching data
- **Error Handling**: Displays error message with retry option if API fails
- **Fallback Support**: Uses hardcoded categories if API is unavailable
- **Icon Mapping**: Automatically assigns appropriate icons to departments
- **Responsive Design**: Maintains the existing grid layout

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_PROJECT_CODE=your_actual_project_code
REACT_APP_STORE_CODE=your_actual_store_code
```

### Icon Mapping

The system automatically maps department names to appropriate icons. To add new icons, update the `getDepartmentIcon` function in `CategoriesDrawer.js`:

```javascript
const getDepartmentIcon = (departmentName) => {
  const iconMap = {
    'DEPARTMENT_NAME': '🛒',
    // Add more mappings here
  };
  return iconMap[departmentName] || '📦';
};
```

## Testing

### Manual Testing

1. Set up your environment variables
2. Start your API server
3. Open the application and click "All Categories"
4. Verify that departments and categories load from the API

### Automated Testing

Run the test script to verify API connectivity:

```bash
node test-departments-api.js
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Network Errors**: Shows error message with retry button
2. **API Errors**: Displays specific error messages from the API
3. **Fallback**: Uses hardcoded categories if API is unavailable
4. **Loading States**: Prevents user interaction during data fetching

## Performance Considerations

- **Lazy Loading**: Categories are only fetched when the drawer is opened
- **Caching**: Consider implementing caching for better performance
- **Error Recovery**: Automatic retry mechanism for failed requests

## Future Enhancements

1. **Caching**: Implement local storage caching for better performance
2. **Real-time Updates**: Add WebSocket support for live category updates
3. **Search**: Add search functionality within categories
4. **Favorites**: Allow users to mark favorite categories
5. **Analytics**: Track category click patterns

## Troubleshooting

### Common Issues

1. **Categories not loading**: Check API URL and project/store codes
2. **CORS errors**: Ensure API server allows requests from your domain
3. **Authentication**: Verify API authentication if required
4. **Network issues**: Check internet connection and API server status

### Debug Steps

1. Check browser console for error messages
2. Verify environment variables are set correctly
3. Test API endpoints directly using the test script
4. Check network tab in browser dev tools for failed requests

## API Response Format

### Departments Response
```json
{
  "success": true,
  "message": "Active departments retrieved successfully",
  "data": [
    {
      "_id": "68a8a27d4169ced4c49f94ce",
      "department_id": "1",
      "department_name": "HOUSEHOLD ITEMS",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": "null",
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/HOUSEHOLD-ITEMS.webp",
      "sequence_id": 1,
      "__v": 0
    }
  ]
}
```

### Categories Response
```json
{
  "success": true,
  "message": "Active categories retrieved successfully",
  "data": [
    {
      "_id": "68a8a2804169ced4c49f9976",
      "idcategory_master": "89",
      "category_name": "UPWAS ITEM",
      "dept_id": "2",
      "sequence_id": 1,
      "store_code": "KBR",
      "no_of_col": "4",
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/category/thumbnail/upvasspecial.webp",
      "category_bg_color": "#FFFF00",
      "__v": 0
    }
  ]
}
```

## Support

For issues or questions regarding this implementation, please check:

1. This documentation
2. Browser console for error messages
3. API server logs
4. Network connectivity

The implementation is designed to be robust and provide a good user experience even when the API is unavailable.
