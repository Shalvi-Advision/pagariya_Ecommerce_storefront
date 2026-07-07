import { useState } from 'react';
import { loadRazorpayScript } from '../utils/loadRazorpay';
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/razorpayApi';
import { APP_CONSTANTS } from '../constants';

/**
 * Custom hook for Razorpay payment integration
 * @returns {Object} - Payment processing utilities
 */
const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Process payment with Razorpay
   * @param {Object} options - Payment options
   * @param {number} options.amount - Amount in INR (not paise)
   * @param {string} options.currency - Currency code (default: INR)
   * @param {Object} options.notes - Additional notes/metadata
   * @param {Object} options.prefill - User prefill data
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onFailure - Failure callback
   */
  const processPayment = async ({
    amount,
    currency = 'INR',
    notes = {},
    prefill = {},
    onSuccess,
    onFailure,
  }) => {
    let rzp = null;

    try {
      setLoading(true);
      setError(null);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection or disable Ad Blockers.');
      }

      // Create order on backend
      const orderResponse = await createRazorpayOrder({
        amount,
        currency,
        notes,
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      // Configure Razorpay checkout options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_live_Bjc4imRDnbecVa',
        amount: orderResponse.amount, // Amount in paise
        currency: orderResponse.currency,
        name: APP_CONSTANTS.APP_NAME,
        description: 'Order Payment',
        order_id: orderResponse.id,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || '',
        },
        theme: {
          color: '#098547',
        },
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          confirm_close: true,
          ondismiss: function () {
            setLoading(false);
            const dismissError = new Error('Payment cancelled by user');
            setError(dismissError.message);
            onFailure && onFailure(dismissError);
          },
          animation: true,
        },
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.success && verifyResponse.status === 'success') {
              setLoading(false);
              onSuccess && onSuccess(verifyResponse);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (verifyError) {
            setLoading(false);
            setError(verifyError.message);
            onFailure && onFailure(verifyError);
          }
        },
      };

      // Open Razorpay checkout
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please check your internet connection.');
      }

      try {
        rzp = new window.Razorpay(options);

        // Add event listener for payment failure if supported
        if (rzp.on) {
          rzp.on('payment.failed', function (response) {
            console.error('⚠️ Razorpay Payment Failed Event:', response.error);
            // We don't trigger onFailure here because the modal might still be open
            // or the user might retry. The 'handler' or 'modal.ondismiss' usually manages flow.
            // However, capturing it is good for debugging.
          });
        }

        // Open immediately to prevent popup blocking
        rzp.open();
      } catch (rzpError) {
        console.error('❌ Failed to open Razorpay:', rzpError);
        // Check if error suggests blocking
        const isLikelyBlocked = rzpError.message && (
          rzpError.message.toLowerCase().includes('blocked') ||
          rzpError.message.toLowerCase().includes('network')
        );

        throw new Error(
          isLikelyBlocked
            ? 'Payment gateway unavailable. Please disable AdBlocker or Privacy extensions and try again.'
            : 'Failed to initialize payment gateway.'
        );
      }

    } catch (err) {
      console.error('❌ useRazorpay processPayment error:', err);
      setLoading(false);
      setError(err.message);
      onFailure && onFailure(err);
    }
  };

  return {
    processPayment,
    loading,
    error,
  };
};

export default useRazorpay;
