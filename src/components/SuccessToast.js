import React, { useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const SuccessToast = ({ message, onClose, isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center">
          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
          <p className="text-green-800 text-sm font-medium">{message}</p>
          <button
            onClick={onClose}
            className="ml-3 text-green-400 hover:text-green-600 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessToast;
