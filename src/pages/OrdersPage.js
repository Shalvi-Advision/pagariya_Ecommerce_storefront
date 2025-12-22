import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // Handle API response format
    if (order.deliveryAddress) {
      const addr = order.deliveryAddress;
      return {
        name: addr.full_name || 'N/A',
        address: `${addr.line_1 || ''}, ${addr.line_2 || ''}, ${addr.city || ''}, ${addr.pincode || ''}`.replace(/,\s*,/g, ',').trim() || 'Address not available',
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
    // Handle API response format with delivery slot
    if (order.deliverySlot && order.deliverySlot !== 'TBD') {
      // If we have estimated delivery date, combine with slot
      if (order.estimatedDeliveryDate) {
        try {
          const date = new Date(order.estimatedDeliveryDate);
          const dateStr = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          return `${dateStr} (${order.deliverySlot})`;
        } catch (error) {
          return order.deliverySlot;
        }
      }
      return order.deliverySlot;
    }

    // If we have a selected time slot and date (legacy), show that
    if (order.checkoutData?.selectedTimeSlot && order.checkoutData?.selectedDate) {
      return getTimeSlotDisplay(order.checkoutData);
    }

    // If we have estimated delivery date
    if (order.estimatedDeliveryDate) {
      try {
        const deliveryDate = new Date(order.estimatedDeliveryDate);
        return deliveryDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch (error) {
        console.error('Error parsing estimated delivery date:', error);
      }
    }

    // If we have a delivery date, show that
    if (order.deliveryDate) {
      try {
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
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
          month: '2-digit',
          year: 'numeric'
        });
      } catch (error) {
        console.error('Error calculating delivery date:', error);
        return 'TBD';
      }
    }

    return 'TBD';
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading orders...</h3>
                  <p className="text-gray-600">Please wait while we fetch your orders</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6 mb-6">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error loading orders</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => fetchOrders(20)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && userOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">No orders yet</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Your order history will appear here</p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 sm:py-2 px-4 sm:px-6 rounded-md transition-colors min-h-[44px] sm:min-h-0 text-sm sm:text-base"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            ) : !loading && !error && (
              <div className="space-y-6">
                {userOrders.map((order) => (
                  <div key={order.orderNumber || order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber || order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.orderPlacedAt || order.orderDate ? (
                            `Placed on ${new Date(order.orderPlacedAt || order.orderDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}`
                          ) : (
                            'Order date not available'
                          )}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus || order.status || 'Pending')}`}>
                          {order.orderStatus || order.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-3 sm:mb-4">
                        {/* Delivery Information */}
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2 flex items-center">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">Delivery Method</span>
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                              {getDeliveryMethodDisplay(order.checkoutData)}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2 flex items-center">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{getDeliveryAddressDisplay(order).type}</span>
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                              {getDeliveryAddressDisplay(order).name}<br />
                              {getDeliveryAddressDisplay(order).address}
                            </p>
                          </div>

                        </div>

                        {/* Payment & Shipping Information */}
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2 flex items-center">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              <span className="truncate">Payment Method</span>
                            </h4>
                            <p className="text-sm text-gray-600">
                              {getPaymentMethodDisplay(order.paymentMode || order.paymentMethod || 'N/A')}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2 flex items-center">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">Shipping Address</span>
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                              {order.shippingInfo ? (
                                <>
                                  {order.shippingInfo.firstName || ''} {order.shippingInfo.lastName || ''}<br />
                                  {order.shippingInfo.address || 'Address not available'}<br />
                                  {order.shippingInfo.city || ''}, {order.shippingInfo.state || ''} {order.shippingInfo.zipCode || ''}
                                </>
                              ) : (
                                'Address not available'
                              )}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2 flex items-center">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">Delivery Date & Time</span>
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                              {getDeliveryDateDisplay(order)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {(() => {
                            // Get items from various possible sources
                            const items = order.order_items || order.orderItems || order.items || [];

                            if (!Array.isArray(items) || items.length === 0) {
                              return <p className="text-xs sm:text-sm text-gray-500 py-2">No items found</p>;
                            }

                            return items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-1.5 sm:py-2 gap-2 hover:bg-gray-50 px-2 rounded transition-colors">
                                <div className="flex items-center min-w-0 flex-1">
                                  <img
                                    src={item.product_image || item.image || '/images/logo.jpg'}
                                    alt={item.product_name || item.title || 'Product'}
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded mr-2 sm:mr-3 flex-shrink-0 border border-gray-200"
                                    onError={(e) => {
                                      e.target.src = '/images/logo.jpg';
                                    }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                      {item.product_name || item.title || 'Product'}
                                    </p>
                                    {item.product_brand && (
                                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                        {item.product_brand}
                                      </p>
                                    )}
                                    <p className="text-[10px] sm:text-xs text-gray-600">
                                      Qty: {item.quantity || 0} {item.uom ? `× ${item.uom}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                                    ₹{(item.total_price || (item.unit_price || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                  </p>
                                  {item.unit_price && (
                                    <p className="text-[10px] sm:text-xs text-gray-500">
                                      ₹{item.unit_price}/unit
                                    </p>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

                        <div className="border-t border-gray-200 mt-3 sm:mt-4 pt-3 sm:pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Total</span>
                            <span className="text-lg font-semibold text-gray-900">
                              ₹{(order.orderSummary?.totalAmount || order.totalAmount || 0).toFixed(2)}
                            </span>
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
