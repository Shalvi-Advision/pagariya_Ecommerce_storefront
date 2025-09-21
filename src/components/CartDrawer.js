import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useResponsive } from '../hooks/useResponsive';
import {
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const { isMobile } = useResponsive();

  // Calculate savings (assuming 20% discount for demo purposes)
  const calculateSavings = (price) => {
    return Math.round(price * 0.2);
  };

  const totalSavings = items.reduce((total, item) => {
    return total + (calculateSavings(item.price) * item.quantity);
  }, 0);

  const originalTotal = totalPrice + totalSavings;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isMobile ? 'w-full sm:w-96' : 'w-96'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">My cart</h2>
              <p className="text-sm text-gray-500">{totalItems} items</p>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="flex gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Savings</p>
              <p className="text-lg font-bold text-gray-900">₹{totalSavings}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Cart Total</p>
              <p className="text-lg font-bold text-gray-900">₹{totalPrice}</p>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-400 text-sm">Add some items to get started!</p>
            </div>
          ) : (
            items.map((item) => {
              const itemSavings = calculateSavings(item.price);
              const originalPrice = item.price + itemSavings;
              
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                        {item.title} : {item.quantity > 1 ? `${item.quantity} units` : '1 unit'}
                      </h3>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <span className="text-xs text-gray-500">You Pay</span>
                          <p className="font-bold text-gray-900">₹{item.price}</p>
                        </div>
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                          You Save ₹{itemSavings}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mb-3">
                        Variant: <span className="font-bold">{item.quantity > 1 ? `${item.quantity} units` : '1 unit'}</span>
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <MinusIcon className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors"
                          >
                            <PlusIcon className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          {items.length > 0 ? (
            <Link
              to="/cart"
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center block"
            >
              VIEW FULL CART
            </Link>
          ) : (
            <Link
              to="/"
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center block"
            >
              START SHOPPING
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
