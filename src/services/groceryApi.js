// Grocery API Service
// This service handles all grocery-related API calls
// For now, it uses dummy data from groceryData.json
// In production, replace with actual API endpoints

import groceryData from '../groceryData.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Base URL (replace with actual API URL in production)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Project configuration
const PROJECT_CODE = process.env.REACT_APP_PROJECT_CODE || 'your_project_code';
const STORE_CODE = process.env.REACT_APP_STORE_CODE || 'your_store_code';

class GroceryApiService {
  // Get all categories
  async getCategories() {
    try {
      // Simulate API call delay
      await delay(300);
      
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/categories`);
      // return await response.json();
      
      return {
        success: true,
        data: groceryData.categories,
        message: 'Categories fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Failed to fetch categories',
        error: error.message
      };
    }
  }

  // Get products by category
  async getProductsByCategory(categoryName, subcategory = null) {
    try {
      await delay(200);
      
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/products?category=${categoryName}&subcategory=${subcategory}`);
      // return await response.json();
      
      // For now, use dummy data directly
      const category = groceryData.categories.find(cat => {
        const categorySlug = cat.name.toLowerCase().replace(/\s+/g, '-');
        return categorySlug === categoryName.toLowerCase();
      });
      
      if (!category) {
        return {
          success: false,
          data: [],
          message: 'Category not found'
        };
      }

      let filteredProducts = groceryData.products.filter(product => {
        if (subcategory) {
          return product.subcategory === subcategory;
        }
        // If no subcategory selected, show all products from the main category's subcategories
        return product.subcategory && category.subcategories.includes(product.subcategory);
      });

      return {
        success: true,
        data: filteredProducts,
        message: 'Products fetched successfully',
        category: category,
        totalCount: filteredProducts.length
      };
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch products',
        error: error.message
      };
    }
  }

  // Get all products
  async getAllProducts() {
    try {
      await delay(200);
      
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/products`);
      // return await response.json();
      
      return {
        success: true,
        data: groceryData.products,
        message: 'All products fetched successfully',
        totalCount: groceryData.products.length
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Failed to fetch products',
        error: error.message
      };
    }
  }

  // Search products
  async searchProducts(query, filters = {}) {
    try {
      await delay(300);
      
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/products/search`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ query, filters })
      // });
      // return await response.json();
      
      let filteredProducts = groceryData.products;

      // Apply search query
      if (query) {
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.brand.toLowerCase().includes(query.toLowerCase()) ||
          product.subcategory.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Apply filters
      if (filters.brand) {
        filteredProducts = filteredProducts.filter(product => product.brand === filters.brand);
      }
      if (filters.subcategory) {
        filteredProducts = filteredProducts.filter(product => product.subcategory === filters.subcategory);
      }
      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(product => product.price >= filters.minPrice);
      }
      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(product => product.price <= filters.maxPrice);
      }

      return {
        success: true,
        data: filteredProducts,
        message: 'Search completed successfully',
        totalCount: filteredProducts.length,
        query,
        filters
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Search failed',
        error: error.message
      };
    }
  }

  // Get product by ID
  async getProductById(productId) {
    try {
      await delay(100);
      
      // In production, replace with:
      // const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      // return await response.json();
      
      const product = groceryData.products.find(p => p.id === parseInt(productId));
      
      if (!product) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        };
      }

      return {
        success: true,
        data: product,
        message: 'Product fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch product',
        error: error.message
      };
    }
  }

  // Get brands for a category
  async getBrandsByCategory(categoryName) {
    try {
      await delay(100);
      
      const category = groceryData.categories.find(cat => 
        cat.name.toLowerCase().replace(/\s+/g, '-') === categoryName.toLowerCase()
      );
      
      if (!category) {
        return {
          success: false,
          data: [],
          message: 'Category not found'
        };
      }

      const products = groceryData.products.filter(product =>
        product.subcategory && category.subcategories.includes(product.subcategory)
      );
      
      const brands = [...new Set(products.map(product => product.brand))].sort();

      return {
        success: true,
        data: brands,
        message: 'Brands fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Failed to fetch brands',
        error: error.message
      };
    }
  }

  // Get active departments
  async getActiveDepartments() {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/get_active_department_list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_code: PROJECT_CODE
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch departments',
        error: error.message
      };
    }
  }

  // Get active categories for a department
  async getActiveCategories(departmentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/get_active_categories_list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department_id: departmentId,
          store_code: STORE_CODE,
          project_code: PROJECT_CODE
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch categories',
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
  getCategories,
  getProductsByCategory,
  getAllProducts,
  searchProducts,
  getProductById,
  getBrandsByCategory,
  getActiveDepartments,
  getActiveCategories
} = groceryApiService;
