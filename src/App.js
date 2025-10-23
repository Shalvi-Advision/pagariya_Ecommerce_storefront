import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApiErrorBoundary from './components/ApiErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CartDrawerProvider, useCartDrawer } from './context/CartDrawerContext';
import { OrderProvider } from './context/OrderContext';
import { PincodeProvider, usePincode } from './context/PincodeContext';
import { FavoriteProvider } from './context/FavoriteContext';
import { ProfileProvider } from './context/ProfileContext';

// Import page components
import HomePage from './pages/HomePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpInputPage from './pages/OtpInputPage';
import OtpVerifyPage from './pages/OtpVerifyPage';
import CheckoutPage from './pages/CheckoutPage';
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

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAStatus from './components/PWAStatus';
import SuccessToast from './components/SuccessToast';
import LoginSuccessModal from './components/LoginSuccessModal';
import DevTools from './components/DevTools';
//import DebugInfo from './components/';
import CartDebugTools from './components/CartDebugTools';
import LocationGuard from './components/LocationGuard';

// Import pincode modals
import PincodeSelectionModal from './components/PincodeSelectionModal';
import StoreSelectionModal from './components/StoreSelectionModal';
import StoreDetailsModal from './components/StoreDetailsModal';

// Import PWA utilities
import pwaUtils from './utils/pwa';

function AppContent() {
  const { successMessage, clearSuccessMessage, user } = useAuth();
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  
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

  // Custom fallback UI for API errors
  const apiErrorFallback = (error, reset) => (
    <div className="p-6 bg-orange-50 border border-orange-100 rounded-lg shadow-sm max-w-2xl mx-auto my-8">
      <div className="flex items-center gap-3">
        <div className="text-orange-500 text-2xl">⚠️</div>
        <h2 className="text-lg font-bold text-orange-800">We're having trouble connecting to our servers</h2>
      </div>
      <p className="mt-2 text-orange-700">
        Don't worry! You can still browse products, but some features may be limited until the connection is restored.
      </p>
      <div className="mt-4 flex justify-end">
        <button
          onClick={reset}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
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
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </LocationGuard>
          </ApiErrorBoundary>
        </main>
        <Footer />
        
        {/* Cart Drawer - Global */}
        <CartDrawer 
          isOpen={isCartDrawerOpen} 
          onClose={closeDrawer} 
        />
        
        <PWAInstallPrompt />
        <PWAStatus />
        <DevTools />
        {/* <DebugInfo /> */}
        <CartDebugTools />

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
        console.log('PWA: Service worker registered successfully');
      } catch (error) {
        console.error('PWA: Failed to register service worker', error);
      }
    };

    registerPWA();
    
    // Clean up any expired cache on app load
    const { clearExpiredCache } = require('./utils/apiOptimizer');
    clearExpiredCache();

    // Check for updates periodically
    const updateInterval = setInterval(() => {
      pwaUtils.checkForUpdates();
      
      // Also periodically clean expired cache
      clearExpiredCache();
    }, 60000); // Check every minute

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
