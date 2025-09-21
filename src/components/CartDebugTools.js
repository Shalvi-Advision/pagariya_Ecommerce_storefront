import React from 'react';
import { useCart } from '../context/CartContext';

const CartDebugTools = () => {
  const { clearCart, resetToDummyData, totalItems, totalPrice } = useCart();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg z-50">
      <h3 className="text-sm font-bold mb-2">Cart Debug Tools</h3>
      <div className="text-xs mb-2">
        Items: {totalItems} | Total: ₹{totalPrice}
      </div>
      <div className="flex gap-2">
        <button
          onClick={resetToDummyData}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
        >
          Reset to Dummy
        </button>
        <button
          onClick={clearCart}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
};

export default CartDebugTools;
