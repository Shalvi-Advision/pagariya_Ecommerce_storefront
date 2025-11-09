import React from 'react';

const GSTBanner = () => {
  const handleBannerClick = () => {
    // You can add click functionality here if needed
    console.log('GST Banner clicked');
  };

  return (
    <div 
      className="relative w-full h-[180px] sm:h-[220px] lg:h-[260px] xl:h-[300px] overflow-hidden rounded-lg cursor-pointer group"
      onClick={handleBannerClick}
      style={{ 
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      {/* GST Banner Image */}
      <div className="w-full h-full relative overflow-hidden">
        <img
          src={`${process.env.PUBLIC_URL}/images/seasonal_banner.jpg`}
          alt="Seasonal Banner"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block'
          }}
          onLoad={() => {
            console.log('🖼️ GST Banner image loaded successfully');
          }}
          onError={() => {
            console.log('❌ GST Banner image failed to load');
          }}
        />
        
        {/* Optional overlay for better text readability if needed */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300" />
      </div>
    </div>
  );
};

export default GSTBanner;
