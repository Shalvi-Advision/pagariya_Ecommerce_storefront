import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useResponsive } from '../hooks/useResponsive';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

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

// Mock data for pickup points
const PICKUP_POINTS = [
  {
    id: 1,
    name: 'DMart Store - Panvel',
    address: 'Sector 3, Road No 2, New Panvel, Navi Mumbai - 410206',
    distance: '0.5 km',
    timings: '9:00 AM - 10:00 PM',
    isAvailable: true
  },
  {
    id: 2,
    name: 'DMart Store - Kharghar',
    address: 'Plot No 1, Sector 12, Kharghar, Navi Mumbai - 410210',
    distance: '2.1 km',
    timings: '9:00 AM - 10:00 PM',
    isAvailable: true
  },
  {
    id: 3,
    name: 'DMart Store - Vashi',
    address: 'Sector 17, Vashi, Navi Mumbai - 400703',
    distance: '5.2 km',
    timings: '9:00 AM - 10:00 PM',
    isAvailable: false
  }
];

// Mock data for time slots
const TIME_SLOTS = [
  {
    date: 'Friday 19-September-2025',
    slots: [
      { id: 1, time: '07:00 AM - 10:00 AM', available: true },
      { id: 2, time: '10:00 AM - 12:30 PM', available: true },
      { id: 3, time: '11:00 AM - 02:00 PM', available: false },
      { id: 4, time: '12:00 PM - 03:00 PM', available: true },
      { id: 5, time: '02:00 PM - 05:00 PM', available: true },
      { id: 6, time: '04:30 PM - 07:30 PM', available: true },
      { id: 7, time: '07:30 PM - 10:00 PM', available: true },
      { id: 8, time: '08:00 PM - 11:00 PM', available: true }
    ]
  },
  {
    date: 'Saturday 20-September-2025',
    slots: [
      { id: 9, time: '07:00 AM - 10:00 AM', available: true },
      { id: 10, time: '10:00 AM - 12:30 PM', available: true },
      { id: 11, time: '11:00 AM - 02:00 PM', available: true },
      { id: 12, time: '12:00 PM - 03:00 PM', available: false },
      { id: 13, time: '02:00 PM - 05:00 PM', available: true },
      { id: 14, time: '04:30 PM - 07:30 PM', available: true },
      { id: 15, time: '07:30 PM - 10:00 PM', available: true },
      { id: 16, time: '08:00 PM - 11:00 PM', available: true }
    ]
  }
];

const CheckoutPage = () => {
  const { items, totalItems, totalPrice, clearCart, clearUserCart } = useCart();
  const { isAuthenticated, user, setSuccessMessage } = useAuth();
  const { addOrder } = useOrders();
  const navigate = useNavigate();
  const { isMobile, isTablet, getResponsiveValue } = useResponsive();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Shipping Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',

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

  // New checkout section state
  const [checkoutData, setCheckoutData] = useState({
    selectedPincode: '410206',
    deliveryMode: 'home', // 'pickup' or 'home'
    selectedPickupPoint: null,
    selectedAddress: null,
    selectedTimeSlot: null,
    selectedDate: null,
  });

  // Modal states
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    { id: 1, name: 'Shipping', description: 'Shipping information' },
    { id: 2, name: 'Checkout', description: 'Delivery & time slot' },
    { id: 3, name: 'Payment', description: 'Payment details' },
    { id: 4, name: 'Review', description: 'Review your order' },
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

    if (step === 1) {
      // Shipping validation
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Phone number must be exactly 10 digits';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
      if (!/^\d{6}$/.test(formData.zipCode.replace(/\s/g, ''))) newErrors.zipCode = 'ZIP code must be 6 digits';
    } else if (step === 2) {
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
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
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
      setShowTimeSlotModal(true);
    } else if (checkoutData.deliveryMode === 'home' && checkoutData.selectedAddress) {
      setShowTimeSlotModal(true);
    }
  };

  const handleConfirmTimeSlot = () => {
    setShowTimeSlotModal(false);
    setCurrentStep(3); // Move to payment step
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
        userId: user?.id || 'guest',
        items: items,
        shippingInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        paymentMethod: formData.paymentMethod,
        paymentDetails: getPaymentDetails(),
        checkoutData: checkoutData, // Include all checkout details
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

      // Show success message
      setSuccessMessage(`Order #${savedOrder.id} placed successfully! Check your orders for details.`);

      // Redirect to home page
      navigate('/');
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

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
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
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Shipping Information</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      error={errors.firstName}
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      error={errors.lastName}
                      required
                    />
                  </div>

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    required
                  />

                  <Input
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />

                  <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    error={errors.address}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      error={errors.city}
                      required
                    />
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 ${
                          errors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="ZIP Code"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      error={errors.zipCode}
                      required
                      placeholder="6-digit PIN code"
                    />
                    <Input
                      label="Country"
                      name="country"
                      value={formData.country}
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Checkout - Delivery Mode & Time Slot */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Checkout</h2>

                  {/* Selected Pincode */}
                  <div className="flex items-center text-gray-600 mb-6">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Selected Pincode: {checkoutData.selectedPincode}</span>
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
                      <h3 className="text-lg font-semibold text-gray-900">Pickup Points</h3>
                      <div className="space-y-3">
                        {PICKUP_POINTS.map((point) => (
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
                                  <div className="flex items-center mt-2 space-x-4">
                                    <span className="text-sm text-gray-500">Distance: {point.distance}</span>
                                    <span className="text-sm text-gray-500">Timings: {point.timings}</span>
                                  </div>
                                </div>
                                {!point.isAvailable && (
                                  <span className="text-xs text-red-600 font-medium">Unavailable</span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
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
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                          + Add New Address
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          checkoutData.selectedAddress?.id === 'shipping-address'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input
                            type="radio"
                            name="address"
                            value="shipping-address"
                            checked={checkoutData.selectedAddress?.id === 'shipping-address'}
                            onChange={() => handleAddressSelect({
                              id: 'shipping-address',
                              name: `${formData.firstName} ${formData.lastName}`,
                              address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
                              landmark: formData.address, // Using address as landmark for now
                              phone: formData.phone
                            })}
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
                                  <p className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</p>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {formData.address}, {formData.city}, {formData.state} {formData.zipCode}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-gray-500">Phone: {formData.phone}</p>
                                </div>
                              </div>
                              <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      <Button 
                        onClick={handleConfirmLocation}
                        disabled={!checkoutData.selectedAddress}
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

              {/* Step 3: Payment Information */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Payment Information</h2>

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Payment Method <span className="text-red-500">*</span>
                    </label>

                    <div className="space-y-3">
                      {/* Credit/Debit Card */}
                      <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.paymentMethod === 'card'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={formData.paymentMethod === 'card'}
                          onChange={handleInputChange}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex items-center">
                          <span className="text-lg mr-2">💳</span>
                          <div>
                            <p className="font-medium text-gray-900">Credit/Debit Card</p>
                            <p className="text-sm text-gray-500">Visa, Mastercard, RuPay</p>
                          </div>
                        </div>
                      </label>

                      {/* UPI */}
                      <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.paymentMethod === 'upi'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={formData.paymentMethod === 'upi'}
                          onChange={handleInputChange}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex items-center">
                          <span className="text-lg mr-2">📱</span>
                          <div>
                            <p className="font-medium text-gray-900">UPI</p>
                            <p className="text-sm text-gray-500">Paytm, Google Pay, PhonePe, BHIM UPI</p>
                          </div>
                        </div>
                      </label>

                      {/* Net Banking */}
                      <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.paymentMethod === 'netbanking'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="netbanking"
                          checked={formData.paymentMethod === 'netbanking'}
                          onChange={handleInputChange}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex items-center">
                          <span className="text-lg mr-2">🏦</span>
                          <div>
                            <p className="font-medium text-gray-900">Net Banking</p>
                            <p className="text-sm text-gray-500">All major banks supported</p>
                          </div>
                        </div>
                      </label>

                      {/* Paytm */}
                      <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.paymentMethod === 'paytm'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paytm"
                          checked={formData.paymentMethod === 'paytm'}
                          onChange={handleInputChange}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex items-center">
                          <span className="text-lg mr-2">💰</span>
                          <div>
                            <p className="font-medium text-gray-900">Paytm</p>
                            <p className="text-sm text-gray-500">Paytm Wallet</p>
                          </div>
                        </div>
                      </label>

                      {/* Cash on Delivery */}
                      <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.paymentMethod === 'cod'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={handleInputChange}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex items-center">
                          <span className="text-lg mr-2">💵</span>
                          <div>
                            <p className="font-medium text-gray-900">Cash on Delivery</p>
                            <p className="text-sm text-gray-500">Pay when you receive your order</p>
                          </div>
                        </div>
                      </label>
                    </div>
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

              {/* Step 4: Review Order */}
              {currentStep === 4 && (
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
                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Shipping Address</h3>
                        <p className="text-sm text-gray-600">
                          {formData.firstName} {formData.lastName}<br />
                          {formData.address}<br />
                          {formData.city}, {formData.state} {formData.zipCode}
                        </p>
                      </div>
                    </div>

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
                          {formData.paymentMethod === 'card' && `Card ending in ${formData.cardNumber.slice(-4)}`}
                          {formData.paymentMethod === 'upi' && `UPI ID: ${formData.upiId}`}
                          {formData.paymentMethod === 'netbanking' && `Net Banking: ${formData.bankName}`}
                          {formData.paymentMethod === 'paytm' && `Paytm: ****${formData.paytmNumber.slice(-4)}`}
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

                {currentStep < 4 ? (
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
                {TIME_SLOTS.map((dateSlot, dateIndex) => (
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

    </div>
  );
};

export default CheckoutPage;
