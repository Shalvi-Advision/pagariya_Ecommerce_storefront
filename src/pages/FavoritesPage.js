import React from 'react';
import { useFavorite } from '../context/FavoriteContext';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';

const FavoritesPage = () => {
  const { favorites } = useFavorite();

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <HeartIcon className="w-16 h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Favorites List is Empty</h1>
          <p className="text-gray-600 mb-8">
            Start adding products to your favorites list by clicking the heart icon on any product.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Favorites</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              _id: product.id,
              product_name: product.name,
              our_price: product.price,
              pcode_img: product.image,
              brand_name: product.brand,
              package_size: product.packageSize.split(' ')[0],
              package_unit: product.packageSize.split(' ')[1],
              product_mrp: product.mrp,
              discount_percentage: product.discountPercentage,
              store_quantity: 1, // This is just for display
              max_quantity_allowed: 10 // This is just for display
            }}
            onAddToCart={() => {}} // You can implement this if needed
          />
        ))}
      </div>
    </div>
  );
};

export default FavoritesPage;

