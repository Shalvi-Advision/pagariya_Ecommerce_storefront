import React from 'react';
import { Link } from 'react-router-dom';

const ContactUsPage = () => {
  // Contact information - Update these with actual company details
  const contactInfo = {
    address: "123 Main Street, City Name, State - 123456, India",
    email: "support@pagariyamart.com",
    phone: "+91 1234567890",
    whatsapp: "+91 1234567890"
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${contactInfo.email}`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${contactInfo.phone}`;
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello, I would like to get in touch with Pagariya Mart.");
    window.open(`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Get in <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            We're here to help! Reach out to us through any of the following channels and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Address Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-700/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Our Address</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    {contactInfo.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-700/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={handleEmailClick}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
                  <p className="text-blue-600 hover:text-blue-700 text-sm sm:text-base font-medium transition-colors break-all">
                    {contactInfo.email}
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">Click to send an email</p>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-700/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={handlePhoneClick}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
                  <p className="text-purple-600 hover:text-purple-700 text-sm sm:text-base font-medium transition-colors">
                    {contactInfo.phone}
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">Click to call</p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-700/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={handleWhatsAppClick}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">WhatsApp Us</h3>
                  <p className="text-green-600 hover:text-green-700 text-sm sm:text-base font-medium transition-colors">
                    {contactInfo.whatsapp}
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">Click to chat on WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-8 sm:mt-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;

