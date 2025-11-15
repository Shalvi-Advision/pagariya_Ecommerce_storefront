import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getBanners } from '../api/bannerApi';
import Loading from './Loading';

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  
  // Touch handling refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);
  
  // Image loading state (simplified)
  const [imageErrors, setImageErrors] = useState(new Set());

  // Fetch banners on component mount - Use API with section_name "home_top"
  useEffect(() => {
    loadBanners();
  }, []);

  // Auto-advance slides every 4 seconds (increased for better UX)
  useEffect(() => {
    if (banners.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % banners.length);
      }, 4000);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [banners.length]);

  // Load local HeroCarouselBanners.jpg image
  const loadLocalBanners = useCallback(() => {
    console.log('🔄 Loading HeroCarouselBanners.jpg');
    setLoading(true);
    // Local banner images that are bundled with the app
    const localBanners = [
      {
        _id: 'local_1',
        redirect_link: '#',
        banner_img: process.env.PUBLIC_URL + '/images/HeroCarouselBanners.jpg',
        is_active: true,
        
      },
      {
        _id: 'local_2',
        redirect_link: '#',
        banner_img: process.env.PUBLIC_URL + '/images/2_HeroCarouselBanners-copy.jpg',
        is_active: true,
        
      }
    ];
    
    setBanners(localBanners);
    setIsOffline(false);
    setIsFallback(false);
    setLoading(false);
  }, []);

  // Load banners from API with section_name "home_top"
  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        // Fetch banners with section_name "home_top"
        const response = await getBanners({ section_name: 'home_top' });
        
        console.log('📊 Banner API Response:', response);
        
        if (response.banners) {
          if (response.banners.length > 0) {
            setBanners(response.banners);
            setIsOffline(response.isOffline || false);
            setIsFallback(response.isFallback || false);
            console.log('✅ Banners loaded successfully:', response.banners.length, 'banners');
          } else {
            console.warn('⚠️ No banners in response, using fallback data');
            loadLocalBanners();
          }
        } else {
          console.warn('⚠️ No banners property in response, using fallback data');
          loadLocalBanners();
        }
      } catch (apiError) {
        console.error('Error loading banners from API:', apiError);
        loadLocalBanners();
      }
    } catch (err) {
      console.error('Unhandled banner loading error:', err);
      loadLocalBanners();
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const goToSlide = useCallback((slideIndex) => {
    if (slideIndex >= 0 && slideIndex < banners.length) {
      setCurrentSlide(slideIndex);
    }
  }, [banners.length]);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % banners.length);
  }, [banners.length]);

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    // Pause auto-play during touch
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    // Reset touch values
    touchStartX.current = 0;
    touchEndX.current = 0;

    // Resume auto-play
    if (banners.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % banners.length);
      }, 4000);
    }
  }, [goToNext, goToPrevious, banners.length]);

  // Image error handler with CORS fallback
  const handleImageError = useCallback((imageId) => {
    console.warn(`Image loading error for banner ${imageId}`);
    setImageErrors(prev => new Set([...prev, imageId]));
    
    // If this is the first image error and we have banners, check if we should reload all banners
    if (imageErrors.size === 0 && banners.length > 0) {
      // Find the banner with this ID
      const banner = banners.find(b => b._id === imageId);
      
      // If the image URL contains the API base URL, it might be a CORS issue
      if (banner?.banner_img?.includes('ecom-api-ozl0.onrender.com')) {
        console.warn('⚠️ Possible CORS issue with banner images. Using local fallback images instead.');
        // Load local banners with small delay to avoid immediate re-render conflicts
        setTimeout(loadLocalBanners, 100);
      }
    }
  }, [banners, imageErrors, loadLocalBanners]);

  // Pause auto-play on hover (desktop)
  const handleMouseEnter = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (banners.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % banners.length);
      }, 4000);
    }
  }, [banners.length]);

  // Handle banner click
  const handleBannerClick = useCallback((banner) => {
    if (banner.redirect_link && banner.redirect_link !== '#') {
      // For product details, navigate to product page
      if (banner.redirect_link.startsWith('product_details/')) {
        const productId = banner.redirect_link.split('/')[1];
        window.location.href = `/product/${productId}`;
      } else {
        // For other links, navigate directly
        window.location.href = banner.redirect_link;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full h-[200px] sm:h-[250px] lg:h-[300px] xl:h-[350px] overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
        <Loading size="large" text="Loading banners..." />
      </div>
    );
  }

  // Show error state only if we have no banners at all
  if (error && banners.length === 0) {
    return (
      <div className="relative w-full h-[200px] sm:h-[250px] lg:h-[300px] xl:h-[350px] overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 mb-2 font-medium">Unable to load banners</p>
          <p className="text-gray-500 text-sm mb-4 max-w-md">
            {error.includes('404') 
              ? 'Banner API endpoint not available. Using demo banners instead.'
              : 'There was an issue loading banners. Please try again.'
            }
          </p>
          <button 
            onClick={loadBanners}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Don't render if no banners
  if (banners.length === 0) {
    return null;
  }

  return (
    <div 
      ref={carouselRef}
      className="relative w-full h-[200px] sm:h-[250px] lg:h-[300px] xl:h-[350px] overflow-hidden rounded-3xl group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ 
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      {/* Modern Status Indicators */}
      {(isOffline || isFallback) && (
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {isOffline && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Offline</span>
            </div>
          )}
          {isFallback && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm" title="Using demo banners - API not available">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Demo</span>
            </div>
          )}
        </div>
      )}

      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full w-full"
        style={{ 
          transform: `translateX(-${currentSlide * 100}%)`,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner, index) => (
          <div
            key={banner._id}
            className="w-full h-full flex-shrink-0 relative cursor-pointer overflow-hidden"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              minWidth: 0,
              minHeight: 0
            }}
            onClick={() => handleBannerClick(banner)}
          >
            {/* Background Image Container */}
            <div
              className="w-full h-full relative overflow-hidden"
              style={{ 
                backgroundColor: banner.banner_bg_color || '#f3f4f6'
              }}
            >
              {/* Main Banner Image - Responsive */}
              {(banner.banner_img_desktop || banner.banner_img_mobile) ? (
                <picture>
                  {/* Desktop image */}
                  {banner.banner_img_desktop && (
                    <source
                      media="(min-width: 768px)"
                      srcSet={banner.banner_img_desktop}
                    />
                  )}
                  {/* Mobile image or fallback */}
                  <img
                    src={banner.banner_img_mobile || banner.banner_img_desktop || banner.banner_img}
                    alt={banner.alt_text || banner.title || `Banner ${index + 1}`}
                    className="w-full h-full object-cover object-center"
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
                      console.log('🖼️ Image loaded:', banner._id, banner.banner_img);
                    }}
                    onError={() => {
                      console.log('❌ Image failed to load:', banner._id, banner.banner_img);
                      handleImageError(banner._id);
                    }}
                  />
                </picture>
              ) : (
                <img
                  src={banner.banner_img}
                  alt={banner.alt_text || banner.title || `Banner ${index + 1}`}
                  className="w-full h-full object-cover object-center"
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
                    console.log('🖼️ Image loaded:', banner._id, banner.banner_img);
                  }}
                  onError={() => {
                    console.log('❌ Image failed to load:', banner._id, banner.banner_img);
                    handleImageError(banner._id);
                  }}
                />
              )}

              {/* Banner content overlay (optional) */}
              {(banner.title || banner.description) && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="text-center text-white p-4">
                    {banner.title && (
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">
                        {banner.title}
                      </h3>
                    )}
                    {banner.description && (
                      <p className="text-sm sm:text-base opacity-90">
                        {banner.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modern Navigation Arrows - Only show if more than 1 banner */}
      {banners.length > 1 && (
        <>
      <button
        onClick={goToPrevious}
            className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-md hover:bg-white text-gray-800 p-2.5 sm:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-xl touch-manipulation"
        aria-label="Previous slide"
      >
            <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <button
        onClick={goToNext}
            className="absolute right-3 sm:right-5 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-md hover:bg-white text-gray-800 p-2.5 sm:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-xl touch-manipulation"
        aria-label="Next slide"
      >
            <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
        </>
      )}

      {/* Modern Dots Indicator - Only show if more than 1 banner */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-2.5">
          {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
              className={`rounded-full transition-all duration-300 touch-manipulation ${
              index === currentSlide
                ? 'w-8 sm:w-10 h-2.5 sm:h-3 bg-white shadow-lg'
                : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      )}

      {/* Modern Progress Bar - Only show if more than 1 banner */}
      {banners.length > 1 && (
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-black/20 to-black/10">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-200 ease-linear shadow-lg"
          style={{ 
              width: `${((currentSlide + 1) / banners.length) * 100}%` 
          }}
        />
      </div>
      )}
    </div>
  );
};

export default Carousel;
