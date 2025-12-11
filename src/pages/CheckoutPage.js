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
import { placeOrder } from '../api/ordersApi';
import { COLORS } from '../constants/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { apiPost } from '../services/api';
import cartService from '../services/cartService';
import { PROJECT_CODE } from '../constants';

// Indian States constant
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep'
];

// This function is replaced by generateDefaultTimeSlots from the API

const CheckoutPage = () => {
  const { items, totalItems, totalPrice, clearCart, clearUserCart } = useCart();
  const { isAuthenticated, user, setSuccessMessage } = useAuth();
  const { addOrder } = useOrders();
  const { getCurrentPincode, confirmedLocation } = usePincode();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const { isMobile, isTablet, getResponsiveValue } = useResponsive();
  const { processPayment, loading: razorpayLoading } = useRazorpay();

  // State for dynamic time slots
  const [timeSlots, setTimeSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsErrorMessage, setSlotsErrorMessage] = useState(null);

  // State for dynamic pickup stores
  const [pickupStores, setPickupStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storesError, setStoresError] = useState(null);

  // State for saved addresses from API
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressesError, setAddressesError] = useState(null);

  // State for payment modes from API
  const [enabledPaymentModes, setEnabledPaymentModes] = useState([]);
  const [isLoadingPaymentModes, setIsLoadingPaymentModes] = useState(false);

  // Function to fetch stores for the selected pincode
  const fetchPickupStores = async (pincode) => {
    if (!pincode) {
      setPickupStores([]);
      return;
    }

    setIsLoadingStores(true);
    setStoresError(null);

    try {
      // Get current store code from localStorage
      const locationData = localStorage.getItem('confirmedLocation');
      let currentStoreCode = null;

      if (locationData) {
        try {
          const location = JSON.parse(locationData);
          currentStoreCode = location?.store?.storeCode || location?.store?.store_code;
        } catch (error) {
          console.error('Error parsing location data:', error);
        }
      }

      console.log('🏪 Fetching pickup stores for pincode:', pincode);
      console.log('🏪 Current store code from localStorage:', currentStoreCode);

      const response = await getPincodeStores(pincode);
      console.log('🏪 API Response:', response);

      if (response.success && response.data && response.data.length > 0) {
        console.log('🏪 Total stores from API:', response.data.length);

        // Transform API data to UI format first
        const formattedStores = response.data.map(store => formatStoreData(store));

        console.log('🏪 Formatted stores:', formattedStores);

        // Filter to only show the currently selected store (from localStorage)
        const filteredStores = formattedStores.filter(store => {
          const matchesCurrentStore = currentStoreCode && store.storeCode === currentStoreCode;
          const isEnabled = store.isEnabled === true;

          console.log(`🏪 Store ${store.storeName}:`, {
            storeCode: store.storeCode,
            currentStoreCode: currentStoreCode,
            matchesCurrentStore: matchesCurrentStore,
            isEnabled: isEnabled,
            willShow: matchesCurrentStore && isEnabled
          });

          return matchesCurrentStore && isEnabled;
        });

        console.log('✅ Filtered stores (matching current store code):', filteredStores);
        console.log('✅ Number of stores after filtering:', filteredStores.length);

        // Map filtered stores to pickup point format
        const pickupEnabledStores = filteredStores.map(store => ({
          id: store._id,
          name: store.storeName,
          address: store.storeAddress,
          distance: '0.5 km', // This would be calculated based on user location in a real app
          timings: `${store.storeOpenTime} - ${store.storeDeliveryTime}`,
          isAvailable: store.isEnabled,
          storeCode: store.storeCode,
          contactNumber: store.contactNumber,
          homeDelivery: store.homeDelivery,
          selfPickup: store.selfPickup,
          minOrderAmount: store.minOrderAmount,
          storeMessage: store.storeMessage
        }));

        console.log('✅ Final pickup stores to display:', pickupEnabledStores);

        setPickupStores(pickupEnabledStores);

        if (pickupEnabledStores.length === 0 && currentStoreCode) {
          setStoresError('The selected store does not support pickup. Please choose home delivery.');
        }
      } else {
        // No stores found
        setPickupStores([]);
        setStoresError('No pickup stores available for this location.');
      }
    } catch (error) {
      console.error('Error fetching pickup stores:', error);
      setPickupStores([]);
      setStoresError('Unable to load stores. Please try again.');
    } finally {
      setIsLoadingStores(false);
    }
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Payment Information
    paymentMethod: 'card', // 'card', 'upi', 'netbanking', 'paytm', 'cod'
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    upiId: '',
    bankName: '',
    paytmNumber: '',

    // Additional options
    saveInfo: false,
    differentBilling: false,
  });

  // New checkout section state - initialized with actual pincode
  const [checkoutData, setCheckoutData] = useState(() => {
    const currentPincode = getCurrentPincode();
    return {
      selectedPincode: currentPincode || '',
      deliveryMode: 'home', // 'pickup' or 'home'
      selectedPickupPoint: null,
      selectedAddress: null,
      selectedTimeSlot: null,
      selectedDate: null,
    };
  });

  // Update selected pincode from context when it changes
  useEffect(() => {
    const currentPincode = getCurrentPincode();
    if (currentPincode && currentPincode !== checkoutData.selectedPincode) {
      setCheckoutData(prev => ({
        ...prev,
        selectedPincode: currentPincode
      }));
    }
  }, [confirmedLocation, getCurrentPincode, checkoutData.selectedPincode]);

  // Load stores when delivery mode changes to pickup
  useEffect(() => {
    if (checkoutData.deliveryMode === 'pickup') {
      const currentPincode = getCurrentPincode();
      if (currentPincode) {
        fetchPickupStores(currentPincode);
      } else {
        setPickupStores([]);
        setStoresError('Please select a location to see available stores.');
      }
    }
  }, [checkoutData.deliveryMode, getCurrentPincode]);

  // Load saved addresses from API on component mount
  useEffect(() => {
    const loadSavedAddresses = async () => {
      try {
        setIsLoadingAddresses(true);
        setAddressesError(null);
        const response = await getAddresses();

        if (response.success && response.data) {
          // Transform API data to UI format
          const transformedAddresses = response.data.map(transformAddressFromAPI);
          setSavedAddresses(transformedAddresses);
        } else {
          setSavedAddresses([]);
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
        setAddressesError('Failed to load addresses. Please try again.');
        setSavedAddresses([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    loadSavedAddresses();
  }, []);

  // Load delivery slots from API on component mount
  useEffect(() => {
    const loadDeliverySlots = async () => {
      try {
        setIsLoadingSlots(true);
        setSlotsErrorMessage(null);
        const response = await getDeliverySlots();

        console.log('📅 Delivery Slots API Response:', response);

        if (response.success && response.data && response.data.length > 0) {
          console.log('✅ Found delivery slots from API:', response.data);
          // Transform API data to UI format
          const transformedSlots = response.data.map(transformDeliverySlotFromAPI);
          console.log('📅 Transformed slots:', transformedSlots);
          // Generate time slots from API data
          const generatedSlots = generateTimeSlotsFromAPI(transformedSlots);
          console.log('📅 Generated time slots:', generatedSlots);
          setTimeSlots(generatedSlots);
          setSlotsErrorMessage(null);
        } else {
          // Display API message when slots are not available
          const apiMessage = response.message || 'Delivery slots are not available at this time.';
          console.warn('⚠️ No delivery slots found from API. Message:', apiMessage);
          setTimeSlots([]);
          setSlotsErrorMessage(apiMessage);
        }
      } catch (error) {
        console.error('❌ Failed to load delivery slots:', error);
        // Display error message from API response if available
        const errorMessage = error.message || 'Failed to load delivery slots. Please try again later.';
        setTimeSlots([]);
        setSlotsErrorMessage(errorMessage);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadDeliverySlots();
  }, []);

  // Load payment modes from API on component mount
  useEffect(() => {
    const loadPaymentModes = async () => {
      try {
        setIsLoadingPaymentModes(true);
        const modes = await getEnabledPaymentModes();

        // Set the first enabled payment mode as default
        if (modes.length > 0) {
          const defaultMode = mapPaymentModeToUI(modes[0].name);
          if (defaultMode) {
            setFormData(prev => ({
              ...prev,
              paymentMethod: defaultMode
            }));
          }
        }

        setEnabledPaymentModes(modes);
      } catch (error) {
        console.error('❌ Failed to load payment modes:', error);
        setEnabledPaymentModes([]);
      } finally {
        setIsLoadingPaymentModes(false);
      }
    };

    loadPaymentModes();
  }, []);

  // Modal states
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Helper function to get payment method UI details
  const getPaymentMethodDetails = (paymentMode) => {
    const methodMap = {
      'POD': { value: 'cod', icon: '💵', name: 'Cash on Delivery', description: 'Pay when you receive your order' },
      'Online Payment': { value: 'card', icon: '💳', name: 'Credit/Debit Card', description: 'Visa, Mastercard, RuPay' },
      'Bank Transfer': { value: 'netbanking', icon: '🏦', name: 'Net Banking', description: 'All major banks supported' },
      'Redeem Points': { value: 'points', icon: '⭐', name: 'Redeem Points', description: 'Use loyalty points' },
    };
    return methodMap[paymentMode] || { value: 'card', icon: '💳', name: paymentMode, description: '' };
  };

  // Helper function to format date from "DayName DD-MonthName-YYYY" to "YYYY-MM-DD"
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;

    try {
      console.log('📅 formatDateForAPI input:', dateString);

      // Parse date string like "Tuesday 25-November-2025" or "Monday 25-December-2025"
      // Remove the day name (first word) and split the rest
      const parts = dateString.trim().split(' ');

      if (parts.length >= 2) {
        // Get the date part (everything after the day name)
        // For "Tuesday 25-November-2025", parts[0] = "Tuesday", parts[1] = "25-November-2025"
        const datePart = parts.slice(1).join(' '); // Join in case there are spaces in the date part

        console.log('📅 Date part extracted:', datePart);

        // Split by hyphen: "25-November-2025" -> ["25", "November", "2025"]
        const dateComponents = datePart.split('-');

        if (dateComponents.length === 3) {
          const day = dateComponents[0].trim();
          const monthName = dateComponents[1].trim();
          const year = dateComponents[2].trim();

          console.log('📅 Parsed components:', { day, monthName, year });

          // Convert month name to number
          const monthMap = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
          };

          const month = monthMap[monthName];
          if (!month) {
            console.error('❌ Invalid month name:', monthName);
            return null;
          }

          const dayPadded = day.padStart(2, '0');
          const formattedDate = `${year}-${month}-${dayPadded}`;

          console.log('📅 Formatted date for API:', formattedDate);
          return formattedDate;
        } else {
          console.error('❌ Invalid date format - expected DD-MonthName-YYYY, got:', datePart);
        }
      } else {
        console.error('❌ Invalid date string format - expected "DayName DD-MonthName-YYYY", got:', dateString);
      }
    } catch (error) {
      console.error('❌ Error formatting date:', error, dateString);
    }

    return null;
  };

  // Helper function to get payment mode ID from selected payment method
  const getPaymentModeId = () => {
    // Map UI payment method to API payment mode name
    const paymentMethodToModeName = {
      'cod': 'POD',
      'card': 'Online Payment',
      'netbanking': 'Bank Transfer',
      'paytm': 'Online Payment', // Paytm might use Online Payment mode
      'upi': 'Online Payment' // UPI might use Online Payment mode
    };

    const modeName = paymentMethodToModeName[formData.paymentMethod];
    if (!modeName) {
      console.warn('Unknown payment method:', formData.paymentMethod);
      return null;
    }

    // Find the matching payment mode from enabledPaymentModes
    const matchingMode = enabledPaymentModes.find(mode => mode.name === modeName);
    if (!matchingMode) {
      console.warn('Payment mode not found:', modeName);
      return null;
    }

    // Return idpayment_mode if available, otherwise id
    return matchingMode.idpayment_mode || matchingMode.id;
  };

  // Helper function to build payment_details object for API
  const buildPaymentDetails = () => {
    const paymentMethod = formData.paymentMethod;

    // Map payment method to API payment method type
    const methodTypeMap = {
      'cod': 'cod',
      'card': 'online_payment',
      'upi': 'online_payment',
      'netbanking': 'online_payment',
      'paytm': 'online_payment'
    };

    const method = methodTypeMap[paymentMethod] || 'online_payment';

    const paymentDetails = {
      method: method
    };

    // Add card_last_four if card payment
    if (paymentMethod === 'card' && formData.cardNumber) {
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      if (cardNumber.length >= 4) {
        paymentDetails.card_last_four = cardNumber.slice(-4);
      }
    }

    // Generate transaction ID (in real app, this would come from payment gateway)
    paymentDetails.transaction_id = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return paymentDetails;
  };

  // Redirect if not authenticated or cart is empty
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, items, navigate]);

  const steps = [
    { id: 1, name: 'Checkout', description: 'Delivery & time slot' },
    { id: 2, name: 'Payment', description: 'Payment details' },
    { id: 3, name: 'Review', description: 'Review your order' },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field-specific error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    // Validate step 2 (payment) or step 3 (review - should have payment already validated)
    if (step === 2 || step === 3) {
      // Payment validation based on selected method
      if (formData.paymentMethod === 'card') {
        // No validation needed for Razorpay - payment will be handled at checkout
      } else if (formData.paymentMethod === 'upi') {
        if (!formData.upiId || !formData.upiId.trim()) newErrors.upiId = 'UPI ID is required';
        else if (!formData.upiId.includes('@')) newErrors.upiId = 'Please enter a valid UPI ID';
      } else if (formData.paymentMethod === 'netbanking') {
        if (!formData.bankName || !formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
      } else if (formData.paymentMethod === 'paytm') {
        if (!formData.paytmNumber || !formData.paytmNumber.trim()) newErrors.paytmNumber = 'Paytm number is required';
        else if (!/^\d{10}$/.test(formData.paytmNumber.replace(/\s/g, ''))) newErrors.paytmNumber = 'Paytm number must be exactly 10 digits';
      }
      // COD doesn't need additional validation
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🔍 validateStep result:', { step, isValid, errors: newErrors });
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1 && !checkoutData.selectedTimeSlot) {
        // Don't allow next if time slot not selected
        return;
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Checkout section handlers
  const handleDeliveryModeChange = (mode) => {
    setCheckoutData(prev => ({
      ...prev,
      deliveryMode: mode,
      selectedPickupPoint: null,
      selectedAddress: null,
      selectedTimeSlot: null,
      selectedDate: null
    }));
  };

  const handlePickupPointSelect = (pickupPoint) => {
    setCheckoutData(prev => ({
      ...prev,
      selectedPickupPoint: pickupPoint
    }));
  };

  const handleAddressSelect = (address) => {
    setCheckoutData(prev => ({
      ...prev,
      selectedAddress: address
    }));
  };


  const handleTimeSlotSelect = (date, timeSlot) => {
    setCheckoutData(prev => ({
      ...prev,
      selectedDate: date,
      selectedTimeSlot: timeSlot
    }));
  };

  const handleConfirmLocation = () => {
    if (checkoutData.deliveryMode === 'pickup' && checkoutData.selectedPickupPoint) {
      // Open time slot modal
      setShowTimeSlotModal(true);
    } else if (checkoutData.deliveryMode === 'home' && checkoutData.selectedAddress) {
      // Open time slot modal
      setShowTimeSlotModal(true);
    }
  };

  const handleConfirmTimeSlot = () => {
    setShowTimeSlotModal(false);
    setCurrentStep(2); // Move to payment step
  };

  const handleTimeSlotModalClose = () => {
    setShowTimeSlotModal(false);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // Guard against Pickup Mode (Not supported by backend yet)
    if (checkoutData.deliveryMode === 'pickup') {
      alert("Store Pickup is currently not supported. Please select Home Delivery.");
      return;
    }

    // If payment method is card (online payment), initiate Razorpay first
    if (formData.paymentMethod === 'card') {
      await handleRazorpayPayment();
      return;
    }

    // For COD and other payment methods, proceed with normal order placement
    await placeOrderAfterPayment(null);
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);

    try {
      // Step 1: Validate Cart one last time
      console.log('🔄 Verifying cart before payment...');
      const valResponse = await cartService.validateCart();

      if (!valResponse.success || (valResponse.validation && !valResponse.validation.valid)) {
        console.warn('❌ Cart validation failed:', valResponse);
        let msg = "Some items in your cart are no longer available.";
        if (valResponse.validation?.invalidItems?.length > 0) {
          msg += ` (${valResponse.validation.invalidItems[0].message})`;
        }
        alert(msg + "\nPlease review your cart.");
        navigate('/cart');
        return;
      }

      // Step 2: Initiate Razorpay payment
      console.log('💳 Initiating Razorpay payment...');

      processPayment({
        amount: Math.round(totalPrice), // Round to nearest rupee
        currency: 'INR',
        notes: {
          orderId: `ORDER_${Date.now()}`,
          userId: user?.id || user?.mobile,
          deliveryDate: checkoutData.selectedDate,
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.mobile || '',
        },
        onSuccess: async (paymentResponse) => {
          console.log('✅ Payment successful:', paymentResponse);
          setLoading(false);
          // Place order with payment details
          await placeOrderAfterPayment(paymentResponse);
        },
        onFailure: (error) => {
          console.error('❌ Payment failed:', error);
          setLoading(false);
          // Show the specific error message (e.g., AdBlocker warning)
          showError(error.message || 'Payment failed. Please try again.');
        },
      });

    } catch (error) {
      console.error('Payment initiation error:', error);
      alert(`Payment Failed: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const placeOrderAfterPayment = async (paymentResponse) => {
    setLoading(true);

    try {
      // Prepare Order Data
      const locationData = localStorage.getItem('confirmedLocation');
      const storeCode = locationData ? (JSON.parse(locationData)?.store?.storeCode || JSON.parse(locationData)?.store?.store_code) : null;

      if (!storeCode) {
        throw new Error("Store code missing. Please select a store.");
      }

      const selectedPaymentModeObj = enabledPaymentModes.find(mode =>
        mapPaymentModeToUI(mode.name) === formData.paymentMethod
      );

      const paymentModeId = selectedPaymentModeObj ? selectedPaymentModeObj.idpayment_mode : (formData.paymentMethod === 'cod' ? 1 : 2);

      // Prepare payment details
      let paymentDetails = getPaymentDetails();
      if (paymentResponse) {
        // Add Razorpay payment details
        paymentDetails = {
          ...paymentDetails,
          razorpay_payment_id: paymentResponse.paymentDetails?.paymentId,
          razorpay_order_id: paymentResponse.paymentDetails?.orderId,
          payment_status: 'completed',
          payment_method: paymentResponse.paymentDetails?.method,
          amount_paid: paymentResponse.paymentDetails?.amount / 100, // Convert from paise to rupees
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
        order_notes: '',
        payment_details: paymentDetails
      };

      console.log('📦 Placing Order:', orderPayload);

      // Place Order using apiPost
      const response = await apiPost('/orders/place-order', orderPayload);

      if (response.success) {
        const savedOrder = response.order;
        clearUserCart();
        setOrderNumber(savedOrder.order_number);
        setShowOrderSuccessModal(true);
        setSuccessMessage(`Order #${savedOrder.order_number} placed successfully!`);
        showSuccess(`Order placed successfully!`);
      } else {
        throw new Error(response.message || 'Failed to place order');
      }

    } catch (error) {
      console.error('Order placement error:', error);
      alert(`Order Failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDetails = () => {
    switch (formData.paymentMethod) {
      case 'card':
        return {
          payment_method: 'Online Payment',
          gateway: 'Razorpay',
        };
      case 'upi':
        return { upiId: formData.upiId };
      case 'netbanking':
        return { bankName: formData.bankName };
      case 'paytm':
        return { paytmNumber: `****${formData.paytmNumber.slice(-4)}` };
      case 'cod':
        return { method: 'Cash on Delivery' };
      default:
        return {};
    }
  };


  // Calculate MRP from items (to show savings)
  // If selling price = ₹100, MRP = ₹120 (20% savings = ₹20)
  const mrpTotal = items.reduce((total, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 1;
    // MRP is 25% more than selling price to show 20% savings
    // price = ₹100, MRP = ₹120, savings = 20% of ₹100 = ₹20
    const itemMrp = itemPrice * 1.20;
    return total + (itemMrp * itemQuantity);
  }, 0);

  // Calculate total savings (same as cart page - 20% discount)
  const calculateSavings = (price) => {
    const validPrice = Number(price) || 0;
    return Math.round(validPrice * 0.2);
  };

  const totalSavings = items.reduce((total, item) => {
    const validPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 1;
    return total + (calculateSavings(validPrice) * itemQuantity);
  }, 0);

  const shippingCost = 0; // Free delivery
  // Calculate tax from total price
  // Assuming 8% tax, extract the tax amount from the final total
  const taxPercent = 0.08;
  const taxAmount = (totalPrice / (1 + taxPercent)) * taxPercent;
  const finalTotal = totalPrice; // Total amount to pay (with tax included)

  if (!isAuthenticated || items.length === 0) {
    return null; // Will redirect in useEffect
  }

  // Check if pincode is selected
  const currentPincode = getCurrentPincode();
  const hasPincode = !!currentPincode || !!checkoutData.selectedPincode;

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Warning if no pincode is selected */}
      {!hasPincode && (
        <div className="mb-4 px-4 py-3 rounded-lg flex items-center" style={{ backgroundColor: COLORS.warning[50], borderColor: COLORS.warning[200], borderWidth: '1px', borderStyle: 'solid', color: COLORS.warning[800] }}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Please select a pincode to continue</p>
            <p className="text-sm">Please use the pincode selector in the header to select your delivery location.</p>
          </div>
        </div>
      )}
      <div className={`mx-auto ${currentStep === 3 ? 'max-w-6xl' : 'max-w-4xl'}`}>
        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center flex-shrink-0 ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm ${currentStep >= step.id ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'
                    }`}>
                    {step.id}
                  </div>
                  <div className={`ml-2 ${isMobile ? 'hidden' : 'hidden sm:block'}`}>
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 flex-shrink-0 ${currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : currentStep === 3 ? 'lg:grid-cols-7 gap-8' : 'lg:grid-cols-5 gap-8'}`}>
          {/* Main Content */}
          <div className={`${isMobile ? 'order-2' : currentStep === 3 ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
            <Card>
              {/* Step 1: Checkout - Delivery Mode & Time Slot */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold" style={{ color: COLORS.gray[900] }}>Checkout</h2>

                  {/* Selected Pincode */}
                  <div className="flex items-center mb-6" style={{ color: COLORS.gray[600] }}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Selected Pincode: {checkoutData.selectedPincode || getCurrentPincode() || 'Not selected'}</span>
                  </div>

                  {/* Step 1: Select a delivery mode */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3" style={{ backgroundColor: COLORS.primary[500] }}>
                        1
                      </div>
                      <h3 className="text-lg font-semibold" style={{ color: COLORS.gray[900] }}>Select a delivery mode</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pick Up Point Option */}
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${checkoutData.deliveryMode === 'pickup'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <input
                          type="radio"
                          name="deliveryMode"
                          value="pickup"
                          checked={checkoutData.deliveryMode === 'pickup'}
                          onChange={(e) => handleDeliveryModeChange(e.target.value)}
                          style={{ accentColor: COLORS.primary[600] }}
                        />
                        <div className="ml-3 flex items-center flex-1">
                          <div className="text-2xl mr-3">🏪</div>
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: COLORS.gray[900] }}>Pick Up Point</p>
                            <span className="inline-block text-xs px-2 py-1 rounded-full mt-1" style={{ backgroundColor: COLORS.primary[100], color: COLORS.primary[800] }}>
                              Free Delivery
                            </span>
                          </div>
                        </div>
                      </label>

                      {/* Home Delivery Option */}
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${checkoutData.deliveryMode === 'home'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <input
                          type="radio"
                          name="deliveryMode"
                          value="home"
                          checked={checkoutData.deliveryMode === 'home'}
                          onChange={(e) => handleDeliveryModeChange(e.target.value)}
                          style={{ accentColor: COLORS.primary[600] }}
                        />
                        <div className="ml-3 flex items-center flex-1">
                          <div className="text-2xl mr-3">🏠</div>
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: COLORS.gray[900] }}>Home Delivery</p>
                            <div className="flex items-center mt-1">
                              <span className="text-sm line-through mr-2" style={{ color: COLORS.gray[500] }}>₹49.00</span>
                              <span className="font-semibold" style={{ color: COLORS.warning[600] }}>₹0</span>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Pickup Points Selection */}
                  {checkoutData.deliveryMode === 'pickup' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold" style={{ color: COLORS.gray[900] }}>Pickup Points</h3>
                          {confirmedLocation?.pincode && (
                            <p className="text-sm mt-1" style={{ color: COLORS.gray[600] }}>
                              Available stores in {confirmedLocation.pincode.pincode}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const currentPincode = getCurrentPincode();
                              if (currentPincode) {
                                fetchPickupStores(currentPincode);
                              }
                            }}
                            disabled={isLoadingStores}
                            className="text-sm font-medium disabled:opacity-50 transition-colors"
                            style={{ color: COLORS.primary[600] }}
                            onMouseEnter={(e) => {
                              if (!isLoadingStores) {
                                e.target.style.color = COLORS.primary[700];
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isLoadingStores) {
                                e.target.style.color = COLORS.primary[600];
                              }
                            }}
                          >
                            {isLoadingStores ? 'Loading...' : 'Refresh'}
                          </button>
                        </div>
                      </div>

                      {isLoadingStores ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.primary[500] }}></div>
                          <span className="ml-2" style={{ color: COLORS.gray[600] }}>Loading stores...</span>
                        </div>
                      ) : pickupStores.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.gray[100] }}>
                            <svg className="w-6 h-6" style={{ color: COLORS.gray[400] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="font-medium mb-2" style={{ color: COLORS.gray[700] }}>No pickup points available</p>
                          <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                            {storesError || 'Please select a different location or try home delivery.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pickupStores.map((point) => (
                            <label key={point.id} className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${checkoutData.selectedPickupPoint?.id === point.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                              } ${!point.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <input
                                type="radio"
                                name="pickupPoint"
                                value={point.id}
                                checked={checkoutData.selectedPickupPoint?.id === point.id}
                                onChange={() => handlePickupPointSelect(point)}
                                disabled={!point.isAvailable}
                                className="text-green-600 focus:ring-green-500 mt-1"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <p className="font-medium text-gray-900">{point.name}</p>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{point.address}</p>
                                    <div className="flex items-center mt-2 space-x-4 flex-wrap">
                                      <span className="text-sm text-gray-500">Distance: {point.distance}</span>
                                      <span className="text-sm text-gray-500">Timings: {point.timings}</span>
                                      {point.contactNumber && (
                                        <span className="text-sm text-gray-500">Contact: {point.contactNumber}</span>
                                      )}
                                      {point.minOrderAmount && (
                                        <span className="text-sm text-gray-500">Min Order: ₹{point.minOrderAmount}</span>
                                      )}
                                    </div>
                                    {point.storeMessage && (
                                      <p className="text-xs text-blue-600 mt-1 italic">{point.storeMessage}</p>
                                    )}
                                  </div>
                                  {!point.isAvailable && (
                                    <span className="text-xs text-red-600 font-medium">Unavailable</span>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      <Button
                        onClick={handleConfirmLocation}
                        disabled={!checkoutData.selectedPickupPoint}
                        className="w-full"
                      >
                        Confirm Location
                      </Button>
                    </div>
                  )}

                  {/* Home Delivery - Address Selection */}
                  {checkoutData.deliveryMode === 'home' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Saved addresses</h3>
                        <button
                          onClick={() => navigate('/address')}
                          className="text-sm font-medium transition-colors"
                          style={{ color: COLORS.primary[600] }}
                          onMouseEnter={(e) => e.target.style.color = COLORS.primary[700]}
                          onMouseLeave={(e) => e.target.style.color = COLORS.primary[600]}
                        >
                          + Add New Address
                        </button>
                      </div>

                      {isLoadingAddresses ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.primary[500] }}></div>
                          <span className="ml-2" style={{ color: COLORS.gray[600] }}>Loading addresses...</span>
                        </div>
                      ) : addressesError ? (
                        <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: COLORS.error[50], borderColor: COLORS.error[200], borderWidth: '1px', borderStyle: 'solid', color: COLORS.error[800] }}>
                          <p className="text-sm">{addressesError}</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm underline transition-colors"
                            style={{ color: COLORS.error[800] }}
                            onMouseEnter={(e) => e.target.style.color = COLORS.error[900]}
                            onMouseLeave={(e) => e.target.style.color = COLORS.error[800]}
                          >
                            Try again
                          </button>
                        </div>
                      ) : savedAddresses.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.gray[100] }}>
                            <svg className="w-6 h-6" style={{ color: COLORS.gray[400] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="font-medium mb-2" style={{ color: COLORS.gray[700] }}>No saved addresses</p>
                          <p className="text-sm mb-4" style={{ color: COLORS.gray[500] }}>Add an address to continue with home delivery</p>
                          <button
                            onClick={() => navigate('/address')}
                            className="text-sm font-medium transition-colors"
                            style={{ color: COLORS.primary[600] }}
                            onMouseEnter={(e) => e.target.style.color = COLORS.primary[700]}
                            onMouseLeave={(e) => e.target.style.color = COLORS.primary[600]}
                          >
                            + Add New Address
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {savedAddresses.map((address) => (
                            <label
                              key={address.id || address.mongoId}
                              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${checkoutData.selectedAddress?.id === address.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <input
                                type="radio"
                                name="address"
                                value={address.id}
                                checked={checkoutData.selectedAddress?.id === address.id}
                                onChange={() => handleAddressSelect({
                                  id: address.id,
                                  name: address.name,
                                  address: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city} ${address.pinCode}`,
                                  email: address.email,
                                  city: address.city,
                                  pinCode: address.pinCode
                                })}
                                className="mt-1"
                                style={{ accentColor: COLORS.primary[600] }}
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <svg className="w-4 h-4" style={{ color: COLORS.primary[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <p className="font-medium" style={{ color: COLORS.gray[900] }}>{address.name}</p>
                                      {address.isDefault && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: COLORS.primary[100], color: COLORS.primary[800] }}>
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm" style={{ color: COLORS.gray[600] }}>
                                      {address.addressLine1}
                                      {address.addressLine2 && <>, {address.addressLine2}</>}
                                    </p>
                                    <p className="text-sm" style={{ color: COLORS.gray[600] }}>
                                      {address.city} - {address.pinCode}
                                    </p>
                                    {address.email && (
                                      <p className="text-sm mt-1" style={{ color: COLORS.gray[500] }}>Email: {address.email}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate('/address');
                                    }}
                                    className="text-sm flex items-center ml-2 transition-colors"
                                    style={{ color: COLORS.secondary[600] }}
                                    onMouseEnter={(e) => e.target.style.color = COLORS.secondary[700]}
                                    onMouseLeave={(e) => e.target.style.color = COLORS.secondary[600]}
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={handleConfirmLocation}
                        disabled={!checkoutData.selectedAddress || savedAddresses.length === 0}
                        className="w-full"
                      >
                        CONFIRM ADDRESS
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Select a time slot (disabled until location is confirmed) */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${checkoutData.selectedPickupPoint || checkoutData.selectedAddress
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                        }`}>
                        2
                      </div>
                      <h3 className={`text-lg font-semibold ${checkoutData.selectedPickupPoint || checkoutData.selectedAddress
                        ? 'text-gray-900'
                        : 'text-gray-400'
                        }`}>
                        Select a time slot
                      </h3>
                    </div>

                    {checkoutData.selectedPickupPoint || checkoutData.selectedAddress ? (
                      <div className="space-y-4">
                        <div className="flex items-center" style={{ color: COLORS.primary[600] }}>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm">
                            Your selected {checkoutData.deliveryMode === 'pickup' ? 'pickup point' : 'home delivery address'} is confirmed
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                            <div className="text-2xl mr-3">🚚</div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">Shipment 1: {totalItems} items</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedShipment(1);
                                setShowTimeSlotModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                              </svg>
                              Tap to Select
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600">
                          Why am I seeing multiple shipments? <span className="text-green-600 underline cursor-pointer">Know More</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: COLORS.gray[500] }}>Please select a delivery mode and confirm location first</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Payment Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold" style={{ color: COLORS.gray[900] }}>Payment Information</h2>

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium mb-3" style={{ color: COLORS.gray[700] }}>
                      Select Payment Method <span style={{ color: COLORS.error[500] }}>*</span>
                    </label>

                    {isLoadingPaymentModes ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.primary[500] }}></div>
                        <span className="ml-2" style={{ color: COLORS.gray[600] }}>Loading payment methods...</span>
                      </div>
                    ) : enabledPaymentModes.length === 0 ? (
                      <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: COLORS.warning[50], borderColor: COLORS.warning[200], borderWidth: '1px', borderStyle: 'solid', color: COLORS.warning[800] }}>
                        <p className="text-sm">No payment methods available. Please try again later.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enabledPaymentModes.map((mode) => {
                          const details = getPaymentMethodDetails(mode.name);
                          return (
                            <label
                              key={mode.id}
                              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === details.value
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={details.value}
                                checked={formData.paymentMethod === details.value}
                                onChange={handleInputChange}
                                style={{ accentColor: COLORS.primary[600] }}
                              />
                              <div className="ml-3 flex items-center">
                                <span className="text-lg mr-2">{details.icon}</span>
                                <div>
                                  <p className="font-medium" style={{ color: COLORS.gray[900] }}>{details.name}</p>
                                  {details.description && (
                                    <p className="text-sm" style={{ color: COLORS.gray[500] }}>{details.description}</p>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Conditional Payment Forms */}
                  {formData.paymentMethod === 'card' && (
                    <div className="space-y-4 mt-6 p-4 rounded-lg" style={{ backgroundColor: COLORS.gray[50] }}>
                      <h3 className="text-lg font-medium" style={{ color: COLORS.gray[900] }}>Online Payment</h3>
                      <p className="text-sm" style={{ color: COLORS.gray[600] }}>
                        Pay securely using Razorpay - Credit/Debit Card, UPI, Net Banking, and more.
                      </p>
                      <div className="flex items-center space-x-2 mt-4">
                        <svg className="w-5 h-5" style={{ color: COLORS.success[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-sm" style={{ color: COLORS.gray[700] }}>Secured by Razorpay</span>
                      </div>
                      <p className="text-xs mt-2" style={{ color: COLORS.gray[500] }}>
                        Payment gateway will open at final checkout. No card details are stored on our servers.
                      </p>
                    </div>
                  )}

                  {formData.paymentMethod === 'upi' && (
                    <div className="space-y-4 mt-6 p-4 rounded-lg" style={{ backgroundColor: COLORS.gray[50] }}>
                      <h3 className="text-lg font-medium" style={{ color: COLORS.gray[900] }}>UPI Details</h3>
                      <Input
                        label="UPI ID"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleInputChange}
                        error={errors.upiId}
                        placeholder="yourname@paytm"
                        required
                      />
                    </div>
                  )}

                  {formData.paymentMethod === 'netbanking' && (
                    <div className="space-y-4 mt-6 p-4 rounded-lg" style={{ backgroundColor: COLORS.gray[50] }}>
                      <h3 className="text-lg font-medium" style={{ color: COLORS.gray[900] }}>Net Banking</h3>
                      <Input
                        label="Bank Name"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        error={errors.bankName}
                        placeholder="e.g., HDFC Bank, ICICI Bank"
                        required
                      />
                    </div>
                  )}

                  {formData.paymentMethod === 'paytm' && (
                    <div className="space-y-4 mt-6 p-4 rounded-lg" style={{ backgroundColor: COLORS.gray[50] }}>
                      <h3 className="text-lg font-medium" style={{ color: COLORS.gray[900] }}>Paytm Details</h3>
                      <Input
                        label="Paytm Number"
                        name="paytmNumber"
                        value={formData.paytmNumber}
                        onChange={handleInputChange}
                        error={errors.paytmNumber}
                        placeholder="10-digit mobile number"
                        maxLength="10"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Review Order */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: COLORS.gray[900] }}>Review Your Order</h2>
                      <p className="text-sm mt-1" style={{ color: COLORS.gray[600] }}>Please review all details before placing your order</p>
                    </div>
                    <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: COLORS.primary[100] }}>
                      <svg className="w-6 h-6" style={{ color: COLORS.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.white, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                    <div className="px-4 sm:px-6 py-4 border-b" style={{ borderColor: COLORS.gray[200], backgroundColor: COLORS.gray[50] }}>
                      <h3 className="text-base font-semibold flex items-center" style={{ color: COLORS.gray[900] }}>
                        <svg className="w-5 h-5 mr-2" style={{ color: COLORS.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Order Items ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                      </h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-3">
                        {items.slice(0, 3).map((item) => {
                          const itemPrice = Number(item.price) || 0;
                          const itemQuantity = Number(item.quantity) || 1;
                          return (
                            <div key={item.id} className="flex items-center space-x-4 py-3 border-b last:border-b-0" style={{ borderColor: COLORS.gray[100] }}>
                              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.gray[100] }}>
                                {item.image ? (
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-8 h-8" style={{ color: COLORS.gray[400] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate" style={{ color: COLORS.gray[900] }}>{item.title}</h4>
                                <p className="text-xs mt-1" style={{ color: COLORS.gray[500] }}>Qty: {itemQuantity}</p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-sm font-semibold" style={{ color: COLORS.gray[900] }}>₹{(itemPrice * itemQuantity).toFixed(2)}</p>
                              </div>
                            </div>
                          );
                        })}
                        {items.length > 3 && (
                          <div className="pt-2 text-center">
                            <p className="text-sm font-medium" style={{ color: COLORS.primary[600] }}>+ {items.length - 3} more {items.length - 3 === 1 ? 'item' : 'items'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.white, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                    <div className="px-4 sm:px-6 py-4 border-b" style={{ borderColor: COLORS.gray[200], backgroundColor: COLORS.gray[50] }}>
                      <h3 className="text-base font-semibold flex items-center" style={{ color: COLORS.gray[900] }}>
                        <svg className="w-5 h-5 mr-2" style={{ color: COLORS.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Delivery Information
                      </h3>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4">
                      {/* Delivery Method & Address */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary[100] }}>
                          {checkoutData.deliveryMode === 'pickup' ? (
                            <svg className="w-5 h-5" style={{ color: COLORS.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" style={{ color: COLORS.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold" style={{ color: COLORS.gray[900] }}>
                              {checkoutData.deliveryMode === 'pickup' ? 'Pick Up Point' : 'Home Delivery'}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.success[100], color: COLORS.success[800] }}>
                              Confirmed
                            </span>
                          </div>
                          {checkoutData.deliveryMode === 'pickup' && checkoutData.selectedPickupPoint && (
                            <div className="mt-2">
                              <p className="text-sm font-medium" style={{ color: COLORS.gray[700] }}>{checkoutData.selectedPickupPoint.name}</p>
                              <p className="text-sm mt-1" style={{ color: COLORS.gray[600] }}>{checkoutData.selectedPickupPoint.address}</p>
                            </div>
                          )}
                          {checkoutData.deliveryMode === 'home' && checkoutData.selectedAddress && (
                            <div className="mt-2">
                              <p className="text-sm font-medium" style={{ color: COLORS.gray[700] }}>{checkoutData.selectedAddress.name}</p>
                              <p className="text-sm mt-1" style={{ color: COLORS.gray[600] }}>{checkoutData.selectedAddress.address}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Time Slot */}
                      {checkoutData.selectedTimeSlot && (
                        <div className="flex items-start space-x-4 pt-4 border-t" style={{ borderColor: COLORS.gray[200] }}>
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.success[100] }}>
                            <svg className="w-5 h-5" style={{ color: COLORS.success[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Delivery Time Slot</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.primary[50], color: COLORS.primary[700] }}>
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {checkoutData.selectedDate}
                              </span>
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.success[50], color: COLORS.success[700] }}>
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {checkoutData.selectedTimeSlot.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.white, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                    <div className="px-4 sm:px-6 py-4 border-b" style={{ borderColor: COLORS.gray[200], backgroundColor: COLORS.gray[50] }}>
                      <h3 className="text-base font-semibold flex items-center" style={{ color: COLORS.gray[900] }}>
                        <svg className="w-5 h-5 mr-2" style={{ color: COLORS.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Payment Information
                      </h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.secondary[100] }}>
                          {formData.paymentMethod === 'cod' ? (
                            <svg className="w-5 h-5" style={{ color: COLORS.secondary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          ) : formData.paymentMethod === 'card' ? (
                            <svg className="w-5 h-5" style={{ color: COLORS.secondary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" style={{ color: COLORS.secondary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold" style={{ color: COLORS.gray[900] }}>Payment Method</h4>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.success[100], color: COLORS.success[800] }}>
                              Ready
                            </span>
                          </div>
                          <p className="text-sm mt-2" style={{ color: COLORS.gray[700] }}>
                            {formData.paymentMethod === 'card' && formData.cardNumber && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Card ending in {formData.cardNumber.slice(-4)}
                              </span>
                            )}
                            {formData.paymentMethod === 'upi' && formData.upiId && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                UPI ID: {formData.upiId}
                              </span>
                            )}
                            {formData.paymentMethod === 'netbanking' && formData.bankName && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Bank: {formData.bankName}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Payment Method</h3>
                        <p className="text-sm text-gray-600">
                          {formData.paymentMethod === 'card' && formData.cardNumber && `Card ending in ${formData.cardNumber.slice(-4)}`}
                          {formData.paymentMethod === 'upi' && formData.upiId && `UPI ID: ${formData.upiId}`}
                          {formData.paymentMethod === 'netbanking' && formData.bankName && `Net Banking: ${formData.bankName}`}
                          {formData.paymentMethod === 'paytm' && formData.paytmNumber && `Paytm: ****${formData.paytmNumber.slice(-4)}`}
                          {formData.paymentMethod === 'cod' && 'Cash on Delivery'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between'} mt-8 pt-6 border-t`}>
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handleBack} className={isMobile ? 'w-full' : ''}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button onClick={handleNext} className={isMobile ? 'w-full' : ''}>
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      console.log('🔘 Place Order button clicked', { currentStep, loading });
                      e.preventDefault();
                      handleSubmit();
                    }}
                    disabled={loading}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className={`${isMobile ? 'order-1' : currentStep === 3 ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            <Card className="sticky top-4">
              {/* Header */}
              <div className="pb-3 border-b mb-4" style={{ borderColor: COLORS.gray[200] }}>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-lg font-bold flex items-center" style={{ color: COLORS.gray[900] }}>
                    <svg className="w-5 h-5 mr-1.5" style={{ color: COLORS.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Bill Summary
                  </h3>
                </div>
                <p className="text-xs flex items-center" style={{ color: COLORS.gray[600] }}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </p>
              </div>

              {/* Order Items List */}
              <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                {items.map(item => {
                  const itemPrice = Number(item.price) || 0;
                  const itemQuantity = Number(item.quantity) || 1;
                  return (
                    <div key={item.id} className="flex items-center space-x-2 py-1.5 border-b last:border-b-0" style={{ borderColor: COLORS.gray[100] }}>
                      <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden" style={{ backgroundColor: COLORS.gray[100] }}>
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5" style={{ color: COLORS.gray[400] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: COLORS.gray[900] }}>{item.title}</p>
                        <p className="text-xs" style={{ color: COLORS.gray[500] }}>Qty: {itemQuantity}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-semibold" style={{ color: COLORS.gray[900] }}>₹{(itemPrice * itemQuantity).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5" style={{ color: COLORS.gray[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-xs" style={{ color: COLORS.gray[700] }}>MRP</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: COLORS.gray[700] }}>₹{mrpTotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5" style={{ color: COLORS.gray[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-xs" style={{ color: COLORS.gray[700] }}>Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: COLORS.warning[100], color: COLORS.warning[800] }}>
                      Free
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs line-through" style={{ color: COLORS.gray[400] }}>₹49</span>
                      <span className="text-xs font-semibold" style={{ color: COLORS.success[600] }}>₹0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Highlight */}
              <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: COLORS.success[50], borderWidth: '1px', borderStyle: 'solid', borderColor: COLORS.success[200] }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-1.5" style={{ backgroundColor: COLORS.success[100] }}>
                      <svg className="w-4 h-4" style={{ color: COLORS.success[700] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: COLORS.success[800] }}>You're saving</p>
                      <p className="text-base font-bold" style={{ color: COLORS.success[700] }}>₹{totalSavings.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Amount Section */}
              <div className="rounded-lg p-4 mb-3" style={{ backgroundColor: COLORS.primary[50], borderWidth: '2px', borderStyle: 'solid', borderColor: COLORS.primary[200] }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" style={{ color: COLORS.primary[700] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm font-semibold" style={{ color: COLORS.gray[900] }}>Total Amount</span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: COLORS.primary[700] }}>₹{finalTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center mt-1.5 pt-1.5 border-t" style={{ borderColor: COLORS.primary[200] }}>
                  <svg className="w-3.5 h-3.5 mr-1" style={{ color: COLORS.gray[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs" style={{ color: COLORS.gray[600] }}>
                    Tax ₹{taxAmount.toFixed(2)} incl.
                  </p>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center pt-3 border-t" style={{ borderColor: COLORS.gray[200] }}>
                <svg className="w-3.5 h-3.5 mr-1.5" style={{ color: COLORS.success[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-xs" style={{ color: COLORS.gray[600] }}>Secure payment</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Time Slot Selection Modal */}
      {showTimeSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select a time Slot</h3>
                <p className="text-sm text-gray-600 mt-1">Shipment 1: {totalItems} items</p>
              </div>
              <button
                onClick={handleTimeSlotModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
                  <span className="text-gray-600">Loading delivery slots...</span>
                </div>
              ) : slotsErrorMessage ? (
                <div className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Delivery Slots Unavailable</h4>
                    <p className="text-sm text-gray-700 max-w-md">{slotsErrorMessage}</p>
                  </div>
                </div>
              ) : timeSlots.length > 0 ? (
                <div className="space-y-6">
                  {timeSlots.map((dateSlot, dateIndex) => (
                    <div key={dateIndex} className="space-y-4">
                      {/* Date Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">{dateSlot.date}</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="w-2 h-2 bg-green-500 rounded-full"></div>
                            ))}
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Time Slots Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {dateSlot.slots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => handleTimeSlotSelect(dateSlot.date, slot)}
                            disabled={!slot.available}
                            className={`p-3 text-left border rounded-lg transition-colors ${slot.available
                              ? 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                              } ${checkoutData.selectedTimeSlot?.id === slot.id
                                ? 'border-green-500 bg-green-50'
                                : ''
                              }`}
                          >
                            <span className={`text-sm font-medium ${slot.available ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                              {slot.time}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  No delivery slots available
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={handleTimeSlotModalClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {slotsErrorMessage ? 'Close' : 'Cancel'}
              </button>
              {!slotsErrorMessage && timeSlots.length > 0 && (
                <Button
                  onClick={handleConfirmTimeSlot}
                  disabled={!checkoutData.selectedTimeSlot}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm Time Slot
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      <OrderSuccessModal
        isVisible={showOrderSuccessModal}
        onClose={() => setShowOrderSuccessModal(false)}
        orderNumber={orderNumber}
      />

    </div>
  );
};

export default CheckoutPage;
