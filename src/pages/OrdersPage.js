import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBagIcon,
  CalendarIcon,
  MapPinIcon,
  CreditCardIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContextOptimized';
import { useOrders } from '../context/OrderContext';
import AccountSidebar from '../components/AccountSidebar';

const OrdersPage = () => {
  const { user } = useAuth();
  const { orders, loading, error, fetchOrders } = useOrders();
  const navigate = useNavigate();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch orders from API when component mounts
  useEffect(() => {
    const loadOrders = async () => {
      if (user && isInitialLoad) {
        console.log('📦 Loading orders for user:', user);
        await fetchOrders(20);
        setIsInitialLoad(false);
      }
    };

    loadOrders();
  }, [user, isInitialLoad, fetchOrders]);

  // Orders from API are already filtered by authenticated user
  // Ensure userOrders is always an array
  const userOrders = Array.isArray(orders) ? orders : [];

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodDisplay = (method) => {
    if (!method) return 'N/A';

    // If it's already a formatted name from API, return as is
    if (method.includes(' ') || method.length > 10) {
      return method;
    }

    // Handle short codes
    const methodLower = method.toLowerCase();
    switch (methodLower) {
      case 'card':
        return 'Credit/Debit Card';
      case 'upi':
        return 'UPI';
      case 'netbanking':
        return 'Net Banking';
      case 'paytm':
        return 'Paytm';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return method;
    }
  };

  const getDeliveryMethodDisplay = (checkoutData) => {
    if (!checkoutData) return 'Standard Delivery';

    if (checkoutData.deliveryMode === 'pickup') {
      return `Pick Up Point - ${checkoutData.selectedPickupPoint?.name || 'Selected Location'}`;
    } else if (checkoutData.deliveryMode === 'home') {
      return 'Home Delivery';
    }

    return 'Standard Delivery';
  };

  const getDeliveryAddressDisplay = (order) => {
    // Handle new API response format
    if (order.deliveryAddress) {
      const addr = order.deliveryAddress;
      return {
        name: addr.full_name || 'N/A',
        address: `${addr.line_1 || ''}${addr.line_2 ? `, ${addr.line_2}` : ''}, ${addr.city || ''} - ${addr.pincode || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim() || 'Address not available',
        type: 'Home Delivery'
      };
    }
    // Handle legacy checkoutData format
    else if (order.checkoutData?.deliveryMode === 'pickup' && order.checkoutData?.selectedPickupPoint) {
      return {
        name: order.checkoutData.selectedPickupPoint.name,
        address: order.checkoutData.selectedPickupPoint.address,
        type: 'Pickup Point'
      };
    } else if (order.checkoutData?.deliveryMode === 'home' && order.checkoutData?.selectedAddress) {
      return {
        name: order.checkoutData.selectedAddress.name,
        address: order.checkoutData.selectedAddress.address,
        type: 'Home Delivery'
      };
    } else if (order.shippingInfo) {
      return {
        name: `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() || 'N/A',
        address: `${order.shippingInfo.address || ''}, ${order.shippingInfo.city || ''}, ${order.shippingInfo.state || ''} ${order.shippingInfo.zipCode || ''}`.trim() || 'Address not available',
        type: 'Home Delivery'
      };
    } else {
      return {
        name: 'N/A',
        address: 'Address not available',
        type: 'Home Delivery'
      };
    }
  };

  const getTimeSlotDisplay = (checkoutData) => {
    if (checkoutData?.selectedTimeSlot && checkoutData?.selectedDate) {
      return `${checkoutData.selectedDate} - ${checkoutData.selectedTimeSlot.time}`;
    }
    return 'Standard Delivery Time';
  };

  const getDeliveryDateDisplay = (order) => {
    // Handle new API response format with delivery slot and estimated delivery date
    if (order.estimatedDeliveryDate && order.deliverySlot && order.deliverySlot !== 'TBD') {
      try {
        const date = new Date(order.estimatedDeliveryDate);
        const dateStr = date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        // Format delivery slot (e.g., "09:00:00 - 21:00:00" to "09:00 AM - 09:00 PM")
        const slotParts = order.deliverySlot.split(' - ');
        let formattedSlot = order.deliverySlot;
        if (slotParts.length === 2) {
          try {
            const formatTime = (timeStr) => {
              const [hours, minutes] = timeStr.trim().split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour % 12 || 12;
              return `${displayHour}:${minutes} ${ampm}`;
            };
            formattedSlot = `${formatTime(slotParts[0])} - ${formatTime(slotParts[1])}`;
          } catch (e) {
            // Keep original if formatting fails
          }
        }
        return `${dateStr}, ${formattedSlot}`;
      } catch (error) {
        return `${order.deliverySlot}`;
      }
    }

    // If we have estimated delivery date only
    if (order.estimatedDeliveryDate) {
      try {
        const deliveryDate = new Date(order.estimatedDeliveryDate);
        return deliveryDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch (error) {
        console.error('Error parsing estimated delivery date:', error);
      }
    }

    // If we have delivery slot only
    if (order.deliverySlot && order.deliverySlot !== 'TBD') {
      return order.deliverySlot;
    }

    // If we have a selected time slot and date (legacy), show that
    if (order.checkoutData?.selectedTimeSlot && order.checkoutData?.selectedDate) {
      return getTimeSlotDisplay(order.checkoutData);
    }

    // If we have a delivery date, show that
    if (order.deliveryDate) {
      try {
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch (error) {
        console.error('Error parsing delivery date:', error);
      }
    }

    // Fallback to order date + 7 days
    if (order.orderDate || order.orderPlacedAt) {
      try {
        const orderDate = new Date(order.orderDate || order.orderPlacedAt);
        const deliveryDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        return deliveryDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch (error) {
        console.error('Error calculating delivery date:', error);
        return 'TBD';
      }
    }

    return 'TBD';
  };

  const getPaymentStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:w-64">
          <AccountSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-2 sm:p-4 lg:p-6 xl:p-8">
          <div className="max-w-4xl mx-auto w-full">
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">My Orders</h1>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <ShoppingBagIcon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading orders...</h3>
                  <p className="text-gray-600">Please wait while we fetch your orders</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6 mb-6">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error loading orders</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => fetchOrders(20)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm hover:shadow-md"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && userOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBagIcon className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">No orders yet</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Your order history will appear here</p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-2.5 sm:py-2 px-4 sm:px-6 rounded-lg transition-all shadow-sm hover:shadow-md min-h-[44px] sm:min-h-0 text-sm sm:text-base"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            ) : !loading && !error && (
              <div className="space-y-6">
                {userOrders.map((order) => (
                  <div key={order.orderNumber || order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
                    {/* Order Header */}
                    <div className="bg-gradient-to-r from-emerald-50 to-white px-4 sm:px-6 py-4 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <ShoppingBagIcon className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                              Order #{order.orderNumber || order.id}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {order.orderPlacedAt || order.orderDate ? (
                                `Placed on ${new Date(order.orderPlacedAt || order.orderDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}`
                              ) : (
                                'Order date not available'
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg capitalize ${getStatusColor(order.orderStatus || order.status || 'Pending')}`}>
                            {order.orderStatus || order.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">

                      {/* Order Info Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                        {/* Delivery Information */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                              <TruckIcon className="w-4 h-4 text-emerald-600" />
                              Delivery Information
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                                <p className="text-sm font-medium text-gray-900">{getDeliveryAddressDisplay(order).name}</p>
                                <p className="text-xs text-gray-600 mt-1 break-words">{getDeliveryAddressDisplay(order).address}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Expected Delivery</p>
                                <div className="flex items-center gap-2">
                                  <ClockIcon className="w-4 h-4 text-emerald-600" />
                                  <p className="text-sm font-medium text-gray-900">{getDeliveryDateDisplay(order)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Payment Information */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                              <CreditCardIcon className="w-4 h-4 text-emerald-600" />
                              Payment Information
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {getPaymentMethodDisplay(order.paymentMode || order.paymentMethod || 'N/A')}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md ${getPaymentStatusColor(order.paymentStatus)}`}>
                                  {order.paymentStatus === 'completed' && <CheckCircleIcon className="w-3 h-3" />}
                                  {order.paymentStatus === 'pending' && <ClockIcon className="w-3 h-3" />}
                                  {order.paymentStatus === 'failed' && <XCircleIcon className="w-3 h-3" />}
                                  {order.paymentStatus || 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="border-t border-gray-200 pt-3">
                        <h4 className="font-semibold text-sm text-gray-900 mb-2.5 flex items-center gap-1.5">
                          <ShoppingBagIcon className="w-4 h-4 text-emerald-600" />
                          Order Items ({order.itemsCount || order.orderSummary?.totalItems || 0} items)
                        </h4>
                        <div className="space-y-2 mb-4">
                          {(() => {
                            // Get items from various possible sources
                            const items = order.order_items || order.orderItems || order.items || [];

                            if (!Array.isArray(items) || items.length === 0) {
                              return (
                                <div className="text-center py-4 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-500">No items found</p>
                                </div>
                              );
                            }

                            return items.map((item, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <img
                                  src={item.product_image || item.image || '/images/logo.jpg'}
                                  alt={item.product_name || item.title || 'Product'}
                                  className="w-12 h-12 object-cover rounded flex-shrink-0 border border-gray-200"
                                  onError={(e) => {
                                    e.target.src = '/images/logo.jpg';
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">
                                    {item.product_name || item.title || 'Product'}
                                  </p>
                                  {item.product_brand && (
                                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                      {item.product_brand}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] text-gray-600">
                                      Qty: <span className="font-semibold">{item.quantity || 0}</span>
                                      {item.uom && <span className="ml-0.5">× {item.uom}</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                  <p className="text-xs font-bold text-gray-900">
                                    ₹{(item.total_price || (item.unit_price || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                  </p>
                                  {item.unit_price && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      ₹{item.unit_price.toFixed(2)}/{item.uom || 'unit'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gradient-to-br from-emerald-50 to-gray-50 rounded-lg p-3 border border-emerald-100">
                          <h4 className="font-semibold text-sm text-gray-900 mb-2.5">Order Summary</h4>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">Subtotal ({order.orderSummary?.totalItems || order.itemsCount || 0} items)</span>
                              <span className="font-medium text-gray-900">₹{(order.orderSummary?.subtotal || 0).toFixed(2)}</span>
                            </div>
                            {order.orderSummary?.taxAmount > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-medium text-gray-900">₹{(order.orderSummary.taxAmount || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">Delivery</span>
                              <span className={`font-medium ${order.orderSummary?.deliveryCharges === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {order.orderSummary?.deliveryCharges === 0 ? 'FREE' : `₹${(order.orderSummary?.deliveryCharges || 0).toFixed(2)}`}
                              </span>
                            </div>
                            {order.orderSummary?.discountAmount > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-emerald-600">Discount</span>
                                <span className="font-medium text-emerald-600">-₹{(order.orderSummary.discountAmount || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="border-t border-gray-300 pt-1.5 mt-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900">Total</span>
                                <span className="text-lg font-bold text-emerald-600">
                                  ₹{(order.orderSummary?.totalAmount || order.totalAmount || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
