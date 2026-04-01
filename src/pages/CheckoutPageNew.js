import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ClipboardDocumentListIcon, 
    MapPinIcon, 
    TruckIcon, 
    CurrencyDollarIcon,
    CheckCircleIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContextOptimized';
import { useOrders } from '../context/OrderContext';
import { usePincode } from '../context/PincodeContext';
import { useToast } from '../context/ToastContext';
import { useResponsive } from '../hooks/useResponsive';
import useRazorpay from '../hooks/useRazorpay';
import { getPincodeStores, formatStoreData } from '../api/pincodeService';
import { getAddresses, transformAddressFromAPI } from '../api/addressApi';
import { getDeliverySlots, generateTimeSlotsFromAPI, transformDeliverySlotFromAPI } from '../api/deliverySlotsApi';
import { COLORS } from '../constants/theme';
import { getEnabledPaymentModes, mapPaymentModeToUI } from '../api/paymentModesApi';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { apiPost } from '../services/api';
import cartService from '../services/cartService';
import { PROJECT_CODE } from '../constants';

const CheckoutPageNew = () => {
    const { items, totalItems, totalPrice, clearCart, clearUserCart } = useCart();
    const { isAuthenticated, user } = useAuth();
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
    
    // Session timeout state
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);

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
            const { homeDelivery, selfPickup } = getDeliveryOptions(confirmedLocation.store);
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

    // Session timeout initialization and persistence
    useEffect(() => {
        const SESSION_STORAGE_KEY = 'checkout_session_start';
        const SESSION_DURATION = 600; // 10 minutes in seconds

        // Check for existing session in sessionStorage
        const storedStartTime = sessionStorage.getItem(SESSION_STORAGE_KEY);
        const now = Date.now();

        if (storedStartTime) {
            const elapsed = Math.floor((now - parseInt(storedStartTime)) / 1000);
            const remaining = SESSION_DURATION - elapsed;

            if (remaining > 0) {
                // Continue existing session
                setSessionStartTime(parseInt(storedStartTime));
                setTimeRemaining(remaining);
            } else {
                // Session expired, start new one
                sessionStorage.setItem(SESSION_STORAGE_KEY, now.toString());
                setSessionStartTime(now);
                setTimeRemaining(SESSION_DURATION);
            }
        } else {
            // Start new session
            sessionStorage.setItem(SESSION_STORAGE_KEY, now.toString());
            setSessionStartTime(now);
            setTimeRemaining(SESSION_DURATION);
        }

        // Cleanup function
        return () => {
            // Clear session storage when component unmounts (unless order was placed)
            // We'll handle clearing on successful order placement separately
        };
    }, []);

    // Session timeout timer
    useEffect(() => {
        if (!sessionStartTime || isSessionExpired) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - sessionStartTime) / 1000);
            const remaining = 600 - elapsed; // 10 minutes = 600 seconds

            if (remaining <= 0) {
                // Session expired
                setTimeRemaining(0);
                setIsSessionExpired(true);
                setShowTimeoutModal(true);
                clearInterval(interval);
                // Clear session storage
                sessionStorage.removeItem('checkout_session_start');
            } else {
                setTimeRemaining(remaining);
            }
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, [sessionStartTime, isSessionExpired]);

    // Calculate totals
    const totalSavings = items.reduce((total, item) => {
        return total + (Math.round((Number(item.price) || 0) * 0.2) * (Number(item.quantity) || 1));
    }, 0);

    // Helper function to get delivery options from store (handles both formatted and raw API formats)
    const getDeliveryOptions = (store) => {
        if (!store) return { homeDelivery: false, selfPickup: false };
        
        // Debug logging to inspect store structure
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Store data structure:', {
                store,
                hasHomeDelivery: 'homeDelivery' in store,
                hasSelfPickup: 'selfPickup' in store,
                hasDeliveryOptions: 'delivery_options' in store,
                deliveryOptions: store.delivery_options
            });
        }
        
        // Check for formatted properties first (camelCase)
        let homeDelivery = store.homeDelivery;
        let selfPickup = store.selfPickup;
        
        // If not found, check raw API format (snake_case in delivery_options)
        if (homeDelivery === undefined && store.delivery_options) {
            const hd = store.delivery_options.home_delivery;
            homeDelivery = typeof hd === 'boolean' ? hd : hd === 'yes' || hd === true;
        }
        
        if (selfPickup === undefined && store.delivery_options) {
            const sp = store.delivery_options.self_pickup;
            selfPickup = typeof sp === 'boolean' ? sp : sp === 'yes' || sp === true;
        }
        
        // Default to false if still undefined
        const result = {
            homeDelivery: homeDelivery === true || homeDelivery === 'yes',
            selfPickup: selfPickup === true || selfPickup === 'yes'
        };
        
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Parsed delivery options:', result);
        }
        
        return result;
    };

    const getPaymentMethodDetails = (mode) => {
        const map = {
            'POD': { value: 'cod', icon: '💵', name: 'Cash on Delivery', desc: 'Pay when you receive' },
            'Online Payment': { value: 'card', icon: '💳', name: 'Online Payment', desc: 'Cards, UPI, Netbanking' },
        };
        return map[mode] || { value: 'cod', icon: '💳', name: mode, desc: '' };
    };

    const handleContinue = () => {
        if (isSessionExpired) {
            showError('Your checkout session has expired. Please try again.');
            setShowTimeoutModal(true);
            return;
        }
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
        if (isSessionExpired) {
            showError('Your checkout session has expired. Please try again.');
            setShowTimeoutModal(true);
            return;
        }
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
                // Get order number from response (handle different possible structures)
                const orderNum = response.order?.order_number || response.order_number || response.orderNumber || response.data?.order_number;
                
                // Clear session storage immediately
                sessionStorage.removeItem('checkout_session_start');
                
                // Set order number and show modal
                setOrderNumber(orderNum);
                setShowOrderSuccessModal(true);
            } else {
                throw new Error(response.message || 'Failed to place order');
            }
        } catch (error) {
            showError(error.message || 'Order failed');
        } finally {
            setLoading(false);
        }
    };

    // Format time remaining as MM:SS
    const formatTimeRemaining = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const canContinue = () => {
        if (isSessionExpired) return false;
        if (currentStep === 1) return !!checkoutData.deliveryMode;
        if (currentStep === 2) {
            return checkoutData.deliveryMode === 'home' ? !!checkoutData.selectedAddress : !!checkoutData.selectedPickupPoint;
        }
        if (currentStep === 3) return !!checkoutData.selectedTimeSlot;
        return true;
    };

    // Allow rendering if modal is showing, even if cart is empty (cart gets cleared after order)
    if (!isAuthenticated || (items.length === 0 && !showOrderSuccessModal)) return null;

    const stepTitles = ['Checkout', 'Delivery Address', 'Delivery Time', 'Payment'];

    // Colors for dynamic styling (gradients, etc.)
    const colors = {
        primary: COLORS.primary[500],
        primaryDark: COLORS.primary[600],
        primaryLight: COLORS.primary[100],
        surface: COLORS.white,
        border: COLORS.gray[200],
        borderLight: COLORS.gray[100],
        text: {
            primary: COLORS.gray[900],
            secondary: COLORS.gray[500],
            tertiary: COLORS.gray[400],
        },
    };

    // Spacing values for consistent layout
    const spacing = {
        xs: '4px',
        sm: '12px',
        md: '16px',
        lg: '24px',
    };

    return (
        <>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div className={`min-h-screen flex flex-col overflow-hidden w-full max-w-full mx-auto ${
                isMobile 
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600' 
                    : 'max-w-[900px] px-5 sm:px-8 py-8 bg-gray-50'
            }`}>
            {/* Header with Step Progress */}
            <div 
                className={`flex flex-col gap-2 sm:gap-3 flex-shrink-0 ${
                    isMobile 
                        ? 'fixed top-[148px] left-0 right-0 z-[60] px-3 py-3 bg-gradient-to-br from-primary-500 to-primary-600 shadow-md' 
                        : 'relative px-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-200 mb-4'
                }`}
            >
                {/* Top Row: Back Button, Title, Timer */}
                <div className="flex items-center justify-between w-full">
                    <button 
                        className={`flex items-center justify-center rounded-lg transition-all duration-200 ${
                            isMobile 
                                ? 'p-1.5 bg-white/10 text-white hover:bg-white/20 hover:scale-105' 
                                : 'p-2 text-gray-900 hover:bg-gray-100'
                        }`}
                        onClick={handleBack}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className={`font-bold m-0 tracking-tight ${
                        isMobile 
                            ? 'text-sm text-white' 
                            : 'text-base text-gray-900'
                    }`}>
                        {stepTitles[currentStep - 1]}
                    </h1>
                    <div className={`flex items-center gap-1 rounded-lg font-semibold ${
                        isMobile 
                            ? `px-2.5 py-1 text-[11px] backdrop-blur-md ${
                                timeRemaining <= 120 
                                    ? 'bg-red-500/20 text-red-100' 
                                    : 'bg-white/15 text-white'
                            }` 
                            : `px-3 py-1.5 text-xs ${
                                timeRemaining <= 120 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-primary-100 text-primary-700'
                            }`
                    }`}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
                        </svg>
                        <span>{formatTimeRemaining(timeRemaining)}</span>
                    </div>
                </div>

                {/* Step Progress Circles */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full pt-2 pb-1">
                    {[1, 2, 3, 4].map((step, idx) => {
                        const isActive = currentStep >= step;
                        return (
                            <div key={step} className="flex items-center gap-1.5 sm:gap-2">
                                <div className={`flex items-center justify-center font-bold rounded-full transition-all duration-300 ${
                                    isMobile
                                        ? `w-7 h-7 text-[11px] ${
                                            isActive 
                                                ? 'bg-white text-primary-500 shadow-lg' 
                                                : 'bg-white/20 text-white'
                                        }`
                                        : `w-8 h-8 text-xs ${
                                            isActive 
                                                ? 'bg-primary-500 text-white shadow-md' 
                                                : 'bg-gray-100 text-gray-400'
                                        }`
                                }`}>
                                    {currentStep > step ? '✓' : step}
                                </div>
                                {idx < 3 && (
                                    <div className={`h-0.5 transition-all duration-300 ${
                                        isMobile
                                            ? `w-5 ${isActive ? 'bg-white' : 'bg-white/20'}`
                                            : `w-7 ${isActive ? 'bg-primary-500' : 'bg-gray-200'}`
                                    }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className={`bg-white flex-1 overflow-y-auto overflow-x-hidden relative z-10 w-full max-w-full ${
                isMobile 
                    ? 'rounded-t-[20px] px-3 pt-[150px] pb-[100px]' 
                    : 'rounded-2xl p-4 shadow-lg border border-gray-200'
            }`}>
                {/* Step 1: Delivery Method */}
                {currentStep === 1 && (() => {
                    const { homeDelivery, selfPickup } = getDeliveryOptions(confirmedLocation?.store);
                    
                    return (
                        <>
                            {homeDelivery && !selfPickup && (
                                <div className="bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-500 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 mb-4 shadow-sm">
                                    <div className="w-7 h-2 sm:w-8 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0">ℹ</div>
                                    <div className="flex-1">
                                        <h4 className="text-primary-700 text-xs sm:text-sm font-bold mb-0.5">Home Delivery Only</h4>
                                        <p className="text-primary-600 text-xs sm:text-[13px] m-0">Only Home Delivery is available</p>
                                    </div>
                                </div>
                            )}

                            <h2 className={`font-extrabold text-gray-900 mb-1 tracking-tight ${
                                isMobile ? 'text-base' : 'text-lg'
                            }`}>
                                Choose Delivery Method
                            </h2>
                            <p className={`text-gray-600 mb-4 leading-relaxed ${
                                isMobile ? 'text-[13px]' : 'text-sm'
                            }`}>
                                How do you want to receive your order?
                            </p>

                            {homeDelivery && (
                                <div
                                    className={`rounded-2xl cursor-pointer transition-all duration-300 mb-2 w-full ${
                                        checkoutData.deliveryMode === 'home'
                                            ? 'bg-gradient-to-br from-primary-50 to-white border-2 border-primary-500 shadow-lg -translate-y-0.5'
                                            : 'bg-white border-2 border-gray-200 shadow-sm hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5'
                                    } ${
                                        isMobile ? 'flex-col items-start p-2' : 'flex-row items-center p-3'
                                    } flex gap-1 sm:gap-2`}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, deliveryMode: 'home' }))}
                                >
                                    <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl sm:text-[22px] shadow-lg flex-shrink-0">🏠</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold text-gray-900 mb-1 tracking-tight ${
                                            isMobile ? 'text-[15px]' : 'text-base'
                                        }`}>
                                            Home Delivery
                                        </h4>
                                        <p className={`text-gray-600 m-0 leading-relaxed ${
                                            isMobile ? 'text-xs' : 'text-[13px]'
                                        }`}>
                                            Delivered to your doorstep
                                        </p>
                                    </div>
                                    <div className={`flex items-center justify-center flex-shrink-0 rounded-full transition-all duration-300 ${
                                        checkoutData.deliveryMode === 'home'
                                            ? 'bg-primary-500 border-2 border-primary-500'
                                            : 'bg-transparent border-2 border-gray-200'
                                    } ${
                                        isMobile ? 'w-5 h-5' : 'w-6 h-6'
                                    }`}>
                                        {checkoutData.deliveryMode === 'home' && (
                                            <div className={`bg-white rounded-full ${
                                                isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'
                                            }`} />
                                        )}
                                    </div>
                                </div>
                            )}

                            {selfPickup && (
                                <div
                                    className={`rounded-2xl cursor-pointer transition-all duration-300 mb-2 w-full ${
                                        checkoutData.deliveryMode === 'pickup'
                                            ? 'bg-gradient-to-br from-primary-50 to-white border-2 border-primary-500 shadow-lg -translate-y-0.5'
                                            : 'bg-white border-2 border-gray-200 shadow-sm hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5'
                                    } ${
                                        isMobile ? 'flex-col items-start p-3' : 'flex-row items-center p-4'
                                    } flex gap-2 sm:gap-3`}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, deliveryMode: 'pickup' }))}
                                >
                                    <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl sm:text-[22px] shadow-lg flex-shrink-0">🏪</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold text-gray-900 mb-1 tracking-tight ${
                                            isMobile ? 'text-[15px]' : 'text-base'
                                        }`}>
                                            Store Pickup
                                        </h4>
                                        <p className={`text-gray-600 m-0 leading-relaxed ${
                                            isMobile ? 'text-xs' : 'text-[13px]'
                                        }`}>
                                            Pick up from store
                                        </p>
                                    </div>
                                    <div className={`flex items-center justify-center flex-shrink-0 rounded-full transition-all duration-300 ${
                                        checkoutData.deliveryMode === 'pickup'
                                            ? 'bg-primary-500 border-2 border-primary-500'
                                            : 'bg-transparent border-2 border-gray-200'
                                    } ${
                                        isMobile ? 'w-5 h-5' : 'w-6 h-6'
                                    }`}>
                                        {checkoutData.deliveryMode === 'pickup' && (
                                            <div className={`bg-white rounded-full ${
                                                isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'
                                            }`} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}

                {/* Step 2: Address Selection */}
                {currentStep === 2 && (
                    <>
                        {checkoutData.deliveryMode === 'pickup' ? (
                            <>
                                <h2 className={`font-extrabold text-gray-900 mb-1 tracking-tight ${
                                    isMobile ? 'text-base' : 'text-lg'
                                }`}>
                                    Pickup Store
                                </h2>
                                <p className={`text-gray-600 mb-4 leading-relaxed ${
                                    isMobile ? 'text-[13px]' : 'text-sm'
                                }`}>
                                    Select pickup store location
                                </p>

                                {isLoadingStores ? (
                                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-4">
                                        <div className={`border-3 border-gray-200 border-t-primary-500 rounded-full animate-spin ${
                                            isMobile ? 'w-10 h-10' : 'w-12 h-12'
                                        }`} />
                                        <p className={`mt-4 text-gray-600 font-medium ${
                                            isMobile ? 'text-sm' : 'text-[15px]'
                                        }`}>
                                            Loading stores...
                                        </p>
                                    </div>
                                ) : storesError ? (
                                    <div className="text-center py-6 sm:py-8 px-4 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
                                        <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl sm:text-[32px] shadow-md`}>
                                            ⚠️
                                        </div>
                                        <h4 className={`font-bold text-gray-900 mb-2 tracking-tight ${
                                            isMobile ? 'text-base' : 'text-lg'
                                        }`}>
                                            Unable to load stores
                                        </h4>
                                        <p className={`text-gray-600 m-0 leading-relaxed ${
                                            isMobile ? 'text-sm' : 'text-[15px]'
                                        }`}>
                                            {storesError}
                                        </p>
                                    </div>
                                ) : pickupStores.length === 0 ? (
                                    <div className="text-center py-6 sm:py-8 px-4 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
                                        <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl sm:text-[32px] shadow-md`}>
                                            🏪
                                        </div>
                                        <h4 className={`font-bold text-gray-900 mb-2 tracking-tight ${
                                            isMobile ? 'text-base' : 'text-lg'
                                        }`}>
                                            No stores available
                                        </h4>
                                        <p className={`text-gray-600 m-0 leading-relaxed ${
                                            isMobile ? 'text-sm' : 'text-[15px]'
                                        }`}>
                                            No pickup stores found for your location
                                        </p>
                                    </div>
                                ) : (
                                    pickupStores.map((store) => {
                                        const isSelected = checkoutData.selectedPickupPoint?.id === store.id;
                                        return (
                                            <div
                                                key={store.id}
                                                className={`rounded-2xl cursor-pointer transition-all duration-300 mb-2 ${
                                                    isSelected
                                                        ? 'bg-gradient-to-br from-primary-50 to-white border-2 border-primary-500 shadow-lg -translate-y-0.5'
                                                        : 'bg-white border-2 border-gray-200 shadow-sm hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5'
                                                } ${
                                                    isMobile ? 'p-3' : 'p-4'
                                                }`}
                                                onClick={() => setCheckoutData(prev => ({
                                                    ...prev,
                                                    selectedPickupPoint: store
                                                }))}
                                            >
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div className={`bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg ${
                                                        isMobile ? 'w-10 h-10 text-lg' : 'w-11 h-11 text-xl'
                                                    }`}>
                                                        🏪
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-bold text-gray-900 mb-1 tracking-tight ${
                                                            isMobile ? 'text-[15px]' : 'text-base'
                                                        }`}>
                                                            {store.name}
                                                        </h4>
                                                        <p className={`text-gray-600 mb-1 leading-relaxed ${
                                                            isMobile ? 'text-[13px]' : 'text-sm'
                                                        }`}>
                                                            {store.address}
                                                        </p>
                                                        <p className={`text-gray-400 mt-1 ${
                                                            isMobile ? 'text-xs' : 'text-[13px]'
                                                        }`}>
                                                            {store.timings}
                                                        </p>
                                                        {store.distance && (
                                                            <span className="inline-block bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-md mt-1 uppercase tracking-wider">
                                                                {store.distance}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`flex items-center justify-center flex-shrink-0 rounded-full transition-all duration-300 ${
                                                        isSelected
                                                            ? 'bg-primary-500 border-2 border-primary-500'
                                                            : 'bg-transparent border-2 border-gray-200'
                                                    } ${
                                                        isMobile ? 'w-5 h-5' : 'w-6 h-6'
                                                    }`}>
                                                        {isSelected && (
                                                            <div className={`bg-white rounded-full ${
                                                                isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'
                                                            }`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        ) : (
                            <>
                                <h2 className={`font-extrabold text-gray-900 mb-1 tracking-tight ${
                                    isMobile ? 'text-base' : 'text-lg'
                                }`}>
                                    Delivery Address
                                </h2>
                                <p className={`text-gray-600 mb-4 leading-relaxed ${
                                    isMobile ? 'text-[13px]' : 'text-sm'
                                }`}>
                                    Select delivery address
                                </p>

                                {isLoadingAddresses ? (
                                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-4">
                                        <div className={`border-3 border-gray-200 border-t-primary-500 rounded-full animate-spin ${
                                            isMobile ? 'w-10 h-10' : 'w-12 h-12'
                                        }`} />
                                        <p className={`mt-4 text-gray-600 font-medium ${
                                            isMobile ? 'text-sm' : 'text-[15px]'
                                        }`}>
                                            Loading addresses...
                                        </p>
                                    </div>
                                ) : savedAddresses.length === 0 ? (
                                    <div className="text-center py-6 sm:py-8 px-4 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
                                        <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl sm:text-[32px] shadow-md`}>
                                            📍
                                        </div>
                                        <h4 className={`font-bold text-gray-900 mb-2 tracking-tight ${
                                            isMobile ? 'text-base' : 'text-lg'
                                        }`}>
                                            No saved addresses
                                        </h4>
                                        <p className={`text-gray-600 m-0 leading-relaxed ${
                                            isMobile ? 'text-sm' : 'text-[15px]'
                                        }`}>
                                            Add an address to continue
                                        </p>
                                    </div>
                                ) : (
                                    savedAddresses.map((addr) => {
                                        const isSelected = checkoutData.selectedAddress?.id === addr.id;
                                        return (
                                            <div
                                                key={addr.id}
                                                className={`rounded-2xl cursor-pointer transition-all duration-300 mb-2 ${
                                                    isSelected
                                                        ? 'bg-gradient-to-br from-primary-50 to-white border-2 border-primary-500 shadow-lg -translate-y-0.5'
                                                        : 'bg-white border-2 border-gray-200 shadow-sm hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5'
                                                } ${
                                                    isMobile ? 'p-3' : 'p-4'
                                                }`}
                                                onClick={() => setCheckoutData(prev => ({
                                                    ...prev,
                                                    selectedAddress: { id: addr.id, name: addr.name, address: `${addr.addressLine1}, ${addr.city} ${addr.pinCode}` }
                                                }))}
                                            >
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div className={`bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg ${
                                                        isMobile ? 'w-10 h-10 text-lg' : 'w-11 h-11 text-xl'
                                                    }`}>
                                                        📍
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-bold text-gray-900 mb-1 tracking-tight ${
                                                            isMobile ? 'text-[15px]' : 'text-base'
                                                        }`}>
                                                            {addr.name}
                                                        </h4>
                                                        <p className={`text-gray-600 mb-1 leading-relaxed ${
                                                            isMobile ? 'text-[13px]' : 'text-sm'
                                                        }`}>
                                                            {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city} - {addr.pinCode}
                                                        </p>
                                                        <p className={`text-gray-400 mt-1 ${
                                                            isMobile ? 'text-xs' : 'text-[13px]'
                                                        }`}>
                                                            PIN: {addr.pinCode}
                                                        </p>
                                                        {addr.isDefault && (
                                                            <span className="inline-block bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-md mt-1 uppercase tracking-wider">
                                                                Default Address
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`flex items-center justify-center flex-shrink-0 rounded-full transition-all duration-300 ${
                                                        isSelected
                                                            ? 'bg-primary-500 border-2 border-primary-500'
                                                            : 'bg-transparent border-2 border-gray-200'
                                                    } ${
                                                        isMobile ? 'w-5 h-5' : 'w-6 h-6'
                                                    }`}>
                                                        {isSelected && (
                                                            <div className={`bg-white rounded-full ${
                                                                isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'
                                                            }`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                <button 
                                    className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-3 sm:p-4 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all duration-300 w-full text-primary-500 text-[13px] sm:text-sm font-bold mt-2 hover:border-primary-500 hover:bg-primary-50 hover:-translate-y-0.5 hover:shadow-md"
                                    onClick={() => navigate('/address')}
                                >
                                    + ADD NEW ADDRESS
                                </button>
                            </>
                        )}
                    </>
                )}

                {/* Step 3: Time Slot */}
                {currentStep === 3 && (
                    <>
                        <h2 className={`font-extrabold text-gray-900 mb-1 tracking-tight ${
                            isMobile ? 'text-base' : 'text-lg'
                        }`}>
                            Choose Delivery Time
                        </h2>
                        <p className={`text-gray-600 mb-4 leading-relaxed ${
                            isMobile ? 'text-[13px]' : 'text-sm'
                        }`}>
                            Select delivery time slot
                        </p>

                        {isLoadingSlots ? (
                            <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-4">
                                <div className={`border-3 border-gray-200 border-t-primary-500 rounded-full animate-spin ${
                                    isMobile ? 'w-10 h-10' : 'w-12 h-12'
                                }`} />
                                <p className={`mt-4 text-gray-600 font-medium ${
                                    isMobile ? 'text-sm' : 'text-[15px]'
                                }`}>
                                    Loading slots...
                                </p>
                            </div>
                        ) : slotsErrorMessage ? (
                            <div className="text-center py-6 sm:py-8 px-4 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl sm:text-[32px] shadow-md`}>
                                    ⚠️
                                </div>
                                <h4 className={`font-bold text-gray-900 mb-2 tracking-tight ${
                                    isMobile ? 'text-base' : 'text-lg'
                                }`}>
                                    Slots Unavailable
                                </h4>
                                <p className={`text-gray-600 m-0 leading-relaxed ${
                                    isMobile ? 'text-sm' : 'text-[15px]'
                                }`}>
                                    {slotsErrorMessage}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className={`flex gap-2 sm:gap-3 mb-4 sm:mb-5 pb-1 ${
                                    isMobile ? 'flex-col' : 'flex-row overflow-x-auto'
                                }`}>
                                    {timeSlots.map((dateSlot, idx) => {
                                        const isActive = selectedDateTab === idx;
                                        return (
                                            <button
                                                key={idx}
                                                className={`rounded-xl font-bold cursor-pointer whitespace-nowrap transition-all duration-300 border-2 ${
                                                    isActive
                                                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500 text-white shadow-lg'
                                                        : 'bg-white border-gray-200 text-gray-600 shadow-sm hover:border-primary-500'
                                                } ${
                                                    isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 sm:px-4 py-2 text-[13px]'
                                                }`}
                                                onClick={() => setSelectedDateTab(idx)}
                                            >
                                                {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dateSlot.date?.split(' ')[1] || dateSlot.date}
                                            </button>
                                        );
                                    })}
                                </div>

                                <h3 className={`font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight ${
                                    isMobile ? 'text-sm' : 'text-[15px]'
                                }`}>
                                    {timeSlots[selectedDateTab]?.date || 'Today'}
                                </h3>

                                {timeSlots[selectedDateTab]?.slots?.map((slot) => {
                                    const isSelected = checkoutData.selectedTimeSlot?.id === slot.id;
                                    return (
                                        <div
                                            key={slot.id}
                                            className={`rounded-xl w-full flex flex-row items-center justify-between transition-all duration-300 mb-1 ${
                                                isSelected
                                                    ? 'bg-gradient-to-br from-primary-50 to-white border-2 border-primary-500 shadow-lg -translate-y-0.5'
                                                    : slot.available
                                                        ? 'bg-white border-2 border-gray-200 shadow-sm hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                                                        : 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                                            } ${
                                                isMobile ? 'p-3' : 'p-4'
                                            }`}
                                            onClick={() => slot.available && setCheckoutData(prev => ({
                                                ...prev,
                                                selectedDate: timeSlots[selectedDateTab].date,
                                                selectedTimeSlot: slot
                                            }))}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <h4 className={`font-bold m-0 tracking-tight ${
                                                    slot.available ? 'text-gray-900' : 'text-gray-400'
                                                } ${
                                                    isMobile ? 'text-sm' : 'text-[15px]'
                                                }`}>
                                                    {slot.time}
                                                </h4>
                                                <span className={`font-semibold ${
                                                    slot.available ? 'text-primary-500' : 'text-gray-400'
                                                } ${
                                                    isMobile ? 'text-[11px]' : 'text-xs'
                                                }`}>
                                                    {slot.available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div className={`bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                    isMobile ? 'w-5 h-5' : 'w-6 h-6'
                                                }`}>
                                                    <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && (
                    <>
                        <span 
                            className="flex items-center gap-1.5 text-primary-500 text-xs sm:text-[13px] font-semibold mb-2 cursor-pointer transition-colors duration-200 hover:text-primary-600"
                            onClick={() => setShowOrderDetails(true)}
                        >
                            View Order details &gt;
                        </span>

                        <div className="bg-white rounded-2xl p-3 sm:p-4 mb-2 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-100">
                                <ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                                <h3 className="text-xs sm:text-[13px] font-extrabold text-primary-500 m-0 uppercase tracking-wider">
                                    ORDER SUMMARY
                                </h3>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className={`text-gray-600 ${
                                    isMobile ? 'text-xs' : 'text-[13px]'
                                }`}>
                                    {totalItems} items
                                </span>
                                <span className={`text-gray-900 font-semibold ${
                                    isMobile ? 'text-xs' : 'text-[13px]'
                                }`}>
                                    ₹{totalPrice.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className={`flex items-center gap-1.5 text-gray-600 ${
                                    isMobile ? 'text-xs' : 'text-[13px]'
                                }`}>
                                    <MapPinIcon className="w-3.5 h-3.5" />
                                    Distance
                                </span>
                                <span className={`text-gray-900 font-semibold ${
                                    isMobile ? 'text-xs' : 'text-[13px]'
                                }`}>
                                    16.6 km
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className={`flex items-center gap-1.5 text-gray-600 ${
                                    isMobile ? 'text-xs' : 'text-[13px]'
                                }`}>
                                    <TruckIcon className="w-3.5 h-3.5" />
                                    Delivery Fee
                                </span>
                                <span className={`text-primary-500 font-bold ${
                                    isMobile ? 'text-xs' : 'text-[13px]'
                                }`}>
                                    FREE
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className={`flex items-center gap-1.5 text-gray-600 ${
                                    isMobile ? 'text-xs' : 'text-[13px]'
                                }`}>
                                    <CurrencyDollarIcon className="w-3.5 h-3.5" />
                                    Savings
                                </span>
                                <span className={`text-primary-500 font-semibold ${
                                    isMobile ? 'text-xs' : 'text-[13px]'
                                }`}>
                                    ₹{totalSavings.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-t-2 border-gray-200 mt-2 sm:mt-3 pt-2 sm:pt-3">
                                <span className={`font-extrabold text-gray-900 ${
                                    isMobile ? 'text-base' : 'text-lg'
                                }`}>
                                    TOTAL
                                </span>
                                <span className={`font-extrabold text-primary-500 ${
                                    isMobile ? 'text-lg' : 'text-[22px]'
                                }`}>
                                    ₹{totalPrice.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-primary-50 text-primary-700 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold mt-2 sm:mt-3">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Free delivery for this order
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 mb-2 shadow-sm">
                            <textarea
                                placeholder="Any special instructions for delivery?"
                                rows={2}
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                className="w-full border-none resize-none outline-none font-inherit bg-transparent text-gray-900 placeholder-gray-400"
                                style={{
                                    fontSize: isMobile ? '12px' : '13px'
                                }}
                            />
                        </div>

                        <div className="bg-white rounded-2xl p-3 sm:p-4 mb-2 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-100">
                                <span className="text-base sm:text-lg">💳</span>
                                <h3 className="text-xs sm:text-[13px] font-extrabold text-primary-500 m-0 uppercase tracking-wider">
                                    PAYMENT METHOD
                                </h3>
                            </div>
                            <p className={`text-gray-600 m-0 mb-2 sm:mb-3 leading-relaxed ${
                                isMobile ? 'text-xs' : 'text-[13px]'
                            }`}>
                                Select your preferred payment option
                            </p>

                            {isLoadingPaymentModes ? (
                                <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-4">
                                    <div className="w-10 h-10 border-3 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 sm:gap-4">
                                    {enabledPaymentModes.map((mode) => {
                                        const details = getPaymentMethodDetails(mode.name);
                                        const isSelected = checkoutData.paymentMethod === details.value;
                                        return (
                                            <div
                                                key={mode.id}
                                                className={`rounded-2xl cursor-pointer transition-all duration-300 flex items-center gap-2 sm:gap-3 ${
                                                    isSelected
                                                        ? 'bg-gradient-to-br from-primary-50 to-white border-2 border-primary-500 shadow-lg -translate-y-0.5'
                                                        : 'bg-white border-2 border-gray-200 shadow-sm hover:border-primary-500 hover:shadow-md'
                                                } ${
                                                    isMobile ? 'p-3' : 'p-4'
                                                }`}
                                                onClick={() => setCheckoutData(prev => ({ ...prev, paymentMethod: details.value }))}
                                            >
                                                <div className={`bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                    isMobile ? 'w-11 h-11 text-xl' : 'w-12 h-12 text-[22px]'
                                                }`}>
                                                    {details.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`m-0 font-bold text-gray-900 tracking-tight ${
                                                        isMobile ? 'text-[15px]' : 'text-base'
                                                    }`}>
                                                        {details.name}
                                                    </h4>
                                                    <p className={`mt-1 text-gray-600 leading-snug ${
                                                        isMobile ? 'text-xs' : 'text-[13px]'
                                                    }`}>
                                                        {details.desc}
                                                    </p>
                                                </div>
                                                <div className={`flex items-center justify-center flex-shrink-0 rounded-full transition-all duration-300 ${
                                                    isSelected
                                                        ? 'bg-primary-500 border-2 border-primary-500'
                                                        : 'bg-transparent border-2 border-gray-200'
                                                } ${
                                                    isMobile ? 'w-5 h-5' : 'w-6 h-6'
                                                }`}>
                                                    {isSelected && (
                                                        <div className={`bg-white rounded-full ${
                                                            isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'
                                                        }`} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Order Summary Panel (Steps 1-3) */}
                {currentStep < 4 && (
                    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-lg mt-4 border border-gray-200">
                        <div className="flex justify-between items-center py-1">
                            <span className={`text-gray-600 ${
                                isMobile ? 'text-xs' : 'text-[13px]'
                            }`}>
                                Order Subtotal
                            </span>
                            <span className={`text-gray-900 font-semibold ${
                                isMobile ? 'text-xs' : 'text-[13px]'
                            }`}>
                                ₹{totalPrice.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className={`flex items-center gap-1.5 text-gray-600 ${
                                isMobile ? 'text-xs' : 'text-[13px]'
                            }`}>
                                <TruckIcon className="w-3.5 h-3.5" />
                                Delivery Fee:
                            </span>
                            <span className={`text-primary-500 font-bold ${
                                isMobile ? 'text-xs' : 'text-[13px]'
                            }`}>
                                ₹0.00
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className={`flex items-center gap-1.5 text-gray-600 ${
                                isMobile ? 'text-xs' : 'text-[13px]'
                            }`}>
                                <CurrencyDollarIcon className="w-3.5 h-3.5" />
                                You Save:
                            </span>
                            <span className={`text-primary-500 font-semibold ${
                                isMobile ? 'text-xs' : 'text-[13px]'
                            }`}>
                                ₹{totalSavings.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t-2 border-gray-200 mt-2 sm:mt-3 pt-2 sm:pt-3">
                            <span className={`font-extrabold text-gray-900 ${
                                isMobile ? 'text-base' : 'text-lg'
                            }`}>
                                Total
                            </span>
                            <span className={`font-extrabold text-primary-500 ${
                                isMobile ? 'text-lg' : 'text-[22px]'
                            }`}>
                                ₹{totalPrice.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            <div className={`bg-white ${
                isMobile 
                    ? 'fixed bottom-0 left-0 right-0 z-[100] px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]' 
                    : 'sticky max-w-[900px] mx-auto mt-4 px-4 py-4 shadow-lg border-t border-gray-200 rounded-b-2xl'
            }`}>
                <button
                    className={`rounded-xl text-white font-bold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 tracking-tight ${
                        (!canContinue() || loading)
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-br from-primary-500 to-primary-600 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    } ${
                        isMobile 
                            ? 'w-full py-3 text-sm' 
                            : 'w-full max-w-8xl mx-auto py-4 text-base px-20'
                    }`}
                    disabled={!canContinue() || loading}
                    onClick={currentStep === 4 ? handlePlaceOrder : handleContinue}
                >
                    {loading ? 'Processing...' : currentStep === 4 ? 'PLACE ORDER →' : 'CONTINUE'}
                </button>
            </div>
        </div>

        {/* Modals - Outside main container to prevent clipping */}
        {showTimeoutModal && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease',
                        padding: isMobile ? '16px' : '24px'
                    }}
                >
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { transform: translateY(20px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                    `}</style>
                    <div 
                        style={{
                            background: 'white',
                            borderRadius: isMobile ? '20px' : '24px',
                            width: '100%',
                            maxWidth: isMobile ? '100%' : '400px',
                            overflow: 'hidden',
                            animation: 'slideUp 0.3s ease',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: isMobile ? '20px 16px' : '24px 20px',
                            borderBottom: '1px solid #e5e7eb',
                            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                        }}>
                            <div style={{
                                width: isMobile ? '56px' : '64px',
                                height: isMobile ? '56px' : '64px',
                                borderRadius: '50%',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isMobile ? '28px' : '32px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}>
                                ⏰
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ 
                            padding: isMobile ? '24px 16px' : '32px 24px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ 
                                fontSize: isMobile ? '18px' : '20px', 
                                fontWeight: 800, 
                                color: '#1f2937', 
                                margin: `0 0 ${isMobile ? '8px' : '12px'} 0`,
                                letterSpacing: '-0.02em'
                            }}>
                                Session Timeout
                            </h3>
                            <p style={{ 
                                fontSize: isMobile ? '14px' : '15px', 
                                color: '#6b7280', 
                                margin: `0 0 ${isMobile ? '20px' : '24px'} 0`,
                                lineHeight: '1.5'
                            }}>
                                Your checkout session has expired after 10 minutes. Please return to your cart and start the checkout process again.
                            </p>
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('checkout_session_start');
                                    navigate('/cart');
                                }}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '12px' : '14px',
                                    background: 'linear-gradient(135deg, #E57D02 0%, #cc6e02 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: isMobile ? '14px' : '15px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(229, 125, 2, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(229, 125, 2, 0.3)';
                                }}
                            >
                                Return to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Bottom Sheet */}
            {showOrderDetails && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease',
                        padding: isMobile ? 0 : spacing.lg
                    }}
                    onClick={() => setShowOrderDetails(false)}
                >
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { transform: translateY(100%); }
                            to { transform: translateY(0); }
                        }
                    `}</style>
                    <div 
                        style={{
                            background: colors.surface,
                            borderRadius: '24px 24px 0 0',
                            width: '100%',
                            maxWidth: isMobile ? '100%' : '600px',
                            maxHeight: '85vh',
                            overflow: 'hidden',
                            animation: 'slideUp 0.3s ease',
                            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ 
                            width: isMobile ? '36px' : '40px', 
                            height: '3px', 
                            background: colors.border, 
                            borderRadius: '2px', 
                            margin: `${spacing.sm} auto`,
                            opacity: 0.5
                        }} />
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: `0 ${isMobile ? spacing.sm : spacing.md} ${spacing.sm} ${isMobile ? spacing.sm : spacing.md}`, 
                            borderBottom: `1px solid ${colors.border}` 
                        }}>
                            <h3 style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: spacing.xs, 
                                fontSize: isMobile ? '14px' : '16px', 
                                fontWeight: 800, 
                                color: colors.text.primary, 
                                margin: 0,
                                letterSpacing: '-0.02em'
                            }}>
                                <ClipboardDocumentListIcon style={{ width: isMobile ? '16px' : '18px', height: isMobile ? '16px' : '18px', color: colors.primary }} /> Order Summary
                            </h3>
                            <button 
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    width: isMobile ? '32px' : '36px',
                                    height: isMobile ? '32px' : '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: colors.text.secondary,
                                    fontSize: isMobile ? '18px' : '20px',
                                    borderRadius: '50%',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => setShowOrderDetails(false)}
                                onMouseEnter={(e) => {
                                    e.target.style.background = colors.borderLight;
                                    e.target.style.color = colors.text.primary;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = colors.text.secondary;
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ 
                                padding: isMobile ? `${spacing.sm} ${spacing.sm}` : `${spacing.md} ${spacing.md}`, 
                                maxHeight: 'calc(85vh - 120px)', 
                                overflowY: 'auto' 
                            }}>
                            {/* Product Items */}
                            {items.map((item) => {
                                const itemPrice = Number(item.price) || 0;
                                const itemQty = Number(item.quantity) || 1;
                                return (
                                    <div key={item.id} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: spacing.sm, 
                                        padding: `${spacing.sm} 0`, 
                                        borderBottom: `1px solid ${colors.borderLight}` 
                                    }}>
                                        <div style={{ 
                                            width: isMobile ? '56px' : '64px', 
                                            height: isMobile ? '56px' : '64px', 
                                            borderRadius: '12px', 
                                            overflow: 'hidden', 
                                            background: colors.borderLight, 
                                            flexShrink: 0,
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                                        }}>
                                            {item.image ? (
                                                <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    color: colors.text.tertiary
                                                }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: isMobile ? '24px' : '28px', height: isMobile ? '24px' : '28px' }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ 
                                                fontSize: isMobile ? '13px' : '14px', 
                                                fontWeight: 700, 
                                                color: colors.text.primary, 
                                                margin: `0 0 ${spacing.xs} 0`, 
                                                whiteSpace: 'nowrap', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis',
                                                letterSpacing: '-0.01em'
                                            }}>
                                                {item.title}
                                            </h4>
                                            <p style={{ 
                                                fontSize: isMobile ? '11px' : '12px', 
                                                color: colors.text.secondary, 
                                                margin: 0 
                                            }}>
                                                {item.variant || item.size || ''}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <p style={{ 
                                                fontSize: isMobile ? '14px' : '16px', 
                                                fontWeight: 800, 
                                                color: colors.text.primary, 
                                                margin: `0 0 ${spacing.xs} 0` 
                                            }}>
                                                ₹{(itemPrice * itemQty).toFixed(2)}
                                            </p>
                                            <p style={{ 
                                                fontSize: isMobile ? '11px' : '12px', 
                                                color: colors.text.secondary, 
                                                margin: 0 
                                            }}>
                                                Qty: {itemQty}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Summary */}
                            <div style={{ 
                                marginTop: spacing.sm, 
                                paddingTop: spacing.sm, 
                                borderTop: `2px solid ${colors.border}` 
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>Subtotal</span>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.primary, fontWeight: 600 }}>₹{totalPrice.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>
                                        <MapPinIcon style={{ width: '14px', height: '14px' }} />
                                        Distance
                                    </span>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.primary, fontWeight: 600 }}>16.6 km</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>
                                        <TruckIcon style={{ width: '14px', height: '14px' }} />
                                        Delivery Fee
                                    </span>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.primary, fontWeight: 700 }}>FREE</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>
                                        <CurrencyDollarIcon style={{ width: '14px', height: '14px' }} />
                                        Savings
                                    </span>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.primary, fontWeight: 600 }}>₹{totalSavings.toFixed(2)}</span>
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: `${spacing.xs} 0`, 
                                    marginTop: spacing.sm, 
                                    paddingTop: spacing.sm, 
                                    borderTop: `2px dashed ${colors.border}` 
                                }}>
                                    <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: colors.text.primary }}>Total</span>
                                    <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: colors.primary }}>₹{totalPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Badges */}
                            <div style={{ 
                                marginTop: spacing.md, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: spacing.xs 
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: spacing.xs, 
                                    padding: `${spacing.sm} ${spacing.sm}`, 
                                    borderRadius: '12px', 
                                    fontSize: isMobile ? '11px' : '12px', 
                                    fontWeight: 600, 
                                    background: `linear-gradient(135deg, ${colors.primaryLight} 0%, #ffd199 100%)`, 
                                    color: colors.primaryDark,
                                    boxShadow: '0 2px 8px rgba(229, 125, 2, 0.1)'
                                }}>
                                    <CheckCircleIcon style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                                    Free delivery for this order!
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: spacing.xs, 
                                    padding: `${spacing.sm} ${spacing.sm}`, 
                                    borderRadius: '12px', 
                                    fontSize: isMobile ? '11px' : '12px', 
                                    fontWeight: 600, 
                                    background: 'linear-gradient(135deg, #fef9e7 0%, #fef0c7 100%)', 
                                    color: '#b45309',
                                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)'
                                }}>
                                    <BanknotesIcon style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                                    You saved ₹{totalSavings.toFixed(2)} on this order!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        {/* Order Success Modal */}
        <OrderSuccessModal
            isVisible={showOrderSuccessModal}
            onClose={() => {
                setShowOrderSuccessModal(false);
                // Clear cart after modal is closed
                clearUserCart();
            }}
            orderNumber={orderNumber}
        />
        </>
    );
};

export default CheckoutPageNew;
