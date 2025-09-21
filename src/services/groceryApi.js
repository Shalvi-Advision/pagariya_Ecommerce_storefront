// Grocery API Service
// This service handles all grocery-related API calls
// For now, it uses dummy data from groceryData.json
// In production, replace with actual API endpoints

import groceryData from '../groceryData.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Base URL (replace with actual API URL in production)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
}

// Create and export a singleton instance
const groceryApiService = new GroceryApiService();
export default groceryApiService;

// Export individual methods for convenience
export const {
  getCategories,
  getProductsByCategory,
  getAllProducts,
  searchProducts,
  getProductById,
  getBrandsByCategory
} = groceryApiService;
