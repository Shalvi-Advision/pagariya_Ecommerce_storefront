import React from 'react';
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const OfflinePage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <WifiIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600 mb-6">
            It looks like you're not connected to the internet. Some features may be limited, but you can still browse cached content.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            What you can do offline:
          </h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li>• Browse previously viewed products</li>
            <li>• View your cart (if previously loaded)</li>
            <li>• Access your account information</li>
            <li>• Read product descriptions</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            This app works offline thanks to Progressive Web App technology.
            Your data will sync when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
