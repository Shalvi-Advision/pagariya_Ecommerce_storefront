import React, { useState, useEffect } from 'react';
import groceryApiService from '../services/groceryApi';

const SeasonalOfferBanner = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching categories from API using groceryApiService');

      // Use the existing groceryApiService to get categories
      const response = await groceryApiService.getActiveCategories("2"); // Department ID 2

      console.log('📊 API Response:', response);
      
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Get 4 random categories
        const shuffled = [...response.data].sort(() => 0.5 - Math.random());
        const selectedCategories = shuffled.slice(0, 4).map((category, index) => {
          // Debug log the raw category data
          console.log('🔍 Raw category data:', category);
          
          // Use image_link from API as the primary source
          let imageUrl = category.image_link || category.image || category.category_image || category.image_url || category.category_img;
          
          // If the image URL is relative, make it absolute
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `/${imageUrl}`;
          }
          
          const mappedCategory = {
            id: category.id || category._id || `cat_${index + 1}`,
            name: category.name || category.category_name || category.title || `Category ${index + 1}`,
            image: imageUrl
          };
          
          console.log('🔍 Mapped category:', mappedCategory);
          return mappedCategory;
        });
        
        setCategories(selectedCategories);
        console.log('✅ Categories loaded successfully for seasonal offer:', selectedCategories);
      } else {
        throw new Error('No categories found in API response');
      }
    } catch (err) {
      console.error('❌ Error loading categories:', err);
      setError(err.message);
      
      // Fallback to default categories (no images, will show numbered placeholders)
      const fallbackCategories = [
        {
          id: 1,
          name: 'Home Decor',
          image: null
        },
        {
          id: 2,
          name: 'Kitchen Tools',
          image: null
        },
        {
          id: 3,
          name: 'Cleaning Needs',
          image: null
        },
        {
          id: 4,
          name: 'Home Furnishing',
          image: null
        }
      ];
      setCategories(fallbackCategories);
      console.log('🔄 Using fallback categories for seasonal offer due to error');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    console.log('Category clicked:', category);
    // You can add navigation logic here
  };

  const handleSeasonalBannerClick = () => {
    console.log('Seasonal banner clicked');
  };

  return (
    <div className="relative w-full h-[240px] sm:h-[300px] lg:h-[360px] xl:h-[400px] overflow-hidden rounded-lg flex flex-col">
      {/* Top Section - 50% - Seasonal Banner */}
      <div 
        className="w-full h-1/2 relative overflow-hidden cursor-pointer group"
        onClick={handleSeasonalBannerClick}
      >
        <img
          src="/images/seasonal banner.png"
          alt="Seasonal Offer - Prepare for Diwali"
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
            console.log('🖼️ Seasonal banner image loaded successfully');
          }}
          onError={() => {
            console.log('❌ Seasonal banner image failed to load');
          }}
        />
      </div>

      {/* Bottom Section - 50% - Dark Red Background with Category Cards */}
      <div className="w-full h-1/2 relative overflow-hidden bg-red-800">
        {/* Dark red background with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-800 to-red-900 opacity-90" />
        
        {/* Category Cards Overlay */}
        <div className="relative h-full flex items-center justify-center p-2">
          <div className="flex gap-6 w-full h-full justify-center">
            {loading ? (
              // Loading state
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden animate-pulse relative">
                  <div className="w-full h-full bg-gray-200"></div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-300 p-2">
                    <div className="h-4 bg-gray-400 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              categories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 relative"
                  onClick={() => handleCategoryClick(category)}
                >
                  {/* Category Image - Full Card Background */}
                  <div className="w-full h-full relative">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onLoad={() => {
                        console.log('✅ Category image loaded:', category.name, category.image);
                      }}
                      onError={(e) => {
                        console.log('❌ Category image failed to load:', category.name, category.image);
                        // Show numbered placeholder when image fails
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    
                    {/* Fallback placeholder when image fails */}
                    <div 
                      className="w-full h-full bg-gray-200 flex items-center justify-center absolute hidden"
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-bold">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    
                    {/* Category Name Overlay at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-semibold text-center leading-tight">
                        {category.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalOfferBanner;
