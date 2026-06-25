import React from 'react';
import { DEFAULT_PRODUCT_IMAGE, onProductImageError } from '../utils/imageUtils';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usePincode } from '../context/PincodeContext';
import { useResponsive } from '../hooks/useResponsive';
import {
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import {
  calcItemUnitSaving,
  calcTotalSavings,
  formatRupee,
  roundMoney,
} from '../utils/formatMoney';

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const { confirmedLocation } = usePincode();
  const { isMobile } = useResponsive();

  const totalSavings = calcTotalSavings(items);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isMobile ? 'w-full sm:w-96' : 'w-96'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">My cart</h2>
              <p className="text-xs sm:text-sm text-gray-500">{totalItems} items</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-gray-500">Savings</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900">{formatRupee(totalSavings)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900">{formatRupee(totalPrice)}</p>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
          {items.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ShoppingCartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-base sm:text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-400 text-xs sm:text-sm">Add some items to get started!</p>
            </div>
          ) : (
            items.map((item) => {
              const itemSavings = calcItemUnitSaving(item);

              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex gap-2 sm:gap-3">
                    {/* Product Image */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image || DEFAULT_PRODUCT_IMAGE}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          onProductImageError(e);
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
                        {item.title} : {item.quantity > 1 ? `${item.quantity} units` : '1 unit'}
                      </h3>

                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div>
                          <span className="text-xs text-gray-500">You Pay</span>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">{formatRupee(item.price)}</p>
                        </div>
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                          Save {formatRupee(itemSavings)}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mb-2 sm:mb-3">
                        Variant: <span className="font-bold">{item.quantity > 1 ? `${item.quantity} units` : '1 unit'}</span>
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem(item.id);
                              } else {
                                updateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                            disabled={item.quantity <= 0}
                          >
                            <MinusIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                          </button>
                          <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium min-w-[1.5rem] sm:min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors"
                          >
                            <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
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
        <div className="border-t border-gray-200 p-3 sm:p-4 flex-shrink-0">
          {(() => {
            const store = confirmedLocation?.store;
            const minAmountRaw = store?.minOrderAmount || store?.min_order_amount;
            const minOrderAmount = roundMoney(minAmountRaw || 0);
            const currentTotal = roundMoney(totalPrice || 0);
            const isBelowMinOrder = items.length > 0 && minOrderAmount > 0 && currentTotal < minOrderAmount;

            if (isBelowMinOrder) {
              return (
                <div className="mb-3 p-2 bg-primary-50 border border-primary-200 rounded text-xs text-primary-800">
                  <p className="flex items-center gap-1 font-medium">
                    <InformationCircleIcon className="w-4 h-4" />
                    Min order: {formatRupee(minOrderAmount)}
                  </p>
                  <p className="pl-5 text-primary-700">
                    Add {formatRupee(roundMoney(minOrderAmount - currentTotal))} more
                  </p>
                </div>
              );
            }
            return null;
          })()}

          {items.length > 0 ? (
            <Link
              to="/cart"
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-center block text-sm sm:text-base"
            >
              <span className="hidden sm:inline">VIEW FULL CART</span>
              <span className="sm:hidden">VIEW CART</span>
            </Link>
          ) : (
            <Link
              to="/"
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-center block text-sm sm:text-base"
            >
              <span className="hidden sm:inline">START SHOPPING</span>
              <span className="sm:hidden">SHOP NOW</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
