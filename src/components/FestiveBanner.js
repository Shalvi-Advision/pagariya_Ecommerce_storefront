import React from 'react';

const FestiveBanner = () => {
  const handleBannerClick = () => {
    // You can add click functionality here if needed
    console.log('Festive Banner clicked');
  };

  return (
    <div 
      className="relative w-full h-[120px] sm:h-[150px] lg:h-[180px] xl:h-[200px] overflow-hidden rounded-lg cursor-pointer group"
      onClick={handleBannerClick}
      style={{ 
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      {/* Festive Banner Image */}
      <div className="w-full h-full relative overflow-hidden">
        <img
          src="/images/festive banner.png"
          alt="Happy Dussehra - Great Discount on our Festive range"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onLoad={() => {
            console.log('🖼️ Festive Banner image loaded successfully');
          }}
          onError={() => {
            console.log('❌ Festive Banner image failed to load');
          }}
        />
        
        {/* Optional overlay for better text readability if needed */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300" />
      </div>
    </div>
  );
};

export default FestiveBanner;
