import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const CartPage = () => {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  // Calculate savings (assuming 20% discount for demo purposes)
  const calculateSavings = (price) => {
    return Math.round(price * 0.2);
  };

  const totalSavings = items.reduce((total, item) => {
    return total + (calculateSavings(item.price) * item.quantity);
  }, 0);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    removeItem(itemId);
  };

  const handleRemoveAll = () => {
    clearCart();
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link to="/">
            <Button size="large">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Section - Cart Items */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  My Cart
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    ({totalItems} item{totalItems !== 1 ? 's' : ''})
                  </span>
                </h1>
              </div>

              {/* Column Headers */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="col-span-4">
                    <span className="text-sm font-medium text-gray-700">Product</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium text-gray-700">You Pay</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium text-gray-700">You Save</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="text-sm font-medium text-gray-700">No. of items</span>
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {/* Cart Items */}
                <div className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const itemSavings = calculateSavings(item.price);
                    const variant = item.quantity > 1 ? `${item.quantity} units` : '1 unit';
                    
                    return (
                      <div key={item.id} className="p-6">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Product Image & Details */}
                          <div className="col-span-4 flex items-center gap-4">
                            <img
                              src={item.image || '/placeholder-product.jpg'}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.src = '/placeholder-product.jpg';
                              }}
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {item.title} : {variant}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Variant: <span className="font-bold">{variant}</span>
                              </p>
                            </div>
                          </div>

                          {/* You Pay */}
                          <div className="col-span-2 text-center">
                            <span className="text-sm font-semibold text-gray-900">
                              ₹{item.price}
                            </span>
                          </div>

                          {/* You Save */}
                          <div className="col-span-2 text-center">
                            <span className="text-sm font-semibold text-green-600">
                              ₹{itemSavings}
                            </span>
                          </div>

                          {/* Quantity Controls */}
                          <div className="col-span-3 flex items-center justify-center gap-2">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-l-lg flex items-center justify-center transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <MinusIcon className="w-4 h-4" />
                              </button>
                              <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center bg-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-r-lg flex items-center justify-center transition-colors"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="col-span-1 flex justify-center">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                              title="Remove item"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Remove All */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={handleRemoveAll}
                    className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Remove all</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section - Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Price Summary</h2>
                
                <div className="space-y-4">
                  {/* Cart Total */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-bold text-gray-900">Cart Total</span>
                    <span className="font-bold text-gray-900">₹{totalPrice}</span>
                  </div>

                  {/* Delivery Charge */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">Delivery Charge</span>
                      <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-red-500 text-sm">+ Extra</span>
                  </div>

                  {/* Savings */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Savings</span>
                    <span className="font-semibold text-green-600">₹{totalSavings}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
