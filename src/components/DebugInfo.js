//*import React from 'react';
import { APP_CONSTANTS } from '../constants';

const DebugInfo = () => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-xs z-50 max-w-xs">
      <div className="font-bold">Debug Info:</div>
      <div>API URL: {APP_CONSTANTS.API_BASE_URL}</div>
      <div>Env: {process.env.NODE_ENV}</div>
      <div>React App API: {process.env.REACT_APP_API_URL || 'Not set'}</div>
    </div>
  );
};

export default DebugInfo;

