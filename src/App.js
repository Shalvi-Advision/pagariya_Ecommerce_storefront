import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApiErrorBoundary from './components/ApiErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContextOptimized';
import { CartProvider } from './context/CartContext';
import { CartDrawerProvider, useCartDrawer } from './context/CartDrawerContext';
import { OrderProvider } from './context/OrderContext';
import { PincodeProvider, usePincode } from './context/PincodeContext';
import { FavoriteProvider } from './context/FavoriteContext';
import { ProfileProvider } from './context/ProfileContext';
import { ToastProvider } from './context/ToastContext';

// Import page components
import HomePage from './pages/HomePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpInputPage from './pages/OtpInputPage';
import OtpVerifyPage from './pages/OtpVerifyPage';
import CheckoutPage from './pages/CheckoutPageNew';
import ProfilePage from './pages/ProfilePage';
import AddressPage from './pages/AddressPage';
import SavedCardsPage from './pages/SavedCardsPage';
import ReadyListPage from './pages/ReadyListPage';
import OrdersPage from './pages/OrdersPage';
import SavedListPage from './pages/SavedListPage';
import CategoryPage from './pages/CategoryPage';
import TestCategoryPage from './pages/TestCategoryPage';
import NotFoundPage from './pages/NotFoundPage';
import FavoritesPage from './pages/FavoritesPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import BestsellerProductsPage from './pages/BestsellerProductsPage';
import AdvertisementProductsPage from './pages/AdvertisementProductsPage';
import NotificationsPage from './pages/NotificationsPage';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import PersistentCartWidget from './components/PersistentCartWidget';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAStatus from './components/PWAStatus';
import SuccessToast from './components/SuccessToast';
import LoginSuccessModal from './components/LoginSuccessModal';
import DevTools from './components/DevTools';
//import DebugInfo from './components/';
import LocationGuard from './components/LocationGuard';
import ToastContainer from './components/Toast';
import { useToast } from './context/ToastContext';
import { useCartAuthSync } from './hooks/useCartAuthSync';

// Import pincode modals
import PincodeSelectionModal from './components/PincodeSelectionModal';
import StoreSelectionModal from './components/StoreSelectionModal';
import StoreDetailsModal from './components/StoreDetailsModal';

// Import PWA utilities
import pwaUtils from './utils/pwa';

// Toast Container Component
const ToastContainerWrapper = () => {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
};

function AppContent() {
  const { isAuthenticated, token: authToken } = useAuth();
  const { showInfo } = useToast();
  const fcmTokenRef = useRef(null);
  const fcmTokenSavedRef = useRef(false);
  const { successMessage, clearSuccessMessage, user } = useAuth();
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);

  // Initialize cart-auth sync
  useCartAuthSync();

  // Effect to detect successful login message and show the modal
  useEffect(() => {
    if (successMessage && (successMessage.includes('Login successful') || successMessage.includes('Logged in successfully'))) {
      setShowLoginSuccess(true);
      // Clear the success message to prevent both toast and modal
      clearSuccessMessage();
    }
  }, [successMessage, clearSuccessMessage]);

  // Function to close the login success modal
  const closeLoginSuccessModal = () => {
    setShowLoginSuccess(false);
  };
  const { isOpen: isCartDrawerOpen, closeDrawer } = useCartDrawer();
  const {
    isPincodeModalOpen,
    isStoreModalOpen,
    isStoreDetailsModalOpen,
    isLocationRequired,
    selectedPincode,
    selectedStore,
    handlePincodeSelect,
    handleStoreSelect,
    handleConfirmLocation,
    closePincodeModal,
    closeStoreModal,
    closeStoreDetailsModal
  } = usePincode();

  // Initialize FCM on app load and retry saving token after login
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        // Import and use optimized FCM initialization
        const {
          initializeFCM: optimizedInit,
          subscribeForegroundMessages,
        } = await import('./firebase-messaging-init');

        // Run optimized FCM initialization (memoized internally)
        const result = await optimizedInit();

        if (result.token) {
          fcmTokenRef.current = result.token;

          // Try to save token to backend (will fail if not authenticated)
          try {
            const { saveFcmToken } = await import('./api/fcmApi');
            await saveFcmToken(result.token, authToken);
            fcmTokenSavedRef.current = true;
          } catch (saveError) {
            fcmTokenSavedRef.current = false;
            // Token will be saved after login
          }
        }

        // Subscribe to foreground messages
        subscribeForegroundMessages((payload) => {
          if (payload.notification) {
            const { title, body } = payload.notification;
            showInfo(title ? `${title}: ${body}` : body || 'New notification');
          }
        });
      } catch (error) {
        // FCM is not critical for app functionality
      }
    };

    initializeFCM();
  }, []);

  // Watch for authentication changes and retry sending FCM token
  useEffect(() => {
    const saveFcmTokenOnLogin = async () => {
      // Only try if:
      // 1. User just logged in (isAuthenticated = true)
      // 2. We have a token (fcmTokenRef.current)
      // 3. Token hasn't been saved yet (fcmTokenSavedRef.current = false)
      if (isAuthenticated && fcmTokenRef.current && !fcmTokenSavedRef.current) {
        try {
          console.log('🔄 Retrying FCM token save after successful login...');
          const { saveFcmToken } = await import('./api/fcmApi');
          // Pass authToken explicitly to avoid race condition
          await saveFcmToken(fcmTokenRef.current, authToken);
          fcmTokenSavedRef.current = true;
          console.log('✅ FCM: Token saved to backend after login!');
        } catch (error) {
          console.error('❌ FCM: Failed to save token after login:', error);
        }
      }
    };

    saveFcmTokenOnLogin();
  }, [isAuthenticated, authToken]);

  // Reset FCM state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // Reset the saved flag so next user can save their token
      fcmTokenSavedRef.current = false;
      console.log('🔄 FCM: Reset token saved flag (user logged out)');
    }
  }, [isAuthenticated]);

  // Custom fallback UI for API errors
  const apiErrorFallback = (error, reset) => (
    <div className="p-6 bg-primary-50 border border-primary-100 rounded-lg shadow-sm max-w-2xl mx-auto my-8">
      <div className="flex items-center gap-3">
        <div className="text-primary-500 text-2xl">⚠️</div>
        <h2 className="text-lg font-bold text-primary-800">We're having trouble connecting to our servers</h2>
      </div>
      <p className="mt-2 text-primary-700">
        Don't worry! You can still browse products, but some features may be limited until the connection is restored.
      </p>
      <div className="mt-4 flex justify-end">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <ApiErrorBoundary fallback={apiErrorFallback}>
            <LocationGuard>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductDetailsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/otp-input" element={<OtpInputPage />} />
                <Route path="/otp-verify" element={<OtpVerifyPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/address" element={<AddressPage />} />
                <Route path="/saved-cards" element={<SavedCardsPage />} />
                <Route path="/ready-list" element={<ReadyListPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/saved-list" element={<SavedListPage />} />
                <Route path="/category/:categoryName" element={<CategoryPage />} />
                <Route path="/category" element={<CategoryPage />} />
                <Route path="/test-category" element={<TestCategoryPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/bestsellers/:sectionId" element={<BestsellerProductsPage />} />
                <Route path="/advertisement/:adId" element={<AdvertisementProductsPage />} />
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="/contact" element={<ContactUsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </LocationGuard>
          </ApiErrorBoundary>
        </main>
        <Footer />

        {/* Persistent Cart Widget - Mobile Only */}
        <PersistentCartWidget />

        {/* Cart Drawer - Global */}
        <CartDrawer
          isOpen={isCartDrawerOpen}
          onClose={closeDrawer}
        />

        <PWAInstallPrompt />
        <PWAStatus />
        <DevTools />
        {/* <DebugInfo /> */}

        {/* Success Toast - for non-login success messages */}
        <SuccessToast
          message={successMessage}
          isVisible={!!successMessage && !successMessage.includes('Login successful') && !successMessage.includes('Logged in successfully')}
          onClose={clearSuccessMessage}
        />

        {/* Login Success Modal */}
        <LoginSuccessModal
          isVisible={showLoginSuccess}
          onClose={closeLoginSuccessModal}
          userName={user?.name || ''}
        />

        {/* Pincode Selection Modals */}
        <PincodeSelectionModal
          isOpen={isPincodeModalOpen}
          onClose={closePincodeModal}
          onPincodeSelect={handlePincodeSelect}
          isRequired={isLocationRequired}
        />

        <StoreSelectionModal
          isOpen={isStoreModalOpen}
          onClose={closeStoreModal}
          onStoreSelect={handleStoreSelect}
          selectedPincode={selectedPincode}
          isRequired={isLocationRequired}
        />

        <StoreDetailsModal
          isOpen={isStoreDetailsModalOpen}
          onClose={closeStoreDetailsModal}
          onConfirm={handleConfirmLocation}
          selectedPincode={selectedPincode}
          selectedStore={selectedStore}
          isRequired={isLocationRequired}
        />

        {/* Toast Container - Global */}
        <ToastContainerWrapper />
      </div>
    </Router>
  );
}

function App() {
  useEffect(() => {
    // Register service worker when app loads
    const registerPWA = async () => {
      try {
        await pwaUtils.registerServiceWorker();
      } catch (error) {
        // Silently fail - PWA is not critical for functionality
      }
    };

    registerPWA();

    // Clean up any expired cache on app load
    const { clearExpiredCache } = require('./utils/apiOptimizer');
    clearExpiredCache();

    // Check for updates periodically (every 5 minutes instead of every minute)
    // and clean expired cache periodically (separate from update check)
    const updateInterval = setInterval(() => {
      pwaUtils.checkForUpdates();
    }, 5 * 60 * 1000); // Check every 5 minutes (reduced from 1 minute)

    // Note: Cache cleanup is handled by apiOptimizer's internal interval
    // No need to call it here - it's automatically cleaned up every 5 minutes

    return () => {
      clearInterval(updateInterval);
    };
  }, []);



  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <CartDrawerProvider>
            <OrderProvider>
              <PincodeProvider>
                <FavoriteProvider>
                  <ProfileProvider>
                    <AppContent />
                  </ProfileProvider>
                </FavoriteProvider>
              </PincodeProvider>
            </OrderProvider>
          </CartDrawerProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
