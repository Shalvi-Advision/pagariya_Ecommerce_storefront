import React, { useState } from 'react';
import pwaUtils from '../utils/pwa';

const DevTools = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await pwaUtils.clearAllCaches();
      alert('Cache cleared successfully!');
    } catch (error) {
      alert('Error clearing cache: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsLoading(true);
    try {
      await pwaUtils.forceUpdate();
    } catch (error) {
      alert('Error forcing update: ' + error.message);
      setIsLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    setIsLoading(true);
    try {
      await pwaUtils.checkForUpdates();
      alert('Update check completed!');
    } catch (error) {
      alert('Error checking updates: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg z-50 hover:bg-red-600 transition-colors"
        title="Development Tools"
      >
        🔧
      </button>

      {/* Dev Tools Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-64">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Dev Tools</h3>
          
          <div className="space-y-2">
            <button
              onClick={handleClearCache}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Clear Cache'}
            </button>
            
            <button
              onClick={handleCheckUpdates}
              disabled={isLoading}
              className="w-full bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Check Updates'}
            </button>
            
            <button
              onClick={handleForceUpdate}
              disabled={isLoading}
              className="w-full bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Force Update & Reload'}
            </button>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Use these tools to clear PWA cache and force updates during development.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default DevTools;
