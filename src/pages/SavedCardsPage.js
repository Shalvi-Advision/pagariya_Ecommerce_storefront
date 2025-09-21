import React from 'react';
import AccountSidebar from '../components/AccountSidebar';
import SavedCardIllustration from '../components/SavedCardIllustration';
import { useResponsive } from '../hooks/useResponsive';

const SavedCardsPage = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Future state: When saved cards exist, display them here
  // const [savedCards, setSavedCards] = useState([]);
  // const hasCards = savedCards && savedCards.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <AccountSidebar />

        {/* Main Content */}
        <div className="flex-1 relative">
          {/* Green vertical strip on the right */}
          <div className="absolute right-0 top-0 w-1 h-full bg-green-500"></div>
          
          {/* Centered content */}
          <main className={`flex flex-col items-center justify-center min-h-screen ${
            isMobile ? 'px-4 py-8' : isTablet ? 'px-6 py-10' : 'px-8 py-12'
          }`} role="main" aria-label="Saved Cards Page">
            <div className={`text-center ${isMobile ? 'max-w-sm' : isTablet ? 'max-w-lg' : 'max-w-2xl'}`}>
              {/* Heading - positioned at top left of content area */}
              <h1 className={`font-bold text-gray-900 mb-12 text-left ${
                isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl md:text-5xl'
              }`}>
                Card(s) saved with E-Shop
              </h1>
              
              {/* Illustration - centered below heading */}
              <div className={`flex justify-center ${isMobile ? 'mb-6' : 'mb-8'}`} 
                   role="img" 
                   aria-label="Illustration showing hands holding a phone and debit card">
                <SavedCardIllustration />
              </div>
              
              {/* Empty state subtitle - centered below illustration */}
              <p className={`text-gray-500 font-medium ${
                isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-lg md:text-xl'
              }`} 
                 role="status" 
                 aria-live="polite">
                You have no saved card(s)
              </p>
              
              {/* Future State: When cards exist, display them here */}
              {/* 
              {hasCards && (
                <div className="mt-12 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {savedCards.map((card, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{card.cardType}</h3>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                          <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">**** **** **** {card.lastFour}</p>
                      <p className="text-gray-500 text-xs mt-1">{card.expiryDate}</p>
                    </div>
                  ))}
                </div>
              )}
              */}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SavedCardsPage;
