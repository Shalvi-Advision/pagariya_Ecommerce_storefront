import React from 'react';

const Loading = ({ size = 'medium', text = 'Loading...' }) => {
  const sizes = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-14 h-14'
  };

  const borderSizes = {
    small: 'border-2',
    medium: 'border-3',
    large: 'border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative">
        {/* Gradient spinner */}
        <div className={`${sizes[size]} ${borderSizes[size]} border-transparent border-t-primary-500 border-r-primary-500 border-b-primary-400 rounded-full animate-spin`}></div>
        {/* Background glow */}
        <div className={`absolute inset-0 ${sizes[size]} bg-gradient-to-r from-primary-400/20 to-primary-300/20 rounded-full blur-lg animate-pulse`}></div>
      </div>
      {text && (
        <p className="mt-4 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default Loading;
