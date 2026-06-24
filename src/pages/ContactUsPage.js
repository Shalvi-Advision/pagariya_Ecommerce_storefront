import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStoresByPincode } from '../services/api';
import { usePincode } from '../context/PincodeContext';
import Loading from '../components/Loading';
import { APP_CONSTANTS } from '../constants';

const ContactUsPage = () => {
  const { confirmedLocation } = usePincode();
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        setLoading(true);

        // Use confirmedLocation to get pincode and store code
        if (!confirmedLocation) {
          setError('Please select a location to view store information.');
          setLoading(false);
          return;
        }

        // Extract pincode string correctly - confirmedLocation.pincode is likely an object
        const pincodeObj = confirmedLocation.pincode;
        const pincode = typeof pincodeObj === 'object' ? pincodeObj.pincode : pincodeObj;

        // Extract store code
        const storeCode = confirmedLocation.store?.store_code || confirmedLocation.store?.storeCode;

        if (!pincode) {
          setError('Invalid location data. Please re-select your location.');
          setLoading(false);
          return;
        }

        const data = await getStoresByPincode(pincode, storeCode);

        if (data.success && data.data && data.data.length > 0) {
          // If we have a storeCode, try to find the matching store
          let matchedStore = data.data[0];

          if (storeCode) {
            const found = data.data.find(s => s.store_code === storeCode);
            if (found) matchedStore = found;
          }

          setStoreInfo(matchedStore);
        } else {
          setError('No store information found for this location.');
        }
      } catch (err) {
        console.error('Failed to fetch store info:', err);
        setError('Failed to load store information.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, [confirmedLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Store <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Information</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Details for your local store serving {storeInfo?.pincode}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-6">
                <h2 className="text-2xl font-bold text-white mb-1">{storeInfo.store_name}</h2>
                <div className="flex items-center text-primary-100 text-sm">
                  <span className="bg-primary-500/30 px-2 py-0.5 rounded mr-2 border border-primary-400/30">
                    {storeInfo.store_code}
                  </span>
                  <span>{storeInfo.is_enabled === 'Enabled' ? 'Currently Open' : 'Closed'}</span>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</h3>
                    <p className="text-gray-800 text-lg leading-relaxed">{storeInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Store Timings</h3>
                    <p className="text-gray-800 text-lg font-medium">{storeInfo.store_open_time}</p>
                    <p className="text-green-600 text-sm mt-1">{storeInfo.delivery_time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Offer</h3>
                    <p className="text-gray-800 text-lg font-bold">{storeInfo.offer}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center ga-2">
                Delivery Services
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${storeInfo.delivery_options?.home_delivery ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'} transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${storeInfo.delivery_options?.home_delivery ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold ${storeInfo.delivery_options?.home_delivery ? 'text-green-800' : 'text-gray-500'}`}>Home Delivery</p>
                      <p className="text-xs text-gray-500">{storeInfo.delivery_options?.home_delivery ? 'Available' : 'Not Available'}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${storeInfo.delivery_options?.self_pickup ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'} transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${storeInfo.delivery_options?.self_pickup ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold ${storeInfo.delivery_options?.self_pickup ? 'text-green-800' : 'text-gray-500'}`}>Self Pickup</p>
                      <p className="text-xs text-gray-500">{storeInfo.delivery_options?.self_pickup ? 'Available' : 'Not Available'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Minimum Order Amount</span>
                  <span className="font-bold text-gray-900">₹{storeInfo.min_order_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Contact Store</h3>

              <div className="space-y-4">
                {storeInfo.contact?.phone && (
                  <button
                    onClick={() => window.location.href = `tel:${storeInfo.contact.phone}`}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Call Store</p>
                        <p className="text-xs text-gray-500">{storeInfo.contact.phone}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {storeInfo.contact?.whatsapp && storeInfo.contact.whatsapp !== 'undefined' && (
                  <button
                    onClick={() => {
                      const message = encodeURIComponent(`Hello, I have a query regarding ${APP_CONSTANTS.APP_NAME}.`);
                      window.open(`https://wa.me/${storeInfo.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">WhatsApp</p>
                        <p className="text-xs text-gray-500">Chat with support</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {storeInfo.contact?.email && (
                  <button
                    onClick={() => window.location.href = `mailto:${storeInfo.contact.email}`}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Email Us</p>
                        <p className="text-xs text-gray-500">{storeInfo.contact.email}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link to="/" className="block p-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-primary-600 transition-colors font-medium">
                  🛍️ Start Shopping
                </Link>
                <Link to="/orders" className="block p-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-primary-600 transition-colors font-medium">
                  📦 Track My Order
                </Link>
                <Link to="/profile" className="block p-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-primary-600 transition-colors font-medium">
                  👤 My Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
