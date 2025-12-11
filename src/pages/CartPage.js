import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import cartService from '../services/cartService';
import Button from '../components/Button';
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const CartPage = () => {
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart,
    loading,
    syncing,
    syncError,
    lastSynced,
    validationResult,
    validateCart,
    syncCart,
    isAuthenticated,
    userMobile,
    applyValidationFixes
  } = useCart();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  const [showClearModal, setShowClearModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [cartUpdates, setCartUpdates] = useState([]);
  const [isBackendFixed, setIsBackendFixed] = useState(false);
  const [validating, setValidating] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Calculate savings (assuming 20% discount for demo purposes)
  const calculateSavings = (price) => {
    const validPrice = Number(price) || 0;
    return Math.round(validPrice * 0.2);
  };

  const totalSavings = items.reduce((total, item) => {
    const validPrice = Number(item.price) || 0;
    return total + (calculateSavings(validPrice) * item.quantity);
  }, 0);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    removeItem(itemId);
    showSuccess('Item removed from cart');
  };

  const handleRemoveAll = async () => {
    try {
      await clearCart();
      setShowClearModal(false);
      showSuccess('Cart cleared successfully');
    } catch (error) {
      showError('Failed to clear cart');
    }
  };

  const handleValidateCart = async () => {
    setValidating(true);
    try {
      const result = await validateCart();
      if (result.success) {
        showSuccess('Cart validation successful');
      } else {
        showError(result.message || 'Cart validation failed');
      }
    } catch (error) {
      showError('Failed to validate cart');
    } finally {
      setValidating(false);
    }
  };

  const handleSyncCart = async () => {
    try {
      await syncCart();
      showSuccess('Cart synced successfully');
    } catch (error) {
      showError('Failed to sync cart');
    }
  };

  const handleProceedToCheckout = async () => {
    setProcessingCheckout(true);
    try {
      // Step 1: Save cart to database first (to ensure backend has latest quantities)
      // This is important because quantity updates are debounced, so we need to sync before validation
      if (isAuthenticated) {
        const saveResponse = await cartService.saveCart(items);

        if (!saveResponse.success) {
          showError(saveResponse.message || 'Failed to save cart');
          setProcessingCheckout(false);
          return;
        }
      }

      // Step 2: Validate cart (WITH autoFix=true for server-side correction)
      const validateResponse = await cartService.validateCart(true);

      // Check if API call was successful
      if (!validateResponse.success) {
        showError(validateResponse.message || 'Cart validation failed');
        setProcessingCheckout(false);
        return;
      }

      const validation = validateResponse.validation;

      // Check if Backend Auto-Fixed logic triggered
      if (validation && validation.fixed) {
        setCartUpdates(validation.changes || []);
        setIsBackendFixed(true);
        setShowUpdateModal(true);
        setProcessingCheckout(false);
        return;
      }

      // Check if actual validation passed (validation.valid)
      if (validation && validation.valid === false) {

        // Auto-update cart based on validation items
        const result = await applyValidationFixes(validation.invalidItems);

        if (result.changes && result.changes.length > 0) {
          setCartUpdates(result.changes);
          setShowUpdateModal(true);
          // showInfo("Cart updated based on current stock and prices. Please review and proceed.");
          setProcessingCheckout(false);
          return;
        }

        // Build error message if auto-fix didn't handle everything or user needs to see it
        let errorMessage = 'Cart validation failed. ';

        if (validation.invalidItems && validation.invalidItems.length > 0) {
          const firstInvalidItem = validation.invalidItems[0];
          errorMessage = firstInvalidItem.reason || firstInvalidItem.message || 'Some items are unavailable.';
          if (validation.invalidItems.length > 1) {
            errorMessage += ` (and ${validation.invalidItems.length - 1} more issue${validation.invalidItems.length - 1 > 1 ? 's' : ''})`;
          }
        } else {
          errorMessage = 'Please review your cart items.';
        }

        setValidationError(errorMessage);
        setShowErrorModal(true);
        setProcessingCheckout(false);
        return;
      }

      // Step 3: Navigate to checkout
      navigate('/checkout');

    } catch (error) {
      console.error('Error processing checkout:', error);
      showError(error.message || 'Failed to process checkout');
    } finally {
      setProcessingCheckout(false);
    }
  };

  const formatLastSynced = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

            {/* Left Section - Cart Items */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    My Cart
                    <span className="text-base sm:text-lg font-normal text-gray-500 ml-2">
                      ({totalItems} item{totalItems !== 1 ? 's' : ''})
                    </span>
                  </h1>
                </div>
              </div>

              {/* Column Headers - Hidden on mobile */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
                  <div className="col-span-4">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Product</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">You Pay</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">You Save</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Quantity</span>
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {/* Cart Items */}
                <div className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const itemPrice = Number(item.price) || 0;
                    const itemSavings = calculateSavings(itemPrice);
                    const variant = item.quantity > 1 ? `${item.quantity} units` : '1 unit';

                    return (
                      <div key={item.id} className={`p-3 sm:p-4 lg:p-6 ${validationResult?.validation?.invalidItems?.some(i => i.p_code === item.p_code || i.p_code === item.id) ? 'bg-red-50' : ''}`}>
                        {/* Validation Error Message */}
                        {validationResult?.validation?.invalidItems?.find(i => i.p_code === item.p_code || i.p_code === item.id) && (
                          <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800">
                                {validationResult?.validation?.invalidItems?.find(i => i.p_code === item.p_code || i.p_code === item.id).message}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                {validationResult?.validation?.invalidItems?.find(i => i.p_code === item.p_code || i.p_code === item.id).suggestedAction?.message}
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex gap-3 mb-3">
                            <img
                              src={item.image || '/images/logo.jpg'}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.src = '/images/logo.jpg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                                {item.title}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                Variant: <span className="font-bold">{variant}</span>
                              </p>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-semibold text-gray-900">
                                    ₹{itemPrice}
                                  </span>
                                  <span className="text-xs text-green-600 ml-2">
                                    Save ₹{itemSavings}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                                  title="Remove item"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
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
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                          {/* Product Image & Details */}
                          <div className="col-span-4 flex items-center gap-3 lg:gap-4">
                            <img
                              src={item.image || '/images/logo.jpg'}
                              alt={item.title}
                              className="w-12 h-12 lg:w-16 lg:h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.src = '/images/logo.jpg';
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-xs lg:text-sm leading-tight">
                                {item.title} : {variant}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Variant: <span className="font-bold">{variant}</span>
                              </p>
                            </div>
                          </div>

                          {/* You Pay */}
                          <div className="col-span-2 text-center">
                            <span className="text-xs lg:text-sm font-semibold text-gray-900">
                              ₹{itemPrice}
                            </span>
                          </div>

                          {/* You Save */}
                          <div className="col-span-2 text-center">
                            <span className="text-xs lg:text-sm font-semibold text-green-600">
                              ₹{itemSavings}
                            </span>
                          </div>

                          {/* Quantity Controls */}
                          <div className="col-span-3 flex items-center justify-center gap-2">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="w-6 h-6 lg:w-8 lg:h-8 bg-green-600 hover:bg-green-700 text-white rounded-l-lg flex items-center justify-center transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <MinusIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                              </button>
                              <span className="px-2 lg:px-3 py-1 text-xs lg:text-sm font-medium min-w-[1.5rem] lg:min-w-[2rem] text-center bg-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="w-6 h-6 lg:w-8 lg:h-8 bg-green-600 hover:bg-green-700 text-white rounded-r-lg flex items-center justify-center transition-colors"
                              >
                                <PlusIcon className="w-3 h-3 lg:w-4 lg:h-4" />
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
                              <TrashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Remove All and Action Buttons */}
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={() => setShowClearModal(true)}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span className="text-xs sm:text-sm font-medium">Remove all</span>
                    </button>

                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-4 sm:top-8">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">Price Summary</h2>

                <div className="space-y-3 sm:space-y-4">
                  {/* Cart Total */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">Cart Total</span>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">₹{totalPrice}</span>
                  </div>

                  {/* Delivery Charge */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-sm sm:text-base">Delivery Charge</span>
                      <InformationCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    </div>
                    <span className="text-red-500 text-xs sm:text-sm">+ Extra</span>
                  </div>

                  {/* Savings */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 text-sm sm:text-base">Savings</span>
                    <span className="font-semibold text-green-600 text-sm sm:text-base">₹{totalSavings}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleProceedToCheckout}
                  disabled={processingCheckout}
                  className="w-full mt-4 sm:mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  {processingCheckout ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">PROCEED TO CHECKOUT</span>
                      <span className="sm:hidden">CHECKOUT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Clear Cart</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>


              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to remove all items from your cart? This will permanently delete all {totalItems} item{totalItems !== 1 ? 's' : ''} from your cart.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Update Summary Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cart Updated</h3>
            <p className="text-sm text-gray-600 mb-4">The following changes were made to your cart based on current availability and prices:</p>
            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
              {cartUpdates.map((change, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {change.type === 'remove' && <TrashIcon className="w-5 h-5 text-red-500 mt-0.5" />}
                  {change.type === 'quantity' && <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />}
                  {change.type === 'price' && <InformationCircleIcon className="w-5 h-5 text-yellow-500 mt-0.5" />}

                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{change.item}</p>
                    <p className="text-gray-600">
                      {change.type === 'remove' && 'Removed from cart (Out of Stock)'}
                      {change.type === 'quantity' && `Quantity adjusted to ${change.to} (Limited Stock)`}
                      {change.type === 'price' && `Price updated to ₹${change.to}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowUpdateModal(false);
                if (isBackendFixed) {
                  window.location.reload();
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Okay, Review Cart
            </button>
          </div>
        </div>
      )}

      {/* Cart Validation Error Modal - For errors that cannot be auto-fixed */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <ExclamationTriangleIcon className="w-8 h-8" />
              <h3 className="text-lg font-bold text-gray-900">Cart Issue</h3>
            </div>
            <p className="text-sm text-gray-700 mb-6 font-medium">{validationError}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  // User acknowledges the error
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                autoFocus
              >
                Okay, I'll Fix It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CartPage;
