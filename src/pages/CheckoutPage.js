import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { usePincode } from '../context/PincodeContext';
import { useResponsive } from '../hooks/useResponsive';
import { getPincodeStores, formatStoreData } from '../api/pincodeService';
import { getAddresses, transformAddressFromAPI } from '../api/addressApi';
import { getDeliverySlots, generateTimeSlotsFromAPI, generateDefaultTimeSlots, transformDeliverySlotFromAPI } from '../api/deliverySlotsApi';
import { getEnabledPaymentModes, mapPaymentModeToUI } from '../api/paymentModesApi';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import OrderSuccessModal from '../components/OrderSuccessModal';

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

// Fallback pickup points for when API is unavailable
const FALLBACK_PICKUP_POINTS = [
  {
    id: 'fallback_1',
    name: 'DMart Store - Panvel',
    address: 'Sector 3, Road No 2, New Panvel, Navi Mumbai - 410206',
    distance: '0.5 km',
    timings: '9:00 AM - 10:00 PM',
    isAvailable: true,
    storeCode: 'PAN001',
    contactNumber: '+91-9876543210',
    homeDelivery: false,
    selfPickup: true
  },
  {
    id: 'fallback_2',
    name: 'DMart Store - Kharghar',
    address: 'Plot No 1, Sector 12, Kharghar, Navi Mumbai - 410210',
    distance: '2.1 km',
    timings: '9:00 AM - 10:00 PM',
    isAvailable: true,
    storeCode: 'KHA001',
    contactNumber: '+91-9876543211',
    homeDelivery: false,
    selfPickup: true
  },
  {
    id: 'fallback_3',
    name: 'DMart Store - Vashi',
    address: 'Sector 17, Vashi, Navi Mumbai - 400703',
    distance: '5.2 km',
    timings: '9:00 AM - 10:00 PM',
    isAvailable: false,
    storeCode: 'VAS001',
    contactNumber: '+91-9876543212',
    homeDelivery: false,
    selfPickup: true
  }
];


// This function is replaced by generateDefaultTimeSlots from the API

const CheckoutPage = () => {
  const { items, totalItems, totalPrice, clearCart, clearUserCart } = useCart();
  const { isAuthenticated, user, setSuccessMessage } = useAuth();
  const { addOrder } = useOrders();
  const { getCurrentPincode, confirmedLocation } = usePincode();
  const navigate = useNavigate();
  const { isMobile, isTablet, getResponsiveValue } = useResponsive();

  // State for dynamic time slots
  const [timeSlots, setTimeSlots] = useState(generateDefaultTimeSlots());
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
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
      console.log('🏪 Fetching pickup stores for pincode:', pincode);
      const response = await getPincodeStores(pincode);
      console.log('🏪 API Response:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('🏪 Total stores from API:', response.data.length);
        
        // Transform API data to UI format first
        const formattedStores = response.data.map(store => formatStoreData(store));
        
        console.log('🏪 Formatted stores:', formattedStores);
        console.log('🏪 First store details:', formattedStores[0]);
        
        // Log filtering criteria for each store
        formattedStores.forEach((store, index) => {
          console.log(`🏪 Store ${index}:`, {
            name: store.storeName,
            selfPickup: store.selfPickup,
            isEnabled: store.isEnabled,
            passesFilter: store.isEnabled === true
          });
        });
        
        // Filter stores that are enabled
        // Note: Currently showing all enabled stores regardless of self_pickup status
        // as the API stores might not have self_pickup enabled
        const pickupEnabledStores = formattedStores
          .filter(store => {
            const passes = store.isEnabled === true;
            if (!passes) {
              console.log(`❌ Store filtered out: ${store.storeName}`, {
                isEnabled: store.isEnabled,
                typeOfIsEnabled: typeof store.isEnabled
              });
            }
            return passes;
          })
          .map(store => ({
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
          
        console.log('✅ Filtered pickup-enabled stores:', pickupEnabledStores);
        console.log('✅ Number of stores after filtering:', pickupEnabledStores.length);
        
        setPickupStores(pickupEnabledStores);
      } else {
        // Use fallback stores if no stores found
        setPickupStores(FALLBACK_PICKUP_POINTS);
        setStoresError('Using demo stores. Limited availability.');
      }
    } catch (error) {
      console.error('Error fetching pickup stores:', error);
      // Use fallback stores on error
      setPickupStores(FALLBACK_PICKUP_POINTS);
      setStoresError('Unable to load stores. Using demo data.');
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
        // If no pincode is selected, use fallback stores
        setPickupStores(FALLBACK_PICKUP_POINTS);
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
        } else {
          // Use default slots if API fails or returns no data
          console.warn('⚠️ No delivery slots found from API, using default slots. Response:', response);
          setTimeSlots(generateDefaultTimeSlots());
        }
      } catch (error) {
        console.error('❌ Failed to load delivery slots:', error);
        // Use default slots on error
        setTimeSlots(generateDefaultTimeSlots());
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

    if (step === 2) {
      // Payment validation based on selected method
      if (formData.paymentMethod === 'card') {
        if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
        if (!/^\d{12}$/.test(formData.cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'Card number must be exactly 12 digits';
        if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) newErrors.expiryDate = 'Expiry date must be in MM/YY format';
        if (!formData.cvv.trim()) newErrors.cvv = 'CVV is required';
        if (!/^\d{3}$/.test(formData.cvv)) newErrors.cvv = 'CVV must be exactly 3 digits';
        if (!formData.nameOnCard.trim()) newErrors.nameOnCard = 'Name on card is required';
      } else if (formData.paymentMethod === 'upi') {
        if (!formData.upiId.trim()) newErrors.upiId = 'UPI ID is required';
        if (!formData.upiId.includes('@')) newErrors.upiId = 'Please enter a valid UPI ID';
      } else if (formData.paymentMethod === 'netbanking') {
        if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
      } else if (formData.paymentMethod === 'paytm') {
        if (!formData.paytmNumber.trim()) newErrors.paytmNumber = 'Paytm number is required';
        if (!/^\d{10}$/.test(formData.paytmNumber.replace(/\s/g, ''))) newErrors.paytmNumber = 'Paytm number must be exactly 10 digits';
      }
      // COD doesn't need additional validation
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order object
      const order = {
        userId: user?.id ?? user?.mobile_no ?? 'guest',
        items: items,
        checkoutData: checkoutData, // Include all checkout details
        paymentMethod: formData.paymentMethod,
        paymentDetails: getPaymentDetails(),
        subtotal: totalPrice,
        shippingCost: shippingCost,
        taxAmount: taxAmount,
        totalAmount: finalTotal,
        orderDate: new Date().toISOString(),
        status: 'Processing',
        deliveryDate: checkoutData.selectedDate ? new Date(checkoutData.selectedDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now if no date selected
      };

      // Add order to context
      const savedOrder = addOrder(order);

      // Clear cart
      clearUserCart();
      
      // Set order number and show success modal
      setOrderNumber(savedOrder.id);
      setShowOrderSuccessModal(true);
      
      // Also set success message (for backup/fallback)
      setSuccessMessage(`Order #${savedOrder.id} placed successfully! Check your orders for details.`);
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDetails = () => {
    switch (formData.paymentMethod) {
      case 'card':
        return {
          cardNumber: `**** **** **** ${formData.cardNumber.slice(-4)}`,
          expiryDate: formData.expiryDate,
          nameOnCard: formData.nameOnCard,
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


  const shippingCost = totalPrice > 50 ? 0 : 9.99;
  const taxAmount = totalPrice * 0.08;
  const finalTotal = totalPrice + shippingCost + taxAmount;

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
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Please select a pincode to continue</p>
            <p className="text-sm">Please use the pincode selector in the header to select your delivery location.</p>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center flex-shrink-0 ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm ${
                    currentStep >= step.id ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'
                  }`}>
                    {step.id}
                  </div>
                  <div className={`ml-2 ${isMobile ? 'hidden' : 'hidden sm:block'}`}>
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 flex-shrink-0 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'lg:grid-cols-3 gap-8'}`}>
          {/* Main Content */}
          <div className={`${isMobile ? 'order-2' : 'lg:col-span-2'}`}>
            <Card>
              {/* Step 1: Checkout - Delivery Mode & Time Slot */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Checkout</h2>

                  {/* Selected Pincode */}
                  <div className="flex items-center text-gray-600 mb-6">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Selected Pincode: {checkoutData.selectedPincode || getCurrentPincode() || 'Not selected'}</span>
                  </div>

                  {/* Step 1: Select a delivery mode */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        1
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Select a delivery mode</h3>
                      <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pick Up Point Option */}
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        checkoutData.deliveryMode === 'pickup'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryMode"
                          value="pickup"
                          checked={checkoutData.deliveryMode === 'pickup'}
                          onChange={(e) => handleDeliveryModeChange(e.target.value)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="ml-3 flex items-center flex-1">
                          <div className="text-2xl mr-3">🏪</div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Pick Up Point</p>
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                              Free Delivery
                            </span>
                          </div>
                        </div>
                      </label>

                      {/* Home Delivery Option */}
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        checkoutData.deliveryMode === 'home'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryMode"
                          value="home"
                          checked={checkoutData.deliveryMode === 'home'}
                          onChange={(e) => handleDeliveryModeChange(e.target.value)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="ml-3 flex items-center flex-1">
                          <div className="text-2xl mr-3">🏠</div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Home Delivery</p>
                            <div className="flex items-center mt-1">
                              <span className="text-sm text-gray-500 line-through mr-2">₹49.00</span>
                              <span className="text-orange-600 font-semibold">₹0</span>
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
                          <h3 className="text-lg font-semibold text-gray-900">Pickup Points</h3>
                          {confirmedLocation?.pincode && (
                            <p className="text-sm text-gray-600 mt-1">
                              Available stores in {confirmedLocation.pincode.pincode}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {storesError && (
                            <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span>Demo Mode</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const currentPincode = getCurrentPincode();
                              if (currentPincode) {
                                fetchPickupStores(currentPincode);
                              }
                            }}
                            disabled={isLoadingStores}
                            className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50"
                          >
                            {isLoadingStores ? 'Loading...' : 'Refresh'}
                          </button>
                        </div>
                      </div>
                      
                      {isLoadingStores ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="ml-2 text-gray-600">Loading stores...</span>
                        </div>
                      ) : pickupStores.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-700 font-medium mb-2">No pickup points available</p>
                          <p className="text-sm text-gray-500">
                            {storesError || 'Please select a different location or try home delivery.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pickupStores.map((point) => (
                          <label key={point.id} className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            checkoutData.selectedPickupPoint?.id === point.id
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
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          + Add New Address
                        </button>
                      </div>
                      
                      {isLoadingAddresses ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="ml-2 text-gray-600">Loading addresses...</span>
                        </div>
                      ) : addressesError ? (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                          <p className="text-sm">{addressesError}</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm underline hover:text-red-900"
                          >
                            Try again
                          </button>
                        </div>
                      ) : savedAddresses.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-700 font-medium mb-2">No saved addresses</p>
                          <p className="text-sm text-gray-500 mb-4">Add an address to continue with home delivery</p>
                          <button
                            onClick={() => navigate('/address')}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            + Add New Address
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {savedAddresses.map((address) => (
                            <label 
                              key={address.id || address.mongoId}
                              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                checkoutData.selectedAddress?.id === address.id
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
                                className="text-green-600 focus:ring-green-500 mt-1"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <p className="font-medium text-gray-900">{address.name}</p>
                                      {address.isDefault && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {address.addressLine1}
                                      {address.addressLine2 && <>, {address.addressLine2}</>}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {address.city} - {address.pinCode}
                                    </p>
                                    {address.email && (
                                      <p className="text-sm text-gray-500 mt-1">Email: {address.email}</p>
                                    )}
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate('/address');
                                    }}
                                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center ml-2"
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
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        CONFIRM ADDRESS
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Select a time slot (disabled until location is confirmed) */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                        checkoutData.selectedPickupPoint || checkoutData.selectedAddress
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}>
                        2
                      </div>
                      <h3 className={`text-lg font-semibold ${
                        checkoutData.selectedPickupPoint || checkoutData.selectedAddress
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}>
                        Select a time slot
                      </h3>
                    </div>
                    
                    {checkoutData.selectedPickupPoint || checkoutData.selectedAddress ? (
                      <div className="space-y-4">
                        <div className="flex items-center text-green-600">
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
                      <p className="text-gray-500 text-sm">Please select a delivery mode and confirm location first</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Payment Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Payment Information</h2>

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Payment Method <span className="text-red-500">*</span>
                    </label>

                    {isLoadingPaymentModes ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        <span className="ml-2 text-gray-600">Loading payment methods...</span>
                      </div>
                    ) : enabledPaymentModes.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                        <p className="text-sm">No payment methods available. Please try again later.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enabledPaymentModes.map((mode) => {
                          const details = getPaymentMethodDetails(mode.name);
                          return (
                            <label 
                              key={mode.id} 
                              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                formData.paymentMethod === details.value
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
                                className="text-primary-600 focus:ring-primary-500"
                              />
                              <div className="ml-3 flex items-center">
                                <span className="text-lg mr-2">{details.icon}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{details.name}</p>
                                  {details.description && (
                                    <p className="text-sm text-gray-500">{details.description}</p>
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
                    <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Card Details</h3>

                      <Input
                        label="Name on Card"
                        name="nameOnCard"
                        value={formData.nameOnCard}
                        onChange={handleInputChange}
                        error={errors.nameOnCard}
                        required
                      />

                      <Input
                        label="Card Number"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        error={errors.cardNumber}
                        placeholder="123456789012"
                        maxLength="12"
                        required
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry Date"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          error={errors.expiryDate}
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                        />
                        <Input
                          label="CVV"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          error={errors.cvv}
                          placeholder="123"
                          maxLength="3"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === 'upi' && (
                    <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">UPI Details</h3>
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
                    <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Net Banking</h3>
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
                    <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900">Paytm Details</h3>
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
                  <h2 className="text-2xl font-semibold text-gray-900">Review Your Order</h2>

                  <div className="space-y-4">
                    {/* Delivery Method */}
                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Delivery Method</h3>
                        <p className="text-sm text-gray-600">
                          {checkoutData.deliveryMode === 'pickup' ? 'Pick Up Point' : 'Home Delivery'}
                          {checkoutData.deliveryMode === 'pickup' && checkoutData.selectedPickupPoint && (
                            <><br />{checkoutData.selectedPickupPoint.name}<br />{checkoutData.selectedPickupPoint.address}</>
                          )}
                          {checkoutData.deliveryMode === 'home' && checkoutData.selectedAddress && (
                            <><br />{checkoutData.selectedAddress.name}<br />{checkoutData.selectedAddress.address}</>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Time Slot */}
                    {checkoutData.selectedTimeSlot && (
                      <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Delivery Time Slot</h3>
                          <p className="text-sm text-gray-600">
                            {checkoutData.selectedDate}<br />
                            {checkoutData.selectedTimeSlot.time}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    {checkoutData.selectedAddress && (
                      <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Shipping Address</h3>
                          <p className="text-sm text-gray-600">
                            {checkoutData.selectedAddress.name}<br />
                            {checkoutData.selectedAddress.address}
                          </p>
                        </div>
                      </div>
                    )}
                    {checkoutData.selectedPickupPoint && (
                      <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Pickup Address</h3>
                          <p className="text-sm text-gray-600">
                            {checkoutData.selectedPickupPoint.name}<br />
                            {checkoutData.selectedPickupPoint.address}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
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
                  <Button onClick={handleSubmit} disabled={loading} className={isMobile ? 'w-full' : ''}>
                    {loading ? 'Processing...' : 'Place Order'}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className={`${isMobile ? 'order-1' : 'lg:col-span-1'}`}>
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Summary</h3>
              <p className="text-sm text-gray-600 mb-4">{totalItems} products</p>

              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.title} (x{item.quantity})</span>
                    <span className="text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">MRP</span>
                  <span className="text-gray-900">₹ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery charge</span>
                  <div className="flex items-center">
                    <span className="text-orange-600 text-xs mr-2">Special Offer Applied</span>
                    <div className="flex items-center">
                      <span className="text-gray-500 line-through mr-2">₹49</span>
                      <span className="text-orange-600 font-semibold">₹0</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Total Savings
                  </span>
                  <span className="text-green-600 font-semibold">₹ 1919</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount to Pay</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
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
                          className={`p-3 text-left border rounded-lg transition-colors ${
                            slot.available
                              ? 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                          } ${
                            checkoutData.selectedTimeSlot?.id === slot.id
                              ? 'border-green-500 bg-green-50'
                              : ''
                          }`}
                        >
                          <span className={`text-sm font-medium ${
                            slot.available ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {slot.time}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={handleTimeSlotModalClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleConfirmTimeSlot}
                disabled={!checkoutData.selectedTimeSlot}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm Time Slot
              </Button>
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
