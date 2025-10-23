// Grocery API Service
// This service handles all grocery-related API calls

// Utility function to make API calls with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Import constants
import { API_BASE_URL, PROJECT_CODE } from '../constants';
import { processProductData } from './api';

class GroceryApiService {
  // Get active departments
  async getActiveDepartments() {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // For departments API, always send store_code as "null" string (hardcoded)
      const response = await fetchWithTimeout(`${API_BASE_URL}/departments/get-departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_code: "null",
          project_code: PROJECT_CODE
        })
      }, 10000);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform response to match expected format
      return {
        success: data.success,
        data: data.data || [],
        message: data.message,
        count: data.count
      };
    } catch (error) {
      console.error('Error fetching departments:', error);

      // Return fallback data structure
      return {
        success: false,
        data: [],
        message: 'Failed to fetch departments.',
        error: error.message
      };
    }
  }

  // Get active categories for a department
  async getActiveCategories(departmentId) {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Get store_code from localStorage (PincodeContext)
      const locationData = localStorage.getItem('confirmedLocation');
      const storeCode = locationData ? JSON.parse(locationData)?.store?.storeCode || JSON.parse(locationData)?.store?.store_code : null;

      // If no store is selected, return a special error
      if (!storeCode) {
        return {
          success: false,
          data: [],
          message: 'Please select a store to continue',
          error: 'STORE_NOT_SELECTED',
          requiresStoreSelection: true
        };
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/categories/get-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dept_id: departmentId,
          store_code: storeCode,
          project_code: PROJECT_CODE
        })
      }, 10000);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success,
        data: data.data || [],
        message: data.message,
        count: data.count,
        dept_id: data.dept_id
      };
    } catch (error) {
      console.error('Error fetching categories:', error);

      // Return fallback data structure
      return {
        success: false,
        data: [],
        message: 'Failed to fetch categories.',
        error: error.message
      };
    }
  }

  // Get active categories by department name
  async getActiveCategoriesByDepartmentName(departmentName) {
    try {
      // First get all departments to find the department ID
      const departmentsResponse = await this.getActiveDepartments();

      if (!departmentsResponse.success) {
        return departmentsResponse;
      }

      // Find the department by name
      const department = departmentsResponse.data.find(dept =>
        dept.department_name.toLowerCase() === departmentName.toLowerCase()
      );

      if (!department) {
        return {
          success: false,
          data: [],
          message: 'Department not found'
        };
      }

      // Get categories for this department
      return await this.getActiveCategories(department.department_id);
    } catch (error) {
      console.error('Error fetching categories by department name:', error);

      return {
        success: false,
        data: [],
        message: 'Failed to fetch categories by department name',
        error: error.message
      };
    }
  }

  // Get active subcategories for a category
  async getActiveSubcategories(departmentId, categoryId) {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Get store_code from localStorage (PincodeContext)
      const locationData = localStorage.getItem('confirmedLocation');
      const storeCode = locationData ? JSON.parse(locationData)?.store?.storeCode || JSON.parse(locationData)?.store?.store_code : null;

      // If no store is selected, return a special error
      if (!storeCode) {
        return {
          success: false,
          data: [],
          message: 'Please select a store to continue',
          error: 'STORE_NOT_SELECTED',
          requiresStoreSelection: true
        };
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/subcategories/get-subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dept_id: departmentId,
          store_code: storeCode,
          project_code: PROJECT_CODE,
          idcategory_master: categoryId
        })
      }, 10000);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success,
        data: data.data || [],
        message: data.message,
        count: data.count,
        dept_id: data.dept_id,
        idcategory_master: data.idcategory_master
      };
    } catch (error) {
      console.error('Error fetching subcategories:', error);

      // Return fallback data structure
      return {
        success: false,
        data: [],
        message: 'Failed to fetch subcategories.',
        error: error.message
      };
    }
  }

  // Get products by full hierarchy path
  async getProducts(storeCode, deptId, categoryId, subcategoryId) {
    try {
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/products/get-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_code: storeCode,
          dept_id: deptId,
          category_id: categoryId,
          sub_category_id: subcategoryId
        })
      }, 10000);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Process product data to ensure proper field mapping
      const processedData = data.data ? data.data.map(processProductData) : [];

      return {
        success: data.success,
        data: processedData,
        message: data.message,
        count: data.count
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch products.',
        error: error.message
      };
    }
  }

  // Search products with optional filters
  async searchProducts(searchTerm, storeCode, filters = {}) {
    try {
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/products/search-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_term: searchTerm || '',
          store_code: storeCode,
          ...filters
        })
      }, 10000);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Process product data to ensure proper field mapping
      const processedData = data.data ? data.data.map(processProductData) : [];

      return {
        success: data.success,
        data: processedData,
        message: data.message,
        count: data.count
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to search products.',
        error: error.message
      };
    }
  }

}

// Create and export a singleton instance
const groceryApiService = new GroceryApiService();
export default groceryApiService;

// Standalone function for getting departments with categories
export const getDepartmentsWithCategories = async () => {
  try {
    // First get all departments
    const departmentsResponse = await groceryApiService.getActiveDepartments();
    
    if (!departmentsResponse.success) {
      return departmentsResponse;
    }

    const departments = departmentsResponse.data;
    const departmentsWithCategories = [];

    // For each department, get its categories
    for (const department of departments) {
      const categoriesResponse = await groceryApiService.getActiveCategories(department.department_id);
      
      departmentsWithCategories.push({
        ...department,
        categories: categoriesResponse.success ? categoriesResponse.data : []
      });
    }

    return {
      success: true,
      data: departmentsWithCategories,
      message: 'Departments with categories fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching departments with categories:', error);
    return {
      success: false,
      data: [],
      message: 'Failed to fetch departments with categories',
      error: error.message
    };
  }
};

// Export individual methods for convenience
export const {
  getActiveDepartments,
  getActiveCategories,
  getActiveCategoriesByDepartmentName,
  getActiveSubcategories,
  getProducts,
  searchProducts
} = groceryApiService;
