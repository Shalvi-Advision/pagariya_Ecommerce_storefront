// Products API service functions
import { APP_CONSTANTS } from '../constants';

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

export const fetchProducts = async (params = {}) => {
  try {
    const { category, limit = 20, sort = 'desc' } = params;
    let url = `${API_BASE_URL}/products`;

    const queryParams = new URLSearchParams();
    if (category && category !== 'all') {
      queryParams.append('category', category);
    }
    if (limit) {
      queryParams.append('limit', limit);
    }
    if (sort) {
      queryParams.append('sort', sort);
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error(`Failed to search products: ${response.statusText}`);
    }

    const products = await response.json();
    // Simple client-side search - in a real app, this would be server-side
    const filteredProducts = products.filter(product =>
      product.title.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    );

    return filteredProducts;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};
