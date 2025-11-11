import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import AccountSidebar from '../components/AccountSidebar';

const OrdersPage = () => {
  const { user } = useAuth();
  const { orders, getOrdersByUser } = useOrders();
  const navigate = useNavigate();

  const userOrders = user ? getOrdersByUser(user.id ?? user.mobile_no) : orders;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodDisplay = (method) => {
    switch (method) {
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
    if (order.checkoutData?.deliveryMode === 'pickup' && order.checkoutData?.selectedPickupPoint) {
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
    // Debug: Log the order data to see what's available
    console.log('Order data for delivery date:', {
      checkoutData: order.checkoutData,
      deliveryDate: order.deliveryDate,
      orderDate: order.orderDate
    });
    
    // If we have a selected time slot and date, show that
    if (order.checkoutData?.selectedTimeSlot && order.checkoutData?.selectedDate) {
      return getTimeSlotDisplay(order.checkoutData);
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
    if (order.orderDate) {
      try {
        const orderDate = new Date(order.orderDate);
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
      <div className="flex">
        {/* Sidebar */}
        <AccountSidebar />

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

            {userOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">Your order history will appear here</p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {userOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.orderDate ? (
                            `Placed on ${new Date(order.orderDate).toLocaleDateString('en-IN', {
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status || 'Pending')}`}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                        {/* Delivery Information */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Delivery Method
                            </h4>
                            <p className="text-sm text-gray-600">
                              {getDeliveryMethodDisplay(order.checkoutData)}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {getDeliveryAddressDisplay(order).type}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {getDeliveryAddressDisplay(order).name}<br />
                              {getDeliveryAddressDisplay(order).address}
                            </p>
                          </div>

                        </div>

                        {/* Payment & Shipping Information */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Payment Method
                            </h4>
                            <p className="text-sm text-gray-600">
                              {getPaymentMethodDisplay(order.paymentMethod || 'N/A')}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Shipping Address
                            </h4>
                            <p className="text-sm text-gray-600">
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
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Delivery Date & Time
                            </h4>
                            <p className="text-sm text-gray-600">
                              {getDeliveryDateDisplay(order)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2">
                                <div className="flex items-center">
                                  <img
                                    src={item.image || '/images/logo.jpg'}
                                    alt={item.title || 'Product'}
                                    className="w-12 h-12 object-cover rounded mr-3"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{item.title || 'Product'}</p>
                                    <p className="text-xs text-gray-600">Quantity: {item.quantity || 0}</p>
                                  </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                  ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 py-2">No items found</p>
                          )}
                        </div>

                        <div className="border-t border-gray-200 mt-4 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Total</span>
                            <span className="text-lg font-semibold text-gray-900">
                              ₹{(order.totalAmount || 0).toFixed(2)}
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
