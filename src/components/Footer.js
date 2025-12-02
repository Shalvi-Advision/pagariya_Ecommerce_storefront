import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 lg:mb-4">Pagariya Mart</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              Your one-stop destination for quality products at great prices.
              Shop with confidence and enjoy fast, reliable delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 lg:mb-4">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors block py-0.5 sm:py-1">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors block py-0.5 sm:py-1">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 lg:mb-4">Customer Service</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors block py-0.5 sm:py-1">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors block py-0.5 sm:py-1">
                  Track Order
                </a>
              </li>
            </ul>
          </div>

          
        </div>

        <div className="border-t border-gray-800 mt-4 sm:mt-6 lg:mt-8 pt-4 sm:pt-6 lg:pt-8 text-center">
          <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm">
            © 2025 Shalvi Advison Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
