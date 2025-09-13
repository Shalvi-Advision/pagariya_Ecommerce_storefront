import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Import page components
import HomePage from './pages/HomePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAStatus from './components/PWAStatus';
import SuccessToast from './components/SuccessToast';
import DevTools from './components/DevTools';
import DebugInfo from './components/DebugInfo';

// Import PWA utilities
import pwaUtils from './utils/pwa';

function AppContent() {
  const { successMessage, clearSuccessMessage } = useAuth();

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
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <PWAInstallPrompt />
        <PWAStatus />
        <DevTools />
        <DebugInfo />

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
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
