import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { usePincode } from '../context/PincodeContext';
import { useToast } from '../context/ToastContext';
import { useResponsive } from '../hooks/useResponsive';
import useRazorpay from '../hooks/useRazorpay';
import { getPincodeStores, formatStoreData } from '../api/pincodeService';
import { getAddresses, transformAddressFromAPI } from '../api/addressApi';
import { getDeliverySlots, generateTimeSlotsFromAPI, transformDeliverySlotFromAPI } from '../api/deliverySlotsApi';
import { getEnabledPaymentModes, mapPaymentModeToUI } from '../api/paymentModesApi';
import { COLORS } from '../constants/theme';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { apiPost } from '../services/api';
import cartService from '../services/cartService';
import { PROJECT_CODE } from '../constants';
import './CheckoutPage.css';

const CheckoutPageNew = () => {
    const { items, totalItems, totalPrice, clearCart, clearUserCart } = useCart();
    const { isAuthenticated, user, setSuccessMessage } = useAuth();
    const { addOrder } = useOrders();
    const { getCurrentPincode, confirmedLocation } = usePincode();
    const { showError, showSuccess } = useToast();
    const navigate = useNavigate();
    const { isMobile } = useResponsive();
    const { processPayment, loading: razorpayLoading } = useRazorpay();

    // Current step (1: Delivery Method, 2: Address, 3: Time Slot, 4: Payment)
    const [currentStep, setCurrentStep] = useState(1);

    // State for data
    const [timeSlots, setTimeSlots] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [slotsErrorMessage, setSlotsErrorMessage] = useState(null);
    const [pickupStores, setPickupStores] = useState([]);
    const [isLoadingStores, setIsLoadingStores] = useState(false);
    const [storesError, setStoresError] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [addressesError, setAddressesError] = useState(null);
    const [enabledPaymentModes, setEnabledPaymentModes] = useState([]);
    const [isLoadingPaymentModes, setIsLoadingPaymentModes] = useState(false);
    const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
    const [orderNumber, setOrderNumber] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedDateTab, setSelectedDateTab] = useState(0);
    const [orderNotes, setOrderNotes] = useState('');
    const [showOrderDetails, setShowOrderDetails] = useState(false);

    // Checkout data
    const [checkoutData, setCheckoutData] = useState(() => ({
        selectedPincode: getCurrentPincode() || '',
        deliveryMode: 'home',
        selectedPickupPoint: null,
        selectedAddress: null,
        selectedTimeSlot: null,
        selectedDate: null,
        paymentMethod: 'cod',
    }));

    // Fetch pickup stores
    const fetchPickupStores = async (pincode) => {
        if (!pincode) return;
        setIsLoadingStores(true);
        setStoresError(null);
        try {
            const locationData = localStorage.getItem('confirmedLocation');
            let currentStoreCode = null;
            if (locationData) {
                const location = JSON.parse(locationData);
                currentStoreCode = location?.store?.storeCode || location?.store?.store_code;
            }
            const response = await getPincodeStores(pincode);
            if (response.success && response.data?.length > 0) {
                const formattedStores = response.data.map(formatStoreData);
                const filteredStores = formattedStores.filter(store =>
                    currentStoreCode && store.storeCode === currentStoreCode && store.isEnabled
                );
                setPickupStores(filteredStores.map(store => ({
                    id: store._id,
                    name: store.storeName,
                    address: store.storeAddress,
                    distance: '0.5 km',
                    timings: `${store.storeOpenTime} - ${store.storeDeliveryTime}`,
                    isAvailable: store.isEnabled,
                    storeCode: store.storeCode,
                })));
            }
        } catch (error) {
            setStoresError('Unable to load stores.');
        } finally {
            setIsLoadingStores(false);
        }
    };

    // Load addresses
    useEffect(() => {
        const loadAddresses = async () => {
            setIsLoadingAddresses(true);
            try {
                const response = await getAddresses();
                if (response.success && response.data) {
                    setSavedAddresses(response.data.map(transformAddressFromAPI));
                }
            } catch (error) {
                setAddressesError('Failed to load addresses.');
            } finally {
                setIsLoadingAddresses(false);
            }
        };
        loadAddresses();
    }, []);

    // Load delivery slots
    useEffect(() => {
        const loadSlots = async () => {
            setIsLoadingSlots(true);
            try {
                const response = await getDeliverySlots();
                if (response.success && response.data?.length > 0) {
                    const transformed = response.data.map(transformDeliverySlotFromAPI);
                    setTimeSlots(generateTimeSlotsFromAPI(transformed));
                } else {
                    setSlotsErrorMessage(response.message || 'No slots available');
                }
            } catch (error) {
                setSlotsErrorMessage('Failed to load slots.');
            } finally {
                setIsLoadingSlots(false);
            }
        };
        loadSlots();
    }, []);

    // Load payment modes
    useEffect(() => {
        const loadPaymentModes = async () => {
            setIsLoadingPaymentModes(true);
            try {
                const modes = await getEnabledPaymentModes();
                setEnabledPaymentModes(modes);
                if (modes.length > 0) {
                    const defaultMode = mapPaymentModeToUI(modes[0].name);
                    if (defaultMode) {
                        setCheckoutData(prev => ({ ...prev, paymentMethod: defaultMode }));
                    }
                }
            } catch (error) {
                console.error('Failed to load payment modes');
            } finally {
                setIsLoadingPaymentModes(false);
            }
        };
        loadPaymentModes();
    }, []);

    // Validate delivery mode based on store settings
    useEffect(() => {
        if (confirmedLocation?.store) {
            const { homeDelivery, selfPickup } = confirmedLocation.store;
            if (checkoutData.deliveryMode === 'home' && !homeDelivery && selfPickup) {
                setCheckoutData(prev => ({ ...prev, deliveryMode: 'pickup' }));
            } else if (checkoutData.deliveryMode === 'pickup' && !selfPickup && homeDelivery) {
                setCheckoutData(prev => ({ ...prev, deliveryMode: 'home' }));
            }
        }
    }, [confirmedLocation]);

    // Load stores when pickup mode selected
    useEffect(() => {
        if (checkoutData.deliveryMode === 'pickup') {
            const pincode = getCurrentPincode();
            if (pincode) fetchPickupStores(pincode);
        }
    }, [checkoutData.deliveryMode]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/checkout' } });
        } else if (items.length === 0) {
            navigate('/cart');
        }
    }, [isAuthenticated, items, navigate]);

    // Calculate totals
    const totalSavings = items.reduce((total, item) => {
        return total + (Math.round((Number(item.price) || 0) * 0.2) * (Number(item.quantity) || 1));
    }, 0);

    const getPaymentMethodDetails = (mode) => {
        const map = {
            'POD': { value: 'cod', icon: '💵', name: 'Cash on Delivery', desc: 'Pay when you receive' },
            'Online Payment': { value: 'card', icon: '💳', name: 'Online Payment', desc: 'Cards, UPI, Netbanking' },
        };
        return map[mode] || { value: 'cod', icon: '💳', name: mode, desc: '' };
    };

    const handleContinue = () => {
        if (currentStep === 1) {
            if (checkoutData.deliveryMode) setCurrentStep(2);
        } else if (currentStep === 2) {
            if (checkoutData.deliveryMode === 'home' && checkoutData.selectedAddress) setCurrentStep(3);
            else if (checkoutData.deliveryMode === 'pickup' && checkoutData.selectedPickupPoint) setCurrentStep(3);
        } else if (currentStep === 3) {
            if (checkoutData.selectedTimeSlot) setCurrentStep(4);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
        else navigate('/cart');
    };

    const handlePlaceOrder = async () => {
        if (checkoutData.paymentMethod === 'card') {
            await handleRazorpayPayment();
        } else {
            await placeOrderAfterPayment(null);
        }
    };

    const handleRazorpayPayment = async () => {
        setLoading(true);
        try {
            const valResponse = await cartService.validateCart();
            if (!valResponse.success || (valResponse.validation && !valResponse.validation.valid)) {
                showError('Cart validation failed. Please review your cart.');
                navigate('/cart');
                return;
            }
            processPayment({
                amount: Math.round(totalPrice),
                currency: 'INR',
                prefill: { name: user?.name || '', email: user?.email || '', contact: user?.mobile || '' },
                onSuccess: async (paymentResponse) => {
                    setLoading(false);
                    await placeOrderAfterPayment(paymentResponse);
                },
                onFailure: (error) => {
                    setLoading(false);
                    showError(error.message || 'Payment failed');
                },
            });
        } catch (error) {
            showError('Payment initiation failed');
            setLoading(false);
        }
    };

    const placeOrderAfterPayment = async (paymentResponse) => {
        setLoading(true);
        try {
            const locationData = localStorage.getItem('confirmedLocation');
            const storeCode = locationData ? JSON.parse(locationData)?.store?.storeCode || JSON.parse(locationData)?.store?.store_code : null;
            if (!storeCode) throw new Error('Store code missing');

            const selectedMode = enabledPaymentModes.find(m => mapPaymentModeToUI(m.name) === checkoutData.paymentMethod);
            const paymentModeId = selectedMode?.idpayment_mode || (checkoutData.paymentMethod === 'cod' ? 1 : 2);

            let paymentDetails = { method: checkoutData.paymentMethod === 'cod' ? 'cod' : 'online_payment' };
            if (paymentResponse) {
                paymentDetails = {
                    ...paymentDetails,
                    razorpay_payment_id: paymentResponse.paymentDetails?.paymentId,
                    razorpay_order_id: paymentResponse.paymentDetails?.orderId,
                    payment_status: 'completed',
                };
            }

            const orderPayload = {
                store_code: storeCode,
                project_code: PROJECT_CODE,
                cart_validated: true,
                delivery_slot_id: checkoutData.selectedTimeSlot?.deliverySlotId || checkoutData.selectedTimeSlot?.id,
                delivery_date: checkoutData.selectedDate,
                address_id: checkoutData.selectedAddress?.id,
                payment_mode_id: paymentModeId,
                order_notes: orderNotes,
                payment_details: paymentDetails,
            };

            const response = await apiPost('/orders/place-order', orderPayload);
            if (response.success) {
                clearUserCart();
                setOrderNumber(response.order.order_number);
                setShowOrderSuccessModal(true);
                setSuccessMessage(`Order #${response.order.order_number} placed!`);
                showSuccess('Order placed successfully!');
            } else {
                throw new Error(response.message || 'Failed to place order');
            }
        } catch (error) {
            showError(error.message || 'Order failed');
        } finally {
            setLoading(false);
        }
    };

    const canContinue = () => {
        if (currentStep === 1) return !!checkoutData.deliveryMode;
        if (currentStep === 2) {
            return checkoutData.deliveryMode === 'home' ? !!checkoutData.selectedAddress : !!checkoutData.selectedPickupPoint;
        }
        if (currentStep === 3) return !!checkoutData.selectedTimeSlot;
        return true;
    };

    if (!isAuthenticated || items.length === 0) return null;

    const stepTitles = ['Checkout', 'Delivery Address', 'Delivery Time', 'Payment'];

    return (
        <div className="checkout-container">
            {/* Header */}
            <div className="checkout-header">
                <button className="back-btn" onClick={handleBack}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1>{stepTitles[currentStep - 1]}</h1>
                <div className="timer">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
                    </svg>
                    <span>10:00</span>
                </div>
            </div>

            {/* Step Progress */}
            <div className="step-progress">
                {[1, 2, 3, 4].map((step, idx) => (
                    <div className="step-item" key={step}>
                        <div className={`step-circle ${currentStep > step ? 'completed' : currentStep === step ? 'active' : 'pending'}`}>
                            {currentStep > step ? '✓' : step}
                        </div>
                        {idx < 3 && <div className={`step-line ${currentStep > step ? 'completed' : 'pending'}`} />}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="checkout-content">
                {/* Step 1: Delivery Method */}
                {currentStep === 1 && (
                    <>
                        {confirmedLocation?.store?.homeDelivery && !confirmedLocation?.store?.selfPickup && (
                            <div className="info-banner">
                                <div className="icon">ℹ</div>
                                <div className="text">
                                    <h4>Home Delivery Only</h4>
                                    <p>Only Home Delivery is available</p>
                                </div>
                            </div>
                        )}

                        <h2 className="section-title">Choose Delivery Method</h2>
                        <p className="section-subtitle">How do you want to receive your order?</p>

                        {confirmedLocation?.store?.homeDelivery && (
                            <div
                                className={`delivery-mode-card ${checkoutData.deliveryMode === 'home' ? 'selected' : ''}`}
                                onClick={() => setCheckoutData(prev => ({ ...prev, deliveryMode: 'home' }))}
                            >
                                <div className="icon">🏠</div>
                                <div className="content">
                                    <h4>Home Delivery</h4>
                                    <p>Delivered to your doorstep</p>
                                </div>
                                <div className="radio" />
                            </div>
                        )}

                        {confirmedLocation?.store?.selfPickup && (
                            <div
                                className={`delivery-mode-card ${checkoutData.deliveryMode === 'pickup' ? 'selected' : ''}`}
                                onClick={() => setCheckoutData(prev => ({ ...prev, deliveryMode: 'pickup' }))}
                            >
                                <div className="icon">🏪</div>
                                <div className="content">
                                    <h4>Store Pickup</h4>
                                    <p>Pick up from store</p>
                                </div>
                                <div className="radio" />
                            </div>
                        )}
                    </>
                )}

                {/* Step 2: Address Selection */}
                {currentStep === 2 && (
                    <>
                        <h2 className="section-title">Delivery Address</h2>
                        <p className="section-subtitle">Select delivery address</p>

                        {isLoadingAddresses ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p style={{ marginTop: 12, color: '#71717a' }}>Loading addresses...</p>
                            </div>
                        ) : savedAddresses.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">📍</div>
                                <h4>No saved addresses</h4>
                                <p>Add an address to continue</p>
                            </div>
                        ) : (
                            savedAddresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    className={`address-card ${checkoutData.selectedAddress?.id === addr.id ? 'selected' : ''}`}
                                    onClick={() => setCheckoutData(prev => ({
                                        ...prev,
                                        selectedAddress: { id: addr.id, name: addr.name, address: `${addr.addressLine1}, ${addr.city} ${addr.pinCode}` }
                                    }))}
                                >
                                    <div className="address-card-header">
                                        <div className="icon">📍</div>
                                        <div className="details">
                                            <h4>{addr.name}</h4>
                                            <p>{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city} - {addr.pinCode}</p>
                                            <p className="pin-mobile">PIN: {addr.pinCode}</p>
                                            {addr.isDefault && <span className="default-badge">Default Address</span>}
                                        </div>
                                        <div className="radio" />
                                    </div>
                                </div>
                            ))
                        )}

                        <button className="add-address-btn" onClick={() => navigate('/address')}>
                            + ADD NEW ADDRESS
                        </button>
                    </>
                )}

                {/* Step 3: Time Slot */}
                {currentStep === 3 && (
                    <>
                        <h2 className="section-title">Choose Delivery Time</h2>
                        <p className="section-subtitle">Select delivery time slot</p>

                        {isLoadingSlots ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p style={{ marginTop: 12, color: '#71717a' }}>Loading slots...</p>
                            </div>
                        ) : slotsErrorMessage ? (
                            <div className="empty-state">
                                <div className="icon">⚠️</div>
                                <h4>Slots Unavailable</h4>
                                <p>{slotsErrorMessage}</p>
                            </div>
                        ) : (
                            <>
                                <div className="time-slot-tabs">
                                    {timeSlots.map((dateSlot, idx) => (
                                        <button
                                            key={idx}
                                            className={`time-slot-tab ${selectedDateTab === idx ? 'active' : ''}`}
                                            onClick={() => setSelectedDateTab(idx)}
                                        >
                                            {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dateSlot.date?.split(' ')[1] || dateSlot.date}
                                        </button>
                                    ))}
                                </div>

                                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#18181b', marginBottom: 12 }}>
                                    {timeSlots[selectedDateTab]?.date || 'Today'}
                                </h3>

                                {timeSlots[selectedDateTab]?.slots?.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className={`time-slot-card ${checkoutData.selectedTimeSlot?.id === slot.id ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                                        onClick={() => slot.available && setCheckoutData(prev => ({
                                            ...prev,
                                            selectedDate: timeSlots[selectedDateTab].date,
                                            selectedTimeSlot: slot
                                        }))}
                                    >
                                        <h4>{slot.time}</h4>
                                        <span className="availability">{slot.available ? 'Available' : 'Unavailable'}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && (
                    <>
                        <span className="view-order-link" onClick={() => setShowOrderDetails(true)}>
                            View Order details &gt;
                        </span>

                        <div className="order-summary-section">
                            <div className="header">
                                <span className="icon">📋</span>
                                <h3>ORDER SUMMARY</h3>
                            </div>
                            <div className="order-summary-row">
                                <span className="label">{totalItems} items</span>
                                <span className="value">₹{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="order-summary-row">
                                <span className="label">📦 Distance</span>
                                <span className="value">16.6 km</span>
                            </div>
                            <div className="order-summary-row">
                                <span className="label">🚚 Delivery Fee</span>
                                <span className="value free">FREE</span>
                            </div>
                            <div className="order-summary-row">
                                <span className="label">💰 Savings</span>
                                <span className="value green">₹{totalSavings.toFixed(2)}</span>
                            </div>
                            <div className="order-summary-row total border-top">
                                <span className="label">TOTAL</span>
                                <span className="value">₹{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="free-delivery-badge">
                                ✓ Free delivery for this order
                            </div>
                        </div>

                        <div className="delivery-instructions">
                            <textarea
                                placeholder="Any special instructions for delivery?"
                                rows={2}
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                            />
                        </div>

                        <div className="order-summary-section">
                            <div className="header">
                                <span className="icon">💳</span>
                                <h3>PAYMENT METHOD</h3>
                            </div>
                            <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 14px 0' }}>Select your preferred payment option</p>

                            {isLoadingPaymentModes ? (
                                <div className="loading-state"><div className="loading-spinner" /></div>
                            ) : (
                                enabledPaymentModes.map((mode) => {
                                    const details = getPaymentMethodDetails(mode.name);
                                    return (
                                        <div
                                            key={mode.id}
                                            className={`payment-method-card ${checkoutData.paymentMethod === details.value ? 'selected' : ''}`}
                                            onClick={() => setCheckoutData(prev => ({ ...prev, paymentMethod: details.value }))}
                                        >
                                            <div className="icon">{details.icon}</div>
                                            <div className="content" style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#18181b' }}>{details.name}</h4>
                                                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#71717a' }}>{details.desc}</p>
                                            </div>
                                            <div className="radio" />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                {/* Order Summary Panel (Steps 1-3) */}
                {currentStep < 4 && (
                    <div className="order-summary-panel">
                        <div className="order-summary-row">
                            <span className="label">Order Subtotal</span>
                            <span className="value">₹{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="order-summary-row">
                            <span className="label">🚚 Delivery Fee:</span>
                            <span className="value free">₹0.00</span>
                        </div>
                        <div className="order-summary-row">
                            <span className="label">💰 You Save:</span>
                            <span className="value green">₹{totalSavings.toFixed(2)}</span>
                        </div>
                        <div className="order-summary-row total border-top">
                            <span className="label">Total</span>
                            <span className="value">₹{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            <div className="bottom-action-bar">
                <button
                    className="continue-btn"
                    disabled={!canContinue() || loading}
                    onClick={currentStep === 4 ? handlePlaceOrder : handleContinue}
                >
                    {loading ? 'Processing...' : currentStep === 4 ? 'PLACE ORDER →' : 'CONTINUE'}
                </button>
            </div>

            <OrderSuccessModal
                isVisible={showOrderSuccessModal}
                onClose={() => setShowOrderSuccessModal(false)}
                orderNumber={orderNumber}
            />

            {/* Order Details Bottom Sheet */}
            {showOrderDetails && (
                <div className="order-details-overlay" onClick={() => setShowOrderDetails(false)}>
                    <div className="order-details-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="handle" />
                        <div className="sheet-header">
                            <h3><span className="icon">📋</span> Order Summary</h3>
                            <button className="close-btn" onClick={() => setShowOrderDetails(false)}>×</button>
                        </div>
                        <div className="sheet-content">
                            {/* Product Items */}
                            {items.map((item) => {
                                const itemPrice = Number(item.price) || 0;
                                const itemQty = Number(item.quantity) || 1;
                                return (
                                    <div key={item.id} className="order-item">
                                        <div className="item-image">
                                            {item.image ? (
                                                <img src={item.image} alt={item.title} />
                                            ) : (
                                                <div className="placeholder">📦</div>
                                            )}
                                        </div>
                                        <div className="item-details">
                                            <h4>{item.title}</h4>
                                            <p className="variant">{item.variant || item.size || ''}</p>
                                        </div>
                                        <div className="item-pricing">
                                            <p className="price">₹{(itemPrice * itemQty).toFixed(2)}</p>
                                            <p className="qty">Qty: {itemQty}</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Summary */}
                            <div className="sheet-summary">
                                <div className="summary-row">
                                    <span className="label">Subtotal</span>
                                    <span className="value">₹{totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">📦 Distance</span>
                                    <span className="value">16.6 km</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">🚚 Delivery Fee</span>
                                    <span className="value free">FREE</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">💰 Savings</span>
                                    <span className="value green">₹{totalSavings.toFixed(2)}</span>
                                </div>
                                <div className="summary-row total">
                                    <span className="label">Total</span>
                                    <span className="value">₹{totalPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="sheet-badges">
                                <div className="sheet-badge success">
                                    <span className="badge-icon">✓</span>
                                    Free delivery for this order!
                                </div>
                                <div className="sheet-badge savings">
                                    <span className="badge-icon">💰</span>
                                    You saved ₹{totalSavings.toFixed(2)} on this order!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPageNew;
