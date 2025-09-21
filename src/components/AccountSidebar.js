import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AccountSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/profile', label: 'My Profile' },
    { path: '/address', label: 'My Address' },
    { path: '/saved-cards', label: 'My Saved Cards' },
    { path: '/ready-list', label: 'Ready List' },
    { path: '/orders', label: 'My Orders' },
    { path: '/saved-list', label: 'My Saved List' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-700 mb-6">Account Details</h2>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AccountSidebar;
