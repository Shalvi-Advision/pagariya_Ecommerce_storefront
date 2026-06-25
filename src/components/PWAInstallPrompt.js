import React, { useState, useEffect } from 'react';
import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { APP_CONSTANTS } from '../constants';

const isIOSDevice = () => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isAndroidDevice = () => /Android/i.test(navigator.userAgent);

const isWindowsDevice = () => /Windows/i.test(navigator.userAgent);

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const ios = isIOSDevice();
    setIsIOS(ios);
    setIsDesktop(isWindowsDevice() || (!isAndroidDevice() && !ios && window.innerWidth >= 768));

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
    const installed = isStandalone || (ios && isInStandaloneMode);

    setIsInstalled(installed);
    if (installed) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!ios && !localStorage.getItem('pwa-install-dismissed')) {
        setShowInstallPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    let timer;
    if (ios && !localStorage.getItem('pwa-install-dismissed')) {
      timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleIOSInstall = () => {
    alert(`To install this app on your iOS device:
1. Tap the Share button in Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to confirm`);
  };

  const supportsNativeInstall = !isIOS && deferredPrompt;

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  if (!isIOS && !deferredPrompt) {
    return null;
  }

  const InstallIcon = isDesktop ? ComputerDesktopIcon : DevicePhoneMobileIcon;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <InstallIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                Install {APP_CONSTANTS.APP_NAME}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {supportsNativeInstall
                  ? 'Tap Install to add the app to your device for faster access and offline shopping.'
                  : 'Install our app for a better shopping experience with offline access.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss install prompt"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex space-x-3">
          {supportsNativeInstall ? (
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Install App
            </button>
          ) : (
            <button
              onClick={handleIOSInstall}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Install Instructions
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
