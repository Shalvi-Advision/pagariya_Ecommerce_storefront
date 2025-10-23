import React from 'react';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center z-40">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;