import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../api/productsApi';
import { useCart } from '../context/CartContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Carousel from '../components/Carousel';
import PopularCategories from '../components/PopularCategories';
import SeasonalCategories from '../components/SeasonalCategories';
import ProductCard from '../components/ProductCard';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await fetchProducts();
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addItem(product);
  };

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading size="large" text="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={loadProducts}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Carousel */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <Carousel />
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <PopularCategories />

      {/* Seasonal Categories */}
      <SeasonalCategories />

      {/* Products Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-8" id="products">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fresh Products</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our wide range of fresh groceries, household items, and daily essentials
            </p>
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">📦</span>
              </div>
              <p className="text-gray-500 text-lg mb-4">No products found.</p>
              <p className="text-gray-400 text-sm">Check back later for fresh products!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
