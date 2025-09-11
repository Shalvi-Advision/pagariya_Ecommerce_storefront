import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  SignalSlashIcon, 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PWAStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if app is installed/standalone
    const checkInstallStatus = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
      
      setIsStandalone(standalone);
      setIsInstalled(standalone || (isIOS && isInStandaloneMode));
    };

    checkInstallStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isInstalled) {
    return null; // Don't show status if not installed
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            {isOnline ? (
              <WifiIcon className="h-5 w-5 text-green-500" />
            ) : (
              <SignalSlashIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-gray-500">
              {isStandalone ? 'App Mode' : 'Browser Mode'}
            </p>
          </div>
          <div className="flex-shrink-0">
            {isInstalled ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            )}
          </div>
        </div>
        
        {!isOnline && (
          <div className="mt-2 text-xs text-gray-600">
            <p>Limited functionality available offline</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAStatus;
