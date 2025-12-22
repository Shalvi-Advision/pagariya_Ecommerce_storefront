import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getEnabledPaymentModes, mapPaymentModeToUI } from '../api/paymentModesApi';
import { COLORS } from '../constants/theme';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { apiPost } from '../services/api';
import cartService from '../services/cartService';
import { PROJECT_CODE } from '../constants';

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

    // Modern Design System - Colors & Spacing
    const colors = {
        primary: '#10b981',
        primaryDark: '#059669',
        primaryLight: '#d1fae5',
        secondary: '#6366f1',
        background: '#f9fafb',
        surface: '#ffffff',
        text: {
            primary: '#111827',
            secondary: '#6b7280',
            tertiary: '#9ca3af'
        },
        border: '#e5e7eb',
        borderLight: '#f3f4f6',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
    };

    const spacing = {
        xs: isMobile ? '6px' : '8px',
        sm: isMobile ? '8px' : '12px',
        md: isMobile ? '12px' : '16px',
        lg: isMobile ? '16px' : '20px',
        xl: isMobile ? '24px' : '32px'
    };

    // Inline styles - Modern Design
    const containerStyle = {
        minHeight: '100vh',
        background: isMobile 
            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
            : colors.background,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '100%',
        width: '100%',
        margin: '0 auto',
        ...(isMobile ? {} : { 
            maxWidth: '900px',
            padding: `${spacing.xl} ${spacing.lg}`,
            background: colors.background,
            boxSizing: 'border-box'
        })
    };

    const headerStyle = {
        background: isMobile 
            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
            : colors.surface,
        padding: isMobile ? `${spacing.sm} ${spacing.md}` : `${spacing.md} ${spacing.lg}`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? '60px' : 'auto',
        left: 0,
        right: 0,
        zIndex: 40,
        flexShrink: 0,
        boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderRadius: isMobile ? 0 : '16px',
        marginBottom: isMobile ? 0 : spacing.md,
        border: isMobile ? 'none' : `1px solid ${colors.border}`
    };

    const headerTopRowStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
    };

    const headerTitleStyle = {
        color: isMobile ? 'white' : colors.text.primary,
        fontSize: isMobile ? '14px' : '16px',
        fontWeight: 700,
        margin: 0,
        letterSpacing: '-0.02em'
    };

    const backBtnStyle = {
        background: isMobile ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        border: 'none',
        color: isMobile ? 'white' : colors.text.primary,
        cursor: 'pointer',
        padding: isMobile ? '6px' : '8px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
    };

    const timerStyle = {
        background: isMobile ? 'rgba(255, 255, 255, 0.15)' : colors.primaryLight,
        padding: isMobile ? '4px 10px' : '6px 12px',
        borderRadius: '8px',
        color: isMobile ? 'white' : colors.primaryDark,
        fontSize: isMobile ? '11px' : '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 600,
        backdropFilter: isMobile ? 'blur(10px)' : 'none'
    };

    const stepProgressStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        width: '100%',
        paddingTop: spacing.xs
    };

    const stepItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs
    };

    const getStepCircleStyle = (step) => ({
        width: isMobile ? '28px' : '32px',
        height: isMobile ? '28px' : '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: isMobile ? '11px' : '12px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: currentStep > step || currentStep === step 
            ? (isMobile ? 'white' : colors.primary)
            : (isMobile ? 'rgba(255, 255, 255, 0.2)' : colors.borderLight),
        color: currentStep > step || currentStep === step 
            ? (isMobile ? colors.primary : 'white')
            : (isMobile ? 'white' : colors.text.tertiary),
        boxShadow: currentStep > step || currentStep === step 
            ? (isMobile ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(16, 185, 129, 0.3)')
            : 'none'
    });

    const getStepLineStyle = (step) => ({
        width: isMobile ? '20px' : '28px',
        height: '2px',
        margin: `0 ${spacing.xs}`,
        transition: 'all 0.3s ease',
        background: currentStep > step 
            ? (isMobile ? 'white' : colors.primary)
            : (isMobile ? 'rgba(255, 255, 255, 0.2)' : colors.border),
        borderRadius: '2px'
    });

    const contentStyle = {
        background: isMobile ? colors.surface : colors.surface,
        borderRadius: isMobile ? '20px 20px 0 0' : '16px',
        padding: isMobile ? spacing.sm : spacing.md,
        marginTop: 0,
        paddingTop: isMobile ? '200px' : spacing.lg,
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: isMobile ? '100px' : spacing.lg,
        position: 'relative',
        zIndex: 1,
        minHeight: 0,
        maxWidth: '100%',
        width: '100%',
        boxShadow: isMobile ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.08)',
        border: isMobile ? 'none' : `1px solid ${colors.border}`
    };

    return (
        <>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div style={containerStyle}>
            {/* Header with Step Progress */}
            <div style={headerStyle}>
                {/* Top Row: Back Button, Title, Timer */}
                <div style={headerTopRowStyle}>
                    <button 
                        style={backBtnStyle} 
                        onClick={handleBack}
                        onMouseEnter={(e) => {
                            e.target.style.background = isMobile ? 'rgba(255, 255, 255, 0.2)' : colors.borderLight;
                            e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = isMobile ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                    <h1 style={headerTitleStyle}>{stepTitles[currentStep - 1]}</h1>
                    <div style={timerStyle}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
                    </svg>
                    <span>10:00</span>
                </div>
            </div>

                {/* Step Progress Circles */}
                <div style={stepProgressStyle}>
                {[1, 2, 3, 4].map((step, idx) => (
                        <div style={stepItemStyle} key={step}>
                            <div style={getStepCircleStyle(step)}>
                            {currentStep > step ? '✓' : step}
                        </div>
                            {idx < 3 && <div style={getStepLineStyle(step)} />}
                    </div>
                ))}
                </div>
            </div>

            {/* Content */}
            <div style={contentStyle}>
                {/* Step 1: Delivery Method */}
                {currentStep === 1 && (() => {
                    const { homeDelivery, selfPickup } = getDeliveryOptions(confirmedLocation?.store);
                    
                    const infoBannerStyle = {
                        background: `linear-gradient(135deg, ${colors.primaryLight} 0%, #a7f3d0 100%)`,
                        border: `1px solid ${colors.primary}`,
                        borderRadius: '12px',
                        padding: isMobile ? spacing.sm : spacing.md,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        marginBottom: spacing.md,
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                    };

                    const infoBannerIconStyle = {
                        width: isMobile ? '28px' : '32px',
                        height: isMobile ? '28px' : '32px',
                        background: colors.primary,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: 700
                    };

                    const sectionTitleStyle = {
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: 800,
                        color: colors.text.primary,
                        margin: `0 0 ${spacing.xs} 0`,
                        letterSpacing: '-0.03em'
                    };

                    const sectionSubtitleStyle = {
                        fontSize: isMobile ? '13px' : '14px',
                        color: colors.text.secondary,
                        margin: `0 0 ${spacing.md} 0`,
                        lineHeight: 1.5
                    };

                    const getDeliveryModeCardStyle = (isSelected) => ({
                        background: isSelected 
                            ? `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.surface} 100%)`
                            : colors.surface,
                        border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                        borderRadius: '16px',
                        padding: isMobile ? spacing.sm : spacing.md,
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: spacing.sm,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        marginBottom: spacing.sm,
                        width: '100%',
                        boxShadow: isSelected 
                            ? '0 4px 16px rgba(16, 185, 129, 0.15)'
                            : '0 2px 8px rgba(0, 0, 0, 0.05)',
                        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                    });

                    const deliveryIconStyle = {
                        width: isMobile ? '48px' : '52px',
                        height: isMobile ? '48px' : '52px',
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                                    fontSize: isMobile ? '20px' : '22px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        flexShrink: 0
                    };

                    const deliveryContentStyle = {
                        flex: 1,
                        minWidth: 0
                    };

                    const deliveryContentH4Style = {
                        fontSize: isMobile ? '15px' : '16px',
                        fontWeight: 700,
                        color: colors.text.primary,
                        margin: `0 0 ${spacing.xs} 0`,
                        letterSpacing: '-0.02em'
                    };

                    const deliveryContentPStyle = {
                        fontSize: isMobile ? '12px' : '13px',
                        color: colors.text.secondary,
                        margin: 0,
                        lineHeight: 1.5
                    };

                    const getRadioStyle = (isSelected) => ({
                        width: isMobile ? '20px' : '24px',
                        height: isMobile ? '20px' : '24px',
                        border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                        background: isSelected ? colors.primary : 'transparent'
                    });

                    const radioInnerStyle = (isSelected) => isSelected ? {
                        content: '',
                        width: '12px',
                        height: '12px',
                        background: '#26b985',
                        borderRadius: '50%',
                        position: 'absolute'
                    } : {};
                    
                    return (
                        <>
                            {homeDelivery && !selfPickup && (
                                <div style={infoBannerStyle}>
                                    <div style={infoBannerIconStyle}>ℹ</div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ color: colors.primaryDark, fontSize: isMobile ? '13px' : '14px', fontWeight: 700, margin: '0 0 2px 0' }}>Home Delivery Only</h4>
                                        <p style={{ color: colors.primary, fontSize: isMobile ? '12px' : '13px', margin: 0 }}>Only Home Delivery is available</p>
                                    </div>
                                </div>
                            )}

                            <h2 style={sectionTitleStyle}>Choose Delivery Method</h2>
                            <p style={sectionSubtitleStyle}>How do you want to receive your order?</p>

                            {homeDelivery && (
                                <div
                                    style={getDeliveryModeCardStyle(checkoutData.deliveryMode === 'home')}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, deliveryMode: 'home' }))}
                                    onMouseEnter={(e) => {
                                        if (checkoutData.deliveryMode !== 'home') {
                                            e.currentTarget.style.borderColor = colors.primary;
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (checkoutData.deliveryMode !== 'home') {
                                            e.currentTarget.style.borderColor = colors.border;
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                        }
                                    }}
                                >
                                    <div style={deliveryIconStyle}>🏠</div>
                                    <div style={deliveryContentStyle}>
                                        <h4 style={deliveryContentH4Style}>Home Delivery</h4>
                                        <p style={deliveryContentPStyle}>Delivered to your doorstep</p>
                                    </div>
                                    <div style={getRadioStyle(checkoutData.deliveryMode === 'home')}>
                                            {checkoutData.deliveryMode === 'home' && (
                                                <div style={{ 
                                                    width: isMobile ? '8px' : '10px', 
                                                    height: isMobile ? '8px' : '10px', 
                                                    background: 'white', 
                                                    borderRadius: '50%' 
                                                }} />
                                            )}
                                    </div>
                                </div>
                            )}

                            {selfPickup && (
                                <div
                                    style={getDeliveryModeCardStyle(checkoutData.deliveryMode === 'pickup')}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, deliveryMode: 'pickup' }))}
                                    onMouseEnter={(e) => {
                                        if (checkoutData.deliveryMode !== 'pickup') {
                                            e.currentTarget.style.borderColor = colors.primary;
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (checkoutData.deliveryMode !== 'pickup') {
                                            e.currentTarget.style.borderColor = colors.border;
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                        }
                                    }}
                                >
                                    <div style={deliveryIconStyle}>🏪</div>
                                    <div style={deliveryContentStyle}>
                                        <h4 style={deliveryContentH4Style}>Store Pickup</h4>
                                        <p style={deliveryContentPStyle}>Pick up from store</p>
                                    </div>
                                    <div style={getRadioStyle(checkoutData.deliveryMode === 'pickup')}>
                                            {checkoutData.deliveryMode === 'pickup' && (
                                                <div style={{ 
                                                    width: isMobile ? '8px' : '10px', 
                                                    height: isMobile ? '8px' : '10px', 
                                                    background: 'white', 
                                                    borderRadius: '50%' 
                                                }} />
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
                        <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: colors.text.primary, margin: `0 0 ${spacing.xs} 0`, letterSpacing: '-0.03em' }}>Delivery Address</h2>
                        <p style={{ fontSize: isMobile ? '13px' : '14px', color: colors.text.secondary, margin: `0 0 ${spacing.md} 0`, lineHeight: 1.5 }}>Select delivery address</p>

                        {isLoadingAddresses ? (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: `${spacing.xl} ${spacing.md}` 
                            }}>
                                <div style={{ 
                                    width: isMobile ? '40px' : '48px', 
                                    height: isMobile ? '40px' : '48px', 
                                    border: `3px solid ${colors.border}`, 
                                    borderTopColor: colors.primary, 
                                    borderRadius: '50%', 
                                    animation: 'spin 1s linear infinite' 
                                }} />
                                <p style={{ 
                                    marginTop: spacing.md, 
                                    color: colors.text.secondary,
                                    fontSize: isMobile ? '14px' : '15px',
                                    fontWeight: 500
                                }}>
                                    Loading addresses...
                                </p>
                            </div>
                        ) : savedAddresses.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: `${spacing.xl} ${spacing.md}`,
                                background: colors.borderLight,
                                borderRadius: '20px',
                                border: `1px dashed ${colors.border}`
                            }}>
                                <div style={{ 
                                    width: isMobile ? '64px' : '80px', 
                                    height: isMobile ? '64px' : '80px', 
                                    background: colors.surface, 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    margin: `0 auto ${spacing.md}`, 
                                    fontSize: isMobile ? '28px' : '32px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                }}>
                                    📍
                                </div>
                                <h4 style={{ 
                                    fontSize: isMobile ? '16px' : '18px', 
                                    fontWeight: 700, 
                                    color: colors.text.primary, 
                                    margin: `0 0 ${spacing.sm} 0`,
                                    letterSpacing: '-0.01em'
                                }}>
                                    No saved addresses
                                </h4>
                                <p style={{ 
                                    fontSize: isMobile ? '14px' : '15px', 
                                    color: colors.text.secondary, 
                                    margin: 0,
                                    lineHeight: 1.5
                                }}>
                                    Add an address to continue
                                </p>
                            </div>
                        ) : (
                            savedAddresses.map((addr) => {
                                const isSelected = checkoutData.selectedAddress?.id === addr.id;
                                return (
                                <div
                                    key={addr.id}
                                        style={{
                                            background: isSelected 
                                                ? `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.surface} 100%)`
                                                : colors.surface,
                                            border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                                            borderRadius: '16px',
                                            padding: isMobile ? spacing.sm : spacing.md,
                                            marginBottom: spacing.sm,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: isSelected 
                                                ? '0 4px 16px rgba(16, 185, 129, 0.15)'
                                                : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                            transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                                        }}
                                    onClick={() => setCheckoutData(prev => ({
                                        ...prev,
                                        selectedAddress: { id: addr.id, name: addr.name, address: `${addr.addressLine1}, ${addr.city} ${addr.pinCode}` }
                                    }))}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = colors.primary;
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = colors.border;
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                    }}
                                >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
                                            <div style={{ 
                                                width: isMobile ? '40px' : '44px', 
                                                height: isMobile ? '40px' : '44px', 
                                                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, 
                                                borderRadius: '12px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                color: 'white', 
                                                flexShrink: 0, 
                                                fontSize: isMobile ? '18px' : '20px',
                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                            }}>📍</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, color: colors.text.primary, margin: `0 0 ${spacing.xs} 0`, letterSpacing: '-0.01em' }}>{addr.name}</h4>
                                                <p style={{ fontSize: isMobile ? '13px' : '14px', color: colors.text.secondary, margin: `0 0 ${spacing.xs} 0`, lineHeight: 1.5 }}>{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city} - {addr.pinCode}</p>
                                                <p style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.tertiary, margin: `${spacing.xs} 0 0 0` }}>PIN: {addr.pinCode}</p>
                                                {addr.isDefault && (
                                                    <span style={{ 
                                                        display: 'inline-block', 
                                                        background: `linear-gradient(135deg, ${colors.primaryLight} 0%, #a7f3d0 100%)`, 
                                                        color: colors.primaryDark, 
                                                        fontSize: isMobile ? '10px' : '11px', 
                                                        fontWeight: 700, 
                                                        padding: `${spacing.xs} ${spacing.sm}`, 
                                                        borderRadius: '6px', 
                                                        marginTop: spacing.xs, 
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        Default Address
                                                    </span>
                                                )}
                                        </div>
                                            <div style={{ 
                                                width: isMobile ? '20px' : '24px', 
                                                height: isMobile ? '20px' : '24px', 
                                                border: `2px solid ${isSelected ? colors.primary : colors.border}`, 
                                                borderRadius: '50%', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                flexShrink: 0,
                                                background: isSelected ? colors.primary : 'transparent',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                {isSelected && (
                                                    <div style={{ 
                                                        width: isMobile ? '8px' : '10px', 
                                                        height: isMobile ? '8px' : '10px', 
                                                        background: 'white', 
                                                        borderRadius: '50%' 
                                                    }} />
                                                )}
                                    </div>
                                </div>
                                    </div>
                                );
                            })
                        )}

                        <button 
                            style={{
                                background: colors.surface,
                                border: `2px dashed ${colors.border}`,
                                borderRadius: '12px',
                                padding: isMobile ? spacing.sm : spacing.md,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: spacing.xs,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                width: '100%',
                                color: colors.primary,
                                fontSize: isMobile ? '13px' : '14px',
                                fontWeight: 700,
                                marginTop: spacing.sm
                            }}
                            onClick={() => navigate('/address')}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = colors.primary;
                                e.target.style.background = colors.primaryLight;
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = colors.border;
                                e.target.style.background = colors.surface;
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            + ADD NEW ADDRESS
                        </button>
                    </>
                )}

                {/* Step 3: Time Slot */}
                {currentStep === 3 && (
                    <>
                        <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: colors.text.primary, margin: `0 0 ${spacing.xs} 0`, letterSpacing: '-0.03em' }}>Choose Delivery Time</h2>
                        <p style={{ fontSize: isMobile ? '13px' : '14px', color: colors.text.secondary, margin: `0 0 ${spacing.md} 0`, lineHeight: 1.5 }}>Select delivery time slot</p>

                        {isLoadingSlots ? (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: `${spacing.xl} ${spacing.md}` 
                            }}>
                                <div style={{ 
                                    width: isMobile ? '40px' : '48px', 
                                    height: isMobile ? '40px' : '48px', 
                                    border: `3px solid ${colors.border}`, 
                                    borderTopColor: colors.primary, 
                                    borderRadius: '50%', 
                                    animation: 'spin 1s linear infinite' 
                                }} />
                                <p style={{ 
                                    marginTop: spacing.md, 
                                    color: colors.text.secondary,
                                    fontSize: isMobile ? '14px' : '15px',
                                    fontWeight: 500
                                }}>
                                    Loading slots...
                                </p>
                            </div>
                        ) : slotsErrorMessage ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: `${spacing.xl} ${spacing.md}`,
                                background: colors.borderLight,
                                borderRadius: '20px',
                                border: `1px dashed ${colors.border}`
                            }}>
                                <div style={{ 
                                    width: isMobile ? '64px' : '80px', 
                                    height: isMobile ? '64px' : '80px', 
                                    background: colors.surface, 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    margin: `0 auto ${spacing.md}`, 
                                    fontSize: isMobile ? '28px' : '32px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                }}>
                                    ⚠️
                                </div>
                                <h4 style={{ 
                                    fontSize: isMobile ? '16px' : '18px', 
                                    fontWeight: 700, 
                                    color: colors.text.primary, 
                                    margin: `0 0 ${spacing.sm} 0`,
                                    letterSpacing: '-0.01em'
                                }}>
                                    Slots Unavailable
                                </h4>
                                <p style={{ 
                                    fontSize: isMobile ? '14px' : '15px', 
                                    color: colors.text.secondary, 
                                    margin: 0,
                                    lineHeight: 1.5
                                }}>
                                    {slotsErrorMessage}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: isMobile ? 'column' : 'row', 
                                    gap: spacing.sm, 
                                    marginBottom: spacing.lg, 
                                    overflowX: isMobile ? 'visible' : 'auto', 
                                    paddingBottom: '4px'
                                }}>
                                    {timeSlots.map((dateSlot, idx) => {
                                        const isActive = selectedDateTab === idx;
                                        return (
                                        <button
                                            key={idx}
                                            style={{
                                                padding: isMobile ? `${spacing.xs} ${spacing.sm}` : `${spacing.sm} ${spacing.md}`,
                                                borderRadius: '12px',
                                                fontSize: isMobile ? '12px' : '13px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                border: `2px solid ${isActive ? colors.primary : colors.border}`,
                                                background: isActive 
                                                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                                                    : colors.surface,
                                                color: isActive ? 'white' : colors.text.secondary,
                                                boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                                            }}
                                            onClick={() => setSelectedDateTab(idx)}
                                        >
                                            {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dateSlot.date?.split(' ')[1] || dateSlot.date}
                                        </button>
                                        );
                                    })}
                                </div>

                                <h3 style={{ 
                                    fontSize: isMobile ? '14px' : '15px', 
                                    fontWeight: 700, 
                                    color: colors.text.primary, 
                                    marginBottom: spacing.sm,
                                    letterSpacing: '-0.01em'
                                }}>
                                    {timeSlots[selectedDateTab]?.date || 'Today'}
                                </h3>

                                {timeSlots[selectedDateTab]?.slots?.map((slot) => {
                                    const isSelected = checkoutData.selectedTimeSlot?.id === slot.id;
                                    return (
                                    <div
                                        key={slot.id}
                                            style={{
                                                background: isSelected 
                                                    ? `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.surface} 100%)`
                                                    : slot.available 
                                                        ? colors.surface 
                                                        : colors.borderLight,
                                                border: `2px solid ${isSelected ? colors.primary : slot.available ? colors.border : colors.border}`,
                                                borderRadius: '12px',
                                                padding: isMobile ? spacing.sm : spacing.md,
                                                marginBottom: spacing.xs,
                                                cursor: slot.available ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                opacity: slot.available ? 1 : 0.5,
                                                boxShadow: isSelected 
                                                    ? '0 4px 16px rgba(16, 185, 129, 0.15)'
                                                    : slot.available 
                                                        ? '0 2px 8px rgba(0, 0, 0, 0.05)'
                                                        : 'none',
                                                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                                            }}
                                        onClick={() => slot.available && setCheckoutData(prev => ({
                                            ...prev,
                                            selectedDate: timeSlots[selectedDateTab].date,
                                            selectedTimeSlot: slot
                                        }))}
                                        onMouseEnter={(e) => {
                                            if (slot.available && !isSelected) {
                                                e.currentTarget.style.borderColor = colors.primary;
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (slot.available && !isSelected) {
                                                e.currentTarget.style.borderColor = colors.border;
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }
                                        }}
                                    >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                                                <h4 style={{ 
                                                    fontSize: isMobile ? '14px' : '15px', 
                                                    fontWeight: 700, 
                                                    color: slot.available ? colors.text.primary : colors.text.tertiary, 
                                                    margin: 0,
                                                    letterSpacing: '-0.01em'
                                                }}>
                                                    {slot.time}
                                                </h4>
                                                <span style={{ 
                                                    fontSize: isMobile ? '11px' : '12px', 
                                                    color: slot.available ? colors.primary : colors.text.tertiary, 
                                                    fontWeight: 600 
                                                }}>
                                                    {slot.available ? 'Available' : 'Unavailable'}
                                                </span>
                                    </div>
                                            {isSelected && (
                                                <div style={{
                                                    width: isMobile ? '20px' : '24px',
                                                    height: isMobile ? '20px' : '24px',
                                                    background: colors.primary,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
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
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.xs,
                                color: colors.primary,
                                fontSize: isMobile ? '12px' : '13px',
                                fontWeight: 600,
                                marginBottom: spacing.sm,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => setShowOrderDetails(true)}
                            onMouseEnter={(e) => {
                                e.target.style.color = colors.primaryDark;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = colors.primary;
                            }}
                        >
                            View Order details &gt;
                        </span>

                        <div style={{ 
                            background: colors.surface, 
                            borderRadius: '16px', 
                            padding: isMobile ? spacing.sm : spacing.md, 
                            marginBottom: spacing.sm, 
                            border: `1px solid ${colors.border}`,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: spacing.xs, 
                                marginBottom: spacing.sm, 
                                paddingBottom: spacing.sm, 
                                borderBottom: `1px solid ${colors.borderLight}` 
                            }}>
                                <span style={{ fontSize: isMobile ? '16px' : '18px' }}>📋</span>
                                <h3 style={{ 
                                    fontSize: isMobile ? '12px' : '13px', 
                                    fontWeight: 800, 
                                    color: colors.primary, 
                                    margin: 0, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.5px' 
                                }}>
                                    ORDER SUMMARY
                                </h3>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>{totalItems} items</span>
                                <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.primary, fontWeight: 600 }}>₹{totalPrice.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>📦 Distance</span>
                                <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.primary, fontWeight: 600 }}>16.6 km</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>🚚 Delivery Fee</span>
                                <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.primary, fontWeight: 700 }}>FREE</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>💰 Savings</span>
                                <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.primary, fontWeight: 600 }}>₹{totalSavings.toFixed(2)}</span>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: `${spacing.xs} 0`, 
                                borderTop: `2px solid ${colors.border}`, 
                                marginTop: spacing.sm, 
                                paddingTop: spacing.sm 
                            }}>
                                <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: colors.text.primary }}>TOTAL</span>
                                <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: colors.primary }}>₹{totalPrice.toFixed(2)}</span>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: spacing.xs, 
                                background: colors.primaryLight, 
                                color: colors.primaryDark, 
                                padding: `${spacing.xs} ${spacing.sm}`, 
                                borderRadius: '10px', 
                                fontSize: isMobile ? '11px' : '12px', 
                                fontWeight: 600, 
                                marginTop: spacing.sm 
                            }}>
                                ✓ Free delivery for this order
                            </div>
                        </div>

                        <div style={{ 
                            background: colors.surface, 
                            border: `1px solid ${colors.border}`, 
                            borderRadius: '12px', 
                            padding: isMobile ? spacing.sm : spacing.md, 
                            marginBottom: spacing.sm,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}>
                            <textarea
                                placeholder="Any special instructions for delivery?"
                                rows={2}
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    resize: 'none',
                                    fontSize: isMobile ? '12px' : '13px',
                                    color: colors.text.primary,
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    background: 'transparent'
                                }}
                            />
                        </div>

                        <div style={{ 
                            background: colors.surface, 
                            borderRadius: '16px', 
                            padding: isMobile ? spacing.sm : spacing.md, 
                            marginBottom: spacing.sm, 
                            border: `1px solid ${colors.border}`,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: spacing.xs, 
                                marginBottom: spacing.sm, 
                                paddingBottom: spacing.sm, 
                                borderBottom: `1px solid ${colors.borderLight}` 
                            }}>
                                <span style={{ fontSize: isMobile ? '16px' : '18px' }}>💳</span>
                                <h3 style={{ 
                                    fontSize: isMobile ? '12px' : '13px', 
                                    fontWeight: 800, 
                                    color: colors.primary, 
                                    margin: 0, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.5px' 
                                }}>
                                    PAYMENT METHOD
                                </h3>
                            </div>
                            <p style={{ 
                                fontSize: isMobile ? '12px' : '13px', 
                                color: colors.text.secondary, 
                                margin: `0 0 ${spacing.sm} 0`,
                                lineHeight: 1.5
                            }}>
                                Select your preferred payment option
                            </p>

                            {isLoadingPaymentModes ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${spacing.xl} ${spacing.md}` }}>
                                    <div style={{ width: '40px', height: '40px', border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                                    {enabledPaymentModes.map((mode) => {
                                    const details = getPaymentMethodDetails(mode.name);
                                        const isSelected = checkoutData.paymentMethod === details.value;
                                    return (
                                        <div
                                            key={mode.id}
                                                style={{
                                                    background: isSelected 
                                                        ? `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.surface} 100%)`
                                                        : colors.surface,
                                                    border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                                                    borderRadius: '16px',
                                                    padding: isMobile ? spacing.sm : spacing.md,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: spacing.sm,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: isSelected 
                                                        ? '0 4px 16px rgba(16, 185, 129, 0.15)'
                                                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                                    transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                                                }}
                                            onClick={() => setCheckoutData(prev => ({ ...prev, paymentMethod: details.value }))}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = colors.primary;
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = colors.border;
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                                    }
                                                }}
                                            >
                                                <div style={{ 
                                                    width: isMobile ? '44px' : '48px', 
                                                    height: isMobile ? '44px' : '48px', 
                                                    background: colors.borderLight, 
                                                    borderRadius: '12px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    fontSize: isMobile ? '20px' : '22px',
                                                    flexShrink: 0
                                                }}>
                                                    {details.icon}
                                            </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{ 
                                                        margin: 0, 
                                                        fontSize: isMobile ? '15px' : '16px', 
                                                        fontWeight: 700, 
                                                        color: colors.text.primary,
                                                        letterSpacing: '-0.01em'
                                                    }}>
                                                        {details.name}
                                                    </h4>
                                                    <p style={{ 
                                                        margin: `${spacing.xs} 0 0`, 
                                                        fontSize: isMobile ? '12px' : '13px', 
                                                        color: colors.text.secondary,
                                                        lineHeight: 1.4
                                                    }}>
                                                        {details.desc}
                                                    </p>
                                                </div>
                                                <div style={{ 
                                                    width: isMobile ? '20px' : '24px', 
                                                    height: isMobile ? '20px' : '24px', 
                                                    border: `2px solid ${isSelected ? colors.primary : colors.border}`, 
                                                    borderRadius: '50%', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    background: isSelected ? colors.primary : 'transparent',
                                                    flexShrink: 0,
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    {isSelected && (
                                                        <div style={{ 
                                                            width: isMobile ? '8px' : '10px', 
                                                            height: isMobile ? '8px' : '10px', 
                                                            background: 'white', 
                                                            borderRadius: '50%' 
                                                        }} />
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
                    <div style={{ 
                        background: colors.surface, 
                        borderRadius: '16px', 
                        padding: isMobile ? spacing.sm : spacing.md, 
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', 
                        marginTop: spacing.md,
                        border: `1px solid ${colors.border}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                            <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>Order Subtotal</span>
                            <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.primary, fontWeight: 600 }}>₹{totalPrice.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                            <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>🚚 Delivery Fee:</span>
                            <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.primary, fontWeight: 700 }}>₹0.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                            <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>💰 You Save:</span>
                            <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.primary, fontWeight: 600 }}>₹{totalSavings.toFixed(2)}</span>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: `${spacing.xs} 0`, 
                            borderTop: `2px solid ${colors.border}`, 
                            marginTop: spacing.sm, 
                            paddingTop: spacing.sm 
                        }}>
                            <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: colors.text.primary }}>Total</span>
                            <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: colors.primary }}>₹{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            <div style={{
                position: isMobile ? 'fixed' : 'sticky',
                bottom: isMobile ? 0 : 'auto',
                left: 0,
                right: 0,
                background: colors.surface,
                padding: isMobile ? `${spacing.sm} ${spacing.sm}` : `${spacing.md} ${spacing.md}`,
                boxShadow: isMobile ? '0 -4px 20px rgba(0, 0, 0, 0.1)' : '0 4px 16px rgba(0, 0, 0, 0.08)',
                zIndex: 100,
                borderTop: isMobile ? 'none' : `1px solid ${colors.border}`,
                borderRadius: isMobile ? 0 : '0 0 16px 16px',
                ...(isMobile ? {} : { 
                    maxWidth: '900px',
                    margin: '0 auto',
                    marginTop: spacing.md
                })
            }}>
                <button
                    style={{
                        width: '100%',
                        padding: isMobile ? spacing.sm : spacing.md,
                        background: (!canContinue() || loading) 
                            ? colors.border 
                            : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: 700,
                        cursor: (!canContinue() || loading) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.sm,
                        letterSpacing: '-0.01em',
                        boxShadow: (!canContinue() || loading) 
                            ? 'none'
                            : '0 4px 16px rgba(16, 185, 129, 0.3)'
                    }}
                    disabled={!canContinue() || loading}
                    onClick={currentStep === 4 ? handlePlaceOrder : handleContinue}
                    onMouseEnter={(e) => {
                        if (!(!canContinue() || loading)) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!(!canContinue() || loading)) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)';
                        }
                    }}
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
                                <span style={{ fontSize: isMobile ? '16px' : '18px' }}>📋</span> Order Summary
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
                                                    color: colors.text.tertiary, 
                                                    fontSize: isMobile ? '20px' : '24px' 
                                                }}>
                                                    📦
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
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>📦 Distance</span>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.primary, fontWeight: 600 }}>16.6 km</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>🚚 Delivery Fee</span>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.primary, fontWeight: 700 }}>FREE</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` }}>
                                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: colors.text.secondary }}>💰 Savings</span>
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
                                    background: `linear-gradient(135deg, ${colors.primaryLight} 0%, #a7f3d0 100%)`, 
                                    color: colors.primaryDark,
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                                }}>
                                    <span style={{ fontSize: isMobile ? '14px' : '16px' }}>✓</span>
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
                                    <span style={{ fontSize: isMobile ? '14px' : '16px' }}>💰</span>
                                    You saved ₹{totalSavings.toFixed(2)} on this order!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
};

export default CheckoutPageNew;
