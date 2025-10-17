import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const LoginSuccessModal = ({ isVisible, onClose, userName }) => {
  const [animationClass, setAnimationClass] = useState('opacity-0 scale-95');
  
  useEffect(() => {
    let timer;
    
    if (isVisible) {
      // Trigger entrance animation
      setAnimationClass('opacity-100 scale-100');
      
      // Auto-close after 3 seconds
      timer = setTimeout(() => {
        // Start exit animation
        setAnimationClass('opacity-0 scale-95');
        
        // Actually close after animation completes
        setTimeout(() => {
          onClose();
        }, 500);
      }, 3000);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm transition-opacity">
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-500 ${animationClass}`}
      >
        {/* Success Header with Gradient Background */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-6 flex items-center justify-center relative">
          <div className="absolute -bottom-8 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <div className="bg-green-50 w-14 h-14 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
          </div>
          
          {/* Close Button */}
          <button 
            onClick={() => {
              setAnimationClass('opacity-0 scale-95');
              setTimeout(onClose, 500);
            }}
            className="absolute top-3 right-3 text-white hover:text-green-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 pt-12 pb-6 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Login Successful!
          </h3>
          
          <div className="flex items-center justify-center my-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-16 h-16 text-gray-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            Welcome back{userName ? `, ${userName}` : ''}! You've been successfully logged in.
          </p>
          
          <div className="mt-6">
            <button
              onClick={() => {
                setAnimationClass('opacity-0 scale-95');
                setTimeout(onClose, 500);
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Continue
            </button>
          </div>
        </div>
        
        {/* Progress Bar Animation */}
        <div className="relative h-1 bg-gray-200">
          <div className="absolute inset-0 bg-green-500 origin-left animate-shrink-linear" />
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessModal;
