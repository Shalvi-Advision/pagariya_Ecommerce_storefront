import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircleIcon, XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const OrderSuccessModal = ({ isVisible, onClose, orderNumber }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    } else if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isVisible]);
  
  const handleViewOrder = () => {
    onClose();
    navigate('/orders');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/');
  };
  
  // Debug: Log when modal should be visible
  useEffect(() => {
    if (isVisible) {
      console.log('OrderSuccessModal: isVisible is true, orderNumber:', orderNumber);
    }
  }, [isVisible, orderNumber]);
  
  if (!isVisible) {
    return null;
  }
  
  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
        padding: isMobile ? '16px' : '24px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
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
          maxWidth: isMobile ? '100%' : '450px',
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
          padding: isMobile ? '24px 16px' : '28px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
          position: 'relative'
        }}>
          <div style={{
            width: isMobile ? '64px' : '72px',
            height: isMobile ? '64px' : '72px',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <CheckCircleIcon style={{ 
              width: isMobile ? '36px' : '40px', 
              height: isMobile ? '36px' : '40px', 
              color: '#10b981' 
            }} />
          </div>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '12px' : '16px',
              right: isMobile ? '12px' : '16px',
              background: 'transparent',
              border: 'none',
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: isMobile ? '18px' : '20px',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f3f4f6';
              e.target.style.color = '#1f2937';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#6b7280';
            }}
          >
            <XMarkIcon style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: isMobile ? '24px 16px' : '32px 24px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: isMobile ? '20px' : '24px', 
            fontWeight: 800, 
            color: '#1f2937', 
            margin: `0 0 ${isMobile ? '12px' : '16px'} 0`,
            letterSpacing: '-0.02em'
          }}>
            Order Placed Successfully!
          </h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: isMobile ? '16px' : '20px'
          }}>
            <div style={{
              width: isMobile ? '80px' : '96px',
              height: isMobile ? '80px' : '96px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}>
              <ShoppingBagIcon style={{ 
                width: isMobile ? '40px' : '48px', 
                height: isMobile ? '40px' : '48px', 
                color: '#10b981' 
              }} />
            </div>
          </div>
          
          <p style={{ 
            fontSize: isMobile ? '15px' : '16px', 
            color: '#6b7280', 
            margin: `0 0 ${isMobile ? '12px' : '16px'} 0`,
            lineHeight: '1.5'
          }}>
            Thank you for your purchase!
          </p>
          
          {orderNumber && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: `${isMobile ? '8px' : '10px'} ${isMobile ? '16px' : '20px'}`,
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderRadius: '12px',
              marginBottom: isMobile ? '16px' : '20px',
              border: '1px solid #a7f3d0'
            }}>
              <span style={{
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 600,
                color: '#059669'
              }}>
                Order #{orderNumber}
              </span>
            </div>
          )}
          
          <p style={{ 
            fontSize: isMobile ? '13px' : '14px', 
            color: '#9ca3af', 
            margin: `0 0 ${isMobile ? '24px' : '28px'} 0`,
            lineHeight: '1.5'
          }}>
            You will receive an order confirmation email with details of your order.
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            width: '100%'
          }}>
            <button
              onClick={handleViewOrder}
              style={{
                flex: 1,
                padding: isMobile ? '12px' : '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              View Order
            </button>
            <button
              onClick={handleContinueShopping}
              style={{
                flex: 1,
                padding: isMobile ? '12px' : '14px',
                background: 'white',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Use portal to render directly to body, with fallback
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  
  // Fallback if portal is not available
  return modalContent;
};

export default OrderSuccessModal;
