import React from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const Toast = ({ toast, onRemove }) => {
  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`relative w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 sm:max-w-sm ${getToastStyles()} animate-slide-in-right`}
    >
      {/* Progress Bar */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full">
          <div
            className={`h-full ${getProgressBarColor()} transition-all ease-linear animate-shrink`}
            style={{
              animationDuration: `${toast.duration}ms`
            }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getToastIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            {toast.title && (
              <p className="text-sm font-medium">
                {toast.title}
              </p>
            )}
            {toast.message && (
              <p className={`text-sm ${toast.title ? 'mt-1' : ''}`}>
                {toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => onRemove(toast.id)}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

// Snackbar Component - compact dark pill shown at the bottom of the screen
const Snackbar = ({ toast, onRemove }) => {
  const getSnackbarIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />;
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />;
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-xl pointer-events-auto max-w-[90vw] sm:max-w-md animate-slide-up">
      {getSnackbarIcon()}
      <span className="flex-1 truncate">{toast.message}</span>
      <button
        className="text-gray-400 hover:text-white focus:outline-none flex-shrink-0"
        onClick={() => onRemove(toast.id)}
      >
        <span className="sr-only">Close</span>
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  const cornerToasts = toasts.filter((toast) => toast.variant !== 'snackbar');
  const snackbars = toasts.filter((toast) => toast.variant === 'snackbar');

  return (
    <>
      {cornerToasts.length > 0 && (
        <div
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 space-y-2"
          aria-live="assertive"
          aria-atomic="true"
        >
          {cornerToasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
      {snackbars.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none"
          aria-live="polite"
          aria-atomic="true"
        >
          {snackbars.map((toast) => (
            <Snackbar
              key={toast.id}
              toast={toast}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default ToastContainer;
