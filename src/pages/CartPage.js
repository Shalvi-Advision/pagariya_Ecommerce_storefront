import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usePincode } from '../context/PincodeContext';
import { useToast } from '../context/ToastContext';
import cartService from '../services/cartService';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { COLORS } from '../constants/theme';
import OffersSection from '../components/OffersSection';
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
import { CheckCircleIcon as CheckCircleSolid, TagIcon } from '@heroicons/react/24/solid';

const CartPage = () => {
  const {
    items,
    totalItems,
    totalPrice,
    addItem,
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
    fetchCart,
    isAuthenticated,
    userMobile,
    applyValidationFixes
  } = useCart();
  const { confirmedLocation } = usePincode();
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
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const isUpdatingCartRef = useRef(false);

  // Offers state
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [dealItemsInCart, setDealItemsInCart] = useState([]);

  // Calculate discount from selected offer
  const offerDiscount = selectedOffer?.unlocked ? (selectedOffer.effective_discount || 0) : 0;

  // Calculate savings from MRP vs selling price
  const totalSavings = items.reduce((total, item) => {
    const mrp = Number(item.product_mrp || item.mrp || 0);
    const price = Number(item.price || item.our_price || 0);
    const saving = mrp > price ? (mrp - price) * item.quantity : 0;
    return total + saving;
  }, 0);

  const handleOfferSelect = useCallback((offer) => {
    setSelectedOffer(offer);
  }, []);

  const handleDealAdd = (dealProduct, offerId) => {
    // Add deal product to cart at deal price
    const cartItem = {
      id: dealProduct.p_code,
      p_code: dealProduct.p_code,
      title: dealProduct.product_name,
      product_name: dealProduct.product_name,
      price: dealProduct.deal_price,
      unit_price: dealProduct.deal_price,
      our_price: dealProduct.deal_price,
      product_mrp: dealProduct.original_price,
      mrp: dealProduct.original_price,
      quantity: 1,
      image: dealProduct.pcode_img,
      pcode_img: dealProduct.pcode_img,
    };
    addItem(cartItem, 1);
    setDealItemsInCart(prev => [...prev, { offer_id: offerId, p_code: dealProduct.p_code, quantity: 1 }]);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 0) return;
    if (newQuantity === 0) {
      removeItem(itemId);
      showSuccess('Item removed from cart');
    } else {
      updateQuantity(itemId, newQuantity);
    }
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
        isUpdatingCartRef.current = true;
        setIsUpdatingCart(true);
        setCartUpdates(validation.changes || []);
        setIsBackendFixed(true);
        
        // Fetch updated cart from backend
        try {
          if (isAuthenticated && fetchCart) {
            await fetchCart();
          }
        } catch (error) {
          console.error('Error fetching updated cart:', error);
        }
        
        // Small delay to allow backend changes to reflect in cart state
        setTimeout(() => {
          isUpdatingCartRef.current = false;
          setIsUpdatingCart(false);
        setShowUpdateModal(true);
        setProcessingCheckout(false);
        }, 500);
        return;
      }

      // Check if actual validation passed (validation.valid)
      if (validation && validation.valid === false) {

        // Set updating state to show loader during cart updates (use ref for immediate availability)
        isUpdatingCartRef.current = true;
        setIsUpdatingCart(true);
        
        try {
        // Auto-update cart based on validation items
        const result = await applyValidationFixes(validation.invalidItems);

        if (result.changes && result.changes.length > 0) {
          setCartUpdates(result.changes);
          setShowUpdateModal(true);
          // showInfo("Cart updated based on current stock and prices. Please review and proceed.");
          setProcessingCheckout(false);
          return;
          }
        } finally {
          // Small delay to ensure cart state has updated before hiding loader
          setTimeout(() => {
            isUpdatingCartRef.current = false;
            setIsUpdatingCart(false);
          }, 300);
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

      // Step 3: Store offer data for checkout
      if (selectedOffer?.unlocked) {
        sessionStorage.setItem('checkout_offer', JSON.stringify({
          offer_id: selectedOffer._id,
          discount: selectedOffer.effective_discount,
        }));
      } else {
        sessionStorage.removeItem('checkout_offer');
      }
      if (dealItemsInCart.length > 0) {
        sessionStorage.setItem('checkout_deal_items', JSON.stringify(dealItemsInCart));
      } else {
        sessionStorage.removeItem('checkout_deal_items');
      }

      // Step 4: Navigate to checkout
      navigate('/checkout');

    } catch (error) {
      console.error('Error processing checkout:', error);
      showError(error.message || 'Failed to process checkout');
      isUpdatingCartRef.current = false;
      setIsUpdatingCart(false); // Ensure loader is hidden on error
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

  // Render checkout section (reusable for mobile fixed and desktop sticky)
  const renderCheckoutSection = (isMobile = false, hideButton = false) => {
    const store = confirmedLocation?.store;
    const minAmountRaw = store?.minOrderAmount || store?.min_order_amount;
    const minOrderAmount = parseFloat(minAmountRaw || 0);
    const currentTotal = parseFloat(totalPrice || 0);
    const isBelowMinOrder = minOrderAmount > 0 && currentTotal < minOrderAmount;

    return (
      <div className={isMobile ? "p-4" : "p-4 sm:p-6"}>
          <h2 className={`${isMobile ? "text-sm mb-3" : "text-base sm:text-lg mb-4 sm:mb-6"} font-bold text-gray-900`}>Price Summary</h2>

          <div className={isMobile ? "space-y-3" : "space-y-3 sm:space-y-4"}>
            {/* Cart Total */}
            <div className={`flex justify-between items-center ${isMobile ? "py-1" : "py-2"} border-b`} style={{ borderColor: COLORS.gray[200] }}>
              <span className={`font-bold ${isMobile ? "text-xs" : "text-sm sm:text-base"}`} style={{ color: COLORS.gray[900] }}>Cart Total</span>
              <span className={`font-bold ${isMobile ? "text-xs" : "text-sm sm:text-base"}`} style={{ color: COLORS.gray[900] }}>₹{totalPrice}</span>
            </div>

            {/* Delivery Charge */}
            <div className={`flex justify-between items-center ${isMobile ? "py-1" : "py-2"} border-b`} style={{ borderColor: COLORS.gray[200] }}>
              <div className="flex items-center gap-1">
                <span className={`${isMobile ? "text-xs" : "text-sm sm:text-base"}`} style={{ color: COLORS.gray[700] }}>Delivery Charge</span>
                {!isMobile && <InformationCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: COLORS.gray[400] }} />}
              </div>
              <span className={`${isMobile ? "text-xs" : "text-xs sm:text-sm"}`} style={{ color: COLORS.error[500] }}>+ Extra</span>
            </div>

            {/* Savings */}
            {totalSavings > 0 && (
              <div className={`flex justify-between items-center ${isMobile ? "py-1" : "py-2"} border-b`} style={{ borderColor: COLORS.gray[200] }}>
                <span className={`${isMobile ? "text-xs" : "text-sm sm:text-base"}`} style={{ color: COLORS.gray[700] }}>Savings</span>
                <span className={`font-semibold ${isMobile ? "text-xs" : "text-sm sm:text-base"}`} style={{ color: COLORS.success[600] }}>-₹{totalSavings}</span>
              </div>
            )}

            {/* Offer Discount */}
            {offerDiscount > 0 && (
              <div className={`flex justify-between items-center ${isMobile ? "py-1" : "py-2"}`}>
                <div className="flex items-center gap-1">
                  <TagIcon className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} style={{ color: COLORS.success[600] }} />
                  <span className={`${isMobile ? "text-xs" : "text-sm sm:text-base"}`} style={{ color: COLORS.success[700] }}>Offer Discount</span>
                </div>
                <span className={`font-semibold ${isMobile ? "text-xs" : "text-sm sm:text-base"}`} style={{ color: COLORS.success[600] }}>-₹{offerDiscount}</span>
              </div>
            )}
          </div>

          {/* Minimum Order Warning */}
          {isBelowMinOrder && (
            <div className={`${isMobile ? "mt-3 p-3" : "mt-4 p-3"} bg-primary-50 border border-primary-200 rounded-lg ${isMobile ? "text-sm" : "text-sm"} text-primary-800`}>
              <p className={`font-medium flex items-center ${isMobile ? "gap-2" : "gap-2"}`}>
                <InformationCircleIcon className={`${isMobile ? "w-5 h-5" : "w-5 h-5"} flex-shrink-0`} />
                Minimum order amount is ₹{minOrderAmount}
              </p>
              <p className={`${isMobile ? "mt-1.5 text-xs" : "mt-1 text-xs"} text-primary-700 ${isMobile ? "pl-7" : "pl-7"}`}>
                Add items worth ₹{minOrderAmount - currentTotal} more to proceed
              </p>
            </div>
          )}

          {/* Checkout Button */}
          {!hideButton && <button
            onClick={handleProceedToCheckout}
            disabled={processingCheckout || isBelowMinOrder}
            className={`w-full ${isMobile ? "mt-2 py-2" : "mt-4 sm:mt-6 py-2.5 sm:py-3"} px-3 sm:px-4 text-white font-bold rounded-lg transition-colors ${isMobile ? "text-sm" : "text-sm sm:text-base"} flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70`}
            style={{
              backgroundColor: (processingCheckout || isBelowMinOrder)
                ? COLORS.gray[400]
                : COLORS.primary[600]
            }}
            onMouseEnter={(e) => {
              if (!processingCheckout && !isBelowMinOrder) {
                e.target.style.backgroundColor = COLORS.primary[700];
              }
            }}
            onMouseLeave={(e) => {
              if (!processingCheckout && !isBelowMinOrder) {
                e.target.style.backgroundColor = COLORS.primary[600];
              }
            }}
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
          </button>}
      </div>
    );
  };

  // Show loader if cart is being updated (even if items appear empty temporarily)
  // Check both state and ref to catch updates immediately
  // Also show loader if update modal is open (cart might be updating)
  // Also show loader if cart context is loading (fetching from backend)
  const shouldShowLoader = isUpdatingCart || isUpdatingCartRef.current || loading || (processingCheckout && items.length === 0) || (validating && items.length === 0) || (showUpdateModal && items.length === 0);
  
  if (shouldShowLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.gray[50] }}>
        <Loading size="large" text="Updating your cart..." />
      </div>
    );
  }

  // Show empty cart message only when not updating, not processing checkout, not validating, update modal is not open, and cart is not loading
  // Also check ref to ensure we don't show empty cart during updates
  if (items.length === 0 && !processingCheckout && !isUpdatingCart && !isUpdatingCartRef.current && !validating && !showUpdateModal && !loading) {
    return (
      <div className="container mx-auto px-4 py-16" style={{ backgroundColor: COLORS.gray[50] }}>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto" style={{ color: COLORS.gray[400] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.gray[900] }}>Your cart is empty</h2>
          <p className="mb-8" style={{ color: COLORS.gray[600] }}>
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
    <div style={{ backgroundColor: COLORS.gray[50] }}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8" style={{
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

            {/* Left Section - Cart Items */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.gray[900] }}>
                    My Cart
                    <span className="text-base sm:text-lg font-normal ml-2" style={{ color: COLORS.gray[500] }}>
                      ({totalItems} item{totalItems !== 1 ? 's' : ''})
                    </span>
                  </h1>
                </div>
              </div>

              {/* Offers Section */}
              <OffersSection
                onOfferSelect={handleOfferSelect}
                onDealAdd={handleDealAdd}
                selectedOfferId={selectedOffer?._id}
              />

              {/* Column Headers - Hidden on mobile */}
              <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray[200], borderWidth: '1px', borderStyle: 'solid' }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ backgroundColor: COLORS.gray[50], borderColor: COLORS.gray[200] }}>
                  <div className="col-span-4">
                    <span className="text-xs sm:text-sm font-medium" style={{ color: COLORS.gray[700] }}>Product</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs sm:text-sm font-medium" style={{ color: COLORS.gray[700] }}>You Pay</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs sm:text-sm font-medium" style={{ color: COLORS.gray[700] }}>You Save</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="text-xs sm:text-sm font-medium" style={{ color: COLORS.gray[700] }}>Quantity</span>
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {/* Cart Items - Scrollable on mobile */}
                <div 
                  className="divide-y lg:divide-y lg:max-h-none lg:overflow-visible" 
                  style={{ 
                    borderColor: COLORS.gray[200],
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {items.map((item, index) => {
                    const itemPrice = Number(item.price) || 0;
                    const itemMrp = Number(item.product_mrp || item.mrp || 0);
                    const itemSavings = itemMrp > itemPrice ? Math.round(itemMrp - itemPrice) : 0;
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
                          <div className="flex gap-3">
                            {/* Product Image */}
                            <img
                              src={item.image || '/images/default_image.jpg'}
                              alt={item.title}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                              style={{ borderColor: COLORS.gray[200], borderWidth: '1px', borderStyle: 'solid' }}
                              onError={(e) => {
                                e.target.src = '/images/default_image.jpg';
                              }}
                            />
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-sm leading-tight" style={{ color: COLORS.gray[900] }}>
                                  {item.title}
                                </h3>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1.5 rounded-md flex-shrink-0 transition-colors"
                                  style={{ color: COLORS.error[400], backgroundColor: COLORS.error[50] }}
                                  title="Remove item"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: COLORS.gray[500] }}>
                                {item.packageSize || variant}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div>
                                  <span className="text-sm font-bold" style={{ color: COLORS.gray[900] }}>
                                    You Pay ₹{itemPrice}
                                  </span>
                                  <p className="text-xs mt-0.5" style={{ color: COLORS.success[600] }}>
                                    You Save ₹{itemSavings}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center rounded-lg" style={{ borderColor: COLORS.gray[300], borderWidth: '1px', borderStyle: 'solid' }}>
                                    <button
                                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                      className="w-8 h-8 text-white rounded-l-lg flex items-center justify-center transition-colors"
                                      style={{
                                        backgroundColor: item.quantity <= 0 ? COLORS.gray[400] : COLORS.primary[600]
                                      }}
                                      disabled={item.quantity <= 0}
                                    >
                                      <MinusIcon className="w-4 h-4" />
                                    </button>
                                    <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center" style={{ backgroundColor: COLORS.white }}>
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                      className="w-8 h-8 text-white rounded-r-lg flex items-center justify-center transition-colors"
                                      style={{ backgroundColor: COLORS.primary[600] }}
                                    >
                                      <PlusIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <span className="text-[10px] mt-1" style={{ color: COLORS.gray[400] }}>Max 10 items</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                          {/* Product Image & Details */}
                          <div className="col-span-4 flex items-center gap-3 lg:gap-4">
                            <img
                              src={item.image || '/images/default_image.jpg'}
                              alt={item.title}
                              className="w-12 h-12 lg:w-16 lg:h-16 object-cover rounded-lg flex-shrink-0"
                              style={{ borderColor: COLORS.gray[200], borderWidth: '1px', borderStyle: 'solid' }}
                              onError={(e) => {
                                e.target.src = '/images/default_image.jpg';
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-xs lg:text-sm leading-tight" style={{ color: COLORS.gray[900] }}>
                                {item.title} : {variant}
                              </h3>
                              <p className="text-xs mt-1" style={{ color: COLORS.gray[500] }}>
                                Variant: <span className="font-bold">{variant}</span>
                              </p>
                            </div>
                          </div>

                          {/* You Pay */}
                          <div className="col-span-2 text-center">
                            <span className="text-xs lg:text-sm font-semibold" style={{ color: COLORS.gray[900] }}>
                              ₹{itemPrice}
                            </span>
                          </div>

                          {/* You Save */}
                          <div className="col-span-2 text-center">
                            <span className="text-xs lg:text-sm font-semibold" style={{ color: COLORS.success[600] }}>
                              ₹{itemSavings}
                            </span>
                          </div>

                          {/* Quantity Controls */}
                          <div className="col-span-3 flex items-center justify-center gap-2">
                            <div className="flex items-center rounded-lg" style={{ borderColor: COLORS.gray[300], borderWidth: '1px', borderStyle: 'solid' }}>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="w-6 h-6 lg:w-8 lg:h-8 text-white rounded-l-lg flex items-center justify-center transition-colors"
                                style={{
                                  backgroundColor: item.quantity <= 0 ? COLORS.gray[400] : COLORS.primary[600]
                                }}
                                onMouseEnter={(e) => {
                                  if (item.quantity > 0) {
                                    e.target.style.backgroundColor = COLORS.primary[700];
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (item.quantity > 0) {
                                    e.target.style.backgroundColor = COLORS.primary[600];
                                  }
                                }}
                                disabled={item.quantity <= 0}
                              >
                                <MinusIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                              </button>
                              <span className="px-2 lg:px-3 py-1 text-xs lg:text-sm font-medium min-w-[1.5rem] lg:min-w-[2rem] text-center" style={{ backgroundColor: COLORS.white }}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="w-6 h-6 lg:w-8 lg:h-8 text-white rounded-r-lg flex items-center justify-center transition-colors"
                                style={{ backgroundColor: COLORS.primary[600] }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.primary[700]}
                                onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.primary[600]}
                              >
                                <PlusIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="col-span-1 flex justify-center">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 transition-colors"
                              style={{ color: COLORS.gray[600] }}
                              onMouseEnter={(e) => e.target.style.color = COLORS.error[600]}
                              onMouseLeave={(e) => e.target.style.color = COLORS.gray[600]}
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
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t" style={{ borderColor: COLORS.gray[200] }}>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={() => setShowClearModal(true)}
                      className="flex items-center gap-2 transition-colors"
                      style={{ color: COLORS.error[500] }}
                      onMouseEnter={(e) => e.target.style.color = COLORS.error[700]}
                      onMouseLeave={(e) => e.target.style.color = COLORS.error[500]}
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span className="text-xs sm:text-sm font-medium">Remove all</span>
                    </button>

                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Price Summary (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-4 sm:top-8">
                {renderCheckoutSection(false)}
              </div>
            </div>
          </div>

          {/* Inline Price Summary (Mobile Only) */}
          <div className="lg:hidden mt-4 bg-white rounded-lg shadow-sm border border-gray-200">
            {renderCheckoutSection(true, true)}
          </div>
        </div>
      </div>

      {/* Fixed Checkout Button (Mobile Only) */}
      <div
        className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <button
          onClick={handleProceedToCheckout}
          disabled={processingCheckout}
          className="w-full py-3 px-4 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ backgroundColor: processingCheckout ? COLORS.gray[400] : COLORS.primary[600] }}
        >
          {processingCheckout ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>CHECKOUT</span>
          )}
        </button>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-lg shadow-xl max-w-md w-full" style={{ backgroundColor: COLORS.white }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.error[100] }}>
                  <ExclamationTriangleIcon className="w-6 h-6" style={{ color: COLORS.error[600] }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: COLORS.gray[900] }}>Clear Cart</h3>
                  <p className="text-sm" style={{ color: COLORS.gray[500] }}>This action cannot be undone</p>
                </div>


              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to remove all items from your cart? This will permanently delete all {totalItems} item{totalItems !== 1 ? 's' : ''} from your cart.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
                  style={{
                    color: COLORS.gray[700],
                    backgroundColor: COLORS.gray[100]
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = COLORS.gray[200];
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = COLORS.gray[100];
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveAll}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                  style={{
                    backgroundColor: COLORS.error[600]
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = COLORS.error[700];
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = COLORS.error[600];
                  }}
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
              onClick={async () => {
                setShowUpdateModal(false);
                if (isBackendFixed) {
                  window.location.reload();
                } else {
                  // Fetch updated cart to ensure we have latest state
                  // This prevents empty cart message from showing if cart was updated
                  setIsUpdatingCart(true);
                  isUpdatingCartRef.current = true;
                  
                  try {
                    if (isAuthenticated && fetchCart) {
                      await fetchCart();
                      // Wait for React to re-render with updated cart items
                      // The loading state from cart context will keep loader visible until cart is loaded
                      await new Promise(resolve => setTimeout(resolve, 400));
                    } else {
                      // For guest users, just wait a bit for state to settle
                      await new Promise(resolve => setTimeout(resolve, 300));
                    }
                  } catch (error) {
                    console.error('Error fetching cart after update:', error);
                    // Even on error, wait a bit to prevent flash of empty cart
                    await new Promise(resolve => setTimeout(resolve, 300));
                  } finally {
                    // Clear updating state after a delay
                    // The render logic checks both isUpdatingCart and loading state
                    // So loader will stay visible if cart context is still loading
                    setTimeout(() => {
                      isUpdatingCartRef.current = false;
                      setIsUpdatingCart(false);
                    }, 300);
                  }
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
