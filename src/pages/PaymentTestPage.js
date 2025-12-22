import React, { useState } from 'react';
import PaymentButton from '../components/PaymentButton';
import { useAuth } from '../context/AuthContextOptimized';

/**
 * Payment Test Page
 * A simple page to test Razorpay integration
 */
const PaymentTestPage = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState(100);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const handlePaymentSuccess = (response) => {
    console.log('Payment successful:', response);
    setPaymentStatus('success');
    setPaymentDetails(response.paymentDetails);
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setPaymentStatus('failed');
    setPaymentDetails({ error: error.message });
  };

  const resetTest = () => {
    setPaymentStatus(null);
    setPaymentDetails(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Razorpay Payment Test
          </h1>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (in INR)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="1"
            />
          </div>

          {/* User Info Display */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                User Details (for prefill)
              </h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {user.name || 'Not set'}</p>
                <p><strong>Email:</strong> {user.email || 'Not set'}</p>
                <p><strong>Mobile:</strong> {user.mobile || 'Not set'}</p>
              </div>
            </div>
          )}

          {/* Payment Button */}
          {!paymentStatus && (
            <div className="mb-6">
              <PaymentButton
                amount={amount}
                orderData={{
                  orderId: `TEST_${Date.now()}`,
                  description: 'Test payment',
                  testMode: true,
                }}
                userDetails={user || {}}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentFailure={handlePaymentFailure}
                className="w-full"
              >
                Pay ₹{amount}
              </PaymentButton>
            </div>
          )}

          {/* Payment Status Display */}
          {paymentStatus && (
            <div className="mb-6">
              {paymentStatus === 'success' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Payment Successful!
                      </h3>
                      {paymentDetails && (
                        <div className="mt-2 text-sm text-green-700">
                          <p><strong>Payment ID:</strong> {paymentDetails.paymentId}</p>
                          <p><strong>Order ID:</strong> {paymentDetails.orderId}</p>
                          <p><strong>Amount:</strong> ₹{paymentDetails.amount / 100}</p>
                          <p><strong>Status:</strong> {paymentDetails.status}</p>
                          <p><strong>Method:</strong> {paymentDetails.method}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Payment Failed
                      </h3>
                      {paymentDetails && (
                        <p className="mt-2 text-sm text-red-700">
                          {paymentDetails.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={resetTest}
                className="mt-4 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Try Another Payment
              </button>
            </div>
          )}

          {/* Test Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Test Card Details
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Card Number:</strong> 4111 1111 1111 1111</p>
              <p><strong>CVV:</strong> Any 3 digits (e.g., 123)</p>
              <p><strong>Expiry:</strong> Any future date</p>
              <p><strong>Name:</strong> Any name</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTestPage;
