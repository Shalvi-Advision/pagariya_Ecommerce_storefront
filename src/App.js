import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CartDrawerProvider, useCartDrawer } from './context/CartDrawerContext';
import { OrderProvider } from './context/OrderContext';

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

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAStatus from './components/PWAStatus';
import SuccessToast from './components/SuccessToast';
import DevTools from './components/DevTools';
//import DebugInfo from './components/';
import CartDebugTools from './components/CartDebugTools';

// Import PWA utilities
import pwaUtils from './utils/pwa';

function AppContent() {
  const { successMessage, clearSuccessMessage } = useAuth();
  const { isOpen: isCartDrawerOpen, closeDrawer } = useCartDrawer();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
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

        {/* Success Toast */}
        <SuccessToast
          message={successMessage}
          isVisible={!!successMessage}
          onClose={clearSuccessMessage}
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

    // Check for updates periodically
    const updateInterval = setInterval(() => {
      pwaUtils.checkForUpdates();
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
            <AppContent />
          </OrderProvider>
        </CartDrawerProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
