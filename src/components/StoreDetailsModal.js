import React, { useState, useEffect } from 'react';
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircleIcon,
  SparklesIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { COLORS } from '../constants/theme';

const StoreDetailsModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPincode,
  selectedStore,
  isRequired
}) => {
  const [storeDetails, setStoreDetails] = useState(null);

  useEffect(() => {
    if (isOpen && selectedStore) {
      console.log('🏪 StoreDetailsModal received selectedStore:', selectedStore);
      setStoreDetails(selectedStore);
    }
  }, [isOpen, selectedStore]);

  const handleConfirm = () => {
    if (storeDetails) {
      onConfirm({
        pincode: selectedPincode,
        store: storeDetails
      });
    }
  };

  const handleClose = () => {
    if (!isRequired) {
      setStoreDetails(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRequired) {
          handleClose();
        }
      }}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
        style={{
          backgroundColor: COLORS.white,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Gradient Header */}
        <div
          className="px-6 py-6 flex-shrink-0 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[700]} 100%)`,
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
            style={{ backgroundColor: COLORS.white }}
          ></div>
          <div
            className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10"
            style={{ backgroundColor: COLORS.white }}
          ></div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircleSolid
                className="w-8 h-8 animate-bounce"
                style={{ color: COLORS.white }}
              />
              <h3
                className="text-2xl font-bold"
                style={{ color: COLORS.white }}
              >
                Perfect Match!
              </h3>
            </div>
            <p
              className="text-center text-sm"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              We deliver to your location
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Location Card */}
          <div className="px-6 py-4">
            <div
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: COLORS.primary[50],
                borderColor: COLORS.primary[200]
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: COLORS.primary[100] }}
                >
                  <MapPinIcon
                    className="w-5 h-5"
                    style={{ color: COLORS.primary[600] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm mb-1"
                    style={{ color: COLORS.gray[900] }}
                  >
                    {selectedPincode?.pincode} - {selectedPincode?.area}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: COLORS.gray[600] }}
                  >
                    {selectedPincode?.fullAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="px-6 py-2">
            <div
              className="rounded-xl p-6 text-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${COLORS.success[50]} 0%, ${COLORS.primary[50]} 100%)`,
              }}
            >
              {/* Animated sparkles */}
              <SparklesIcon
                className="w-16 h-16 mx-auto mb-3 animate-pulse"
                style={{ color: COLORS.primary[500] }}
              />
              <h4
                className="text-lg font-bold mb-2"
                style={{ color: COLORS.gray[900] }}
              >
                Great! We're Available Here
              </h4>
              <p
                className="text-sm"
                style={{ color: COLORS.gray[600] }}
              >
                Explore our wide range of products delivered straight to your doorstep!
              </p>
            </div>
          </div>

          {/* Store Details */}
          {storeDetails && (
            <div className="px-6 py-4">
              <h5
                className="font-bold text-sm mb-3 flex items-center gap-2"
                style={{ color: COLORS.gray[900] }}
              >
                <div
                  className="w-1 h-4 rounded-full"
                  style={{ backgroundColor: COLORS.primary[500] }}
                ></div>
                Your Selected Store
              </h5>

              <div className="space-y-3">
                {/* Store Name */}
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    backgroundColor: COLORS.white,
                    borderColor: COLORS.gray[200]
                  }}
                >
                  <p
                    className="text-xs mb-1"
                    style={{ color: COLORS.gray[500] }}
                  >
                    Store Name
                  </p>
                  <p
                    className="font-semibold"
                    style={{ color: COLORS.gray[900] }}
                  >
                    {storeDetails.storeName || storeDetails.store_name || 'N/A'}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Store Timings */}
                  {(storeDetails.storeOpenTime || storeDetails.store_open_time) && (
                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        backgroundColor: COLORS.white,
                        borderColor: COLORS.gray[200]
                      }}
                    >
                      <ClockIcon
                        className="w-4 h-4 mb-2"
                        style={{ color: COLORS.primary[500] }}
                      />
                      <p
                        className="text-xs mb-1"
                        style={{ color: COLORS.gray[500] }}
                      >
                        Store Hours
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={{ color: COLORS.gray[900] }}
                      >
                        {storeDetails.storeOpenTime || storeDetails.store_open_time}
                      </p>
                    </div>
                  )}

                  {/* Delivery Time */}
                  {(storeDetails.storeDeliveryTime || storeDetails.delivery_time) && (
                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        backgroundColor: COLORS.white,
                        borderColor: COLORS.gray[200]
                      }}
                    >
                      <TruckIcon
                        className="w-4 h-4 mb-2"
                        style={{ color: COLORS.primary[500] }}
                      />
                      <p
                        className="text-xs mb-1"
                        style={{ color: COLORS.gray[500] }}
                      >
                        Delivery
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={{ color: COLORS.gray[900] }}
                      >
                        {storeDetails.storeDeliveryTime || storeDetails.delivery_time}
                      </p>
                    </div>
                  )}

                  {/* Min Order */}
                  {(storeDetails.minOrderAmount || storeDetails.min_order_amount) && (
                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        backgroundColor: COLORS.white,
                        borderColor: COLORS.gray[200]
                      }}
                    >
                      <CurrencyRupeeIcon
                        className="w-4 h-4 mb-2"
                        style={{ color: COLORS.primary[500] }}
                      />
                      <p
                        className="text-xs mb-1"
                        style={{ color: COLORS.gray[500] }}
                      >
                        Min. Order
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={{ color: COLORS.gray[900] }}
                      >
                        ₹{storeDetails.minOrderAmount || storeDetails.min_order_amount}
                      </p>
                    </div>
                  )}

                  {/* Contact */}
                  {(storeDetails.contactNumber || storeDetails.contact?.phone) && (
                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        backgroundColor: COLORS.white,
                        borderColor: COLORS.gray[200]
                      }}
                    >
                      <PhoneIcon
                        className="w-4 h-4 mb-2"
                        style={{ color: COLORS.primary[500] }}
                      />
                      <p
                        className="text-xs mb-1"
                        style={{ color: COLORS.gray[500] }}
                      >
                        Contact
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={{ color: COLORS.gray[900] }}
                      >
                        {storeDetails.contactNumber || storeDetails.contact?.phone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Offers */}
                {(storeDetails.storeOfferName || storeDetails.offer) && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      backgroundColor: COLORS.warning[50],
                      borderColor: COLORS.warning[200]
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <TagIcon
                        className="w-4 h-4"
                        style={{ color: COLORS.warning[600] }}
                      />
                      <p
                        className="text-xs font-semibold"
                        style={{ color: COLORS.warning[800] }}
                      >
                        {storeDetails.storeOfferName || storeDetails.offer}
                      </p>
                    </div>
                  </div>
                )}

                {/* Address */}
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    backgroundColor: COLORS.gray[50],
                    borderColor: COLORS.gray[200]
                  }}
                >
                  <p
                    className="text-xs mb-1"
                    style={{ color: COLORS.gray[500] }}
                  >
                    Store Address
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: COLORS.gray[700] }}
                  >
                    {storeDetails.storeAddress || storeDetails.address || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button - Fixed at Bottom */}
        <div
          className="px-6 py-4 flex-shrink-0 border-t"
          style={{
            borderColor: COLORS.gray[100],
            backgroundColor: COLORS.gray[50]
          }}
        >
          <button
            onClick={handleConfirm}
            disabled={!storeDetails}
            className="w-full font-bold py-4 px-4 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            style={{
              backgroundColor: storeDetails ? COLORS.primary[600] : COLORS.gray[300],
              color: COLORS.white,
              cursor: storeDetails ? 'pointer' : 'not-allowed'
            }}
            onMouseEnter={(e) => {
              if (storeDetails) {
                e.currentTarget.style.backgroundColor = COLORS.primary[700];
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(38, 185, 133, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (storeDetails) {
                e.currentTarget.style.backgroundColor = COLORS.primary[600];
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <CheckCircleIcon className="w-6 h-6" />
            CONFIRM & START SHOPPING
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StoreDetailsModal;
