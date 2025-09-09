import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const ProductCard = ({ product, onAddToCart }) => {
  // Calculate discount
  const originalPrice = product.price * 1.55; // MRP calculation
  const discount = Math.round(originalPrice - product.price);
  const unitPrice = (product.price / 1000).toFixed(2); // Assuming 1kg = 1000g

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200" style={{ width: '280px', height: '420px' }}>
      {/* Product Image */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative bg-orange-50 p-4 h-40 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.title}
            className="max-w-full max-h-full object-contain"
          />
          {/* Vegetarian Badge */}
          <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-4 flex flex-col justify-between" style={{ height: 'calc(420px - 160px)' }}>
        <div>
          {/* Product Name */}
          <Link to={`/product/${product.id}`}>
            <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2 hover:text-green-600 transition-colors leading-tight">
              {product.title}
            </h3>
          </Link>

          {/* Pricing Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <div className="text-xs text-gray-500">MRP</div>
                  <div className="text-sm text-gray-500 line-through">₹{originalPrice.toFixed(0)}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">DMart</div>
                  <div className="text-lg font-bold text-gray-900">₹{product.price}</div>
                </div>
              </div>
              <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">
                ₹{discount} OFF
              </div>
            </div>
            <p className="text-xs text-gray-500">(Inclusive of all taxes)</p>
          </div>

          {/* Quantity Selector */}
          <div className="mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
              <span className="text-xs text-gray-600">1 kg (₹{unitPrice} / 1 g)</span>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors duration-200 mt-4"
        >
          <ShoppingCartIcon className="w-4 h-4" />
          ADD TO CART
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
