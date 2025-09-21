import React from 'react';
import { useResponsive } from '../hooks/useResponsive';

const SavedCardIllustration = () => {
  const { isMobile, isTablet } = useResponsive();
  
  const circleSize = isMobile ? 'w-64 h-64' : isTablet ? 'w-72 h-72' : 'w-80 h-80';
  
  return (
    <div className="relative flex items-center justify-center" 
         role="img" 
         aria-label="Illustration showing two hands - one holding a smartphone and the other pointing to a green debit card">
      {/* Background circle with decorative elements */}
      <div className={`relative ${circleSize} bg-gray-100 rounded-full flex items-center justify-center`}>
        {/* Decorative elements around the circle */}
        <div className="absolute -top-2 -left-2 w-3 h-3 bg-pink-400 rounded-full"></div>
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full transform rotate-45"></div>
        <div className="absolute top-1/2 -right-4 w-3 h-3 bg-teal-400 rounded-full"></div>
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-green-400 rounded-full transform rotate-45"></div>
        
        {/* Main illustration content */}
        <div className="relative flex items-center justify-center">
          {/* Left hand holding phone */}
          <div className="relative z-10">
            {/* Hand */}
            <div className="w-16 h-20 bg-orange-200 rounded-full relative">
              {/* Fingers */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-orange-200 rounded-full"></div>
              <div className="absolute -top-1 left-1/4 w-2 h-3 bg-orange-200 rounded-full"></div>
              <div className="absolute -top-1 right-1/4 w-2 h-3 bg-orange-200 rounded-full"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-orange-200 rounded-full"></div>
              
              {/* Smartwatch */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black rounded-full">
                <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* Phone */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-20 bg-white border-2 border-gray-800 rounded-lg">
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-800 rounded-b-sm"></div>
              {/* Screen content */}
              <div className="absolute top-3 left-1 right-1 bottom-1 bg-gray-50 rounded"></div>
            </div>
          </div>
          
          {/* Debit card */}
          <div className="absolute top-4 left-20 w-16 h-10 bg-green-300 rounded-lg shadow-lg z-20">
            {/* Card text */}
            <div className="absolute top-1 left-1 text-xs font-bold text-white">DEBIT CARD</div>
            {/* Chip */}
            <div className="absolute top-3 left-1 w-2 h-1.5 bg-yellow-400 rounded-sm"></div>
            {/* Card number dashes */}
            <div className="absolute bottom-1 left-1 right-1 flex justify-between">
              <div className="w-1 h-0.5 bg-white rounded"></div>
              <div className="w-1 h-0.5 bg-white rounded"></div>
              <div className="w-1 h-0.5 bg-white rounded"></div>
            </div>
            {/* Circle on top right */}
            <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full"></div>
          </div>
          
          {/* Right hand pointing */}
          <div className="absolute top-6 right-8 z-10">
            <div className="w-12 h-16 bg-orange-200 rounded-full relative">
              {/* Pointing finger */}
              <div className="absolute -top-1 right-0 w-2 h-4 bg-orange-200 rounded-full transform rotate-12"></div>
              {/* Other fingers */}
              <div className="absolute -top-1 left-1/4 w-2 h-3 bg-orange-200 rounded-full"></div>
              <div className="absolute -top-1 right-1/4 w-2 h-3 bg-orange-200 rounded-full"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-orange-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedCardIllustration;
