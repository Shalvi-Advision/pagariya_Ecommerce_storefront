import React, { useState, useEffect } from 'react';
import groceryApiService from '../services/groceryApi';

const CategoryBanner = () => {
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

      console.log('🔄 Fetching categories from API using groceryApiService for CategoryBanner');

      // Use the existing groceryApiService to get categories
      const response = await groceryApiService.getActiveCategories("2"); // Department ID 2

      console.log('📊 API Response for CategoryBanner:', response);
      
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Get 3 random categories
        const shuffled = [...response.data].sort(() => 0.5 - Math.random());
        const selectedCategories = shuffled.slice(0, 3).map((category, index) => {
          // Debug log the raw category data
          console.log('🔍 Raw category data for CategoryBanner:', category);
          
          // Use image_link from API as the primary source
          let imageUrl = category.image_link || category.image || category.category_image || category.image_url || category.category_img;
          
          // If the image URL is relative, make it absolute
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `/${imageUrl}`;
          }
          
          const mappedCategory = {
            id: category.id || category._id || `cat_${index + 1}`,
            name: category.name || category.category_name || category.title || `Category ${index + 1}`,
            image: imageUrl,
            color: 'bg-green-100'
          };
          
          console.log('🔍 Mapped category for CategoryBanner:', mappedCategory);
          return mappedCategory;
        });
        
        setCategories(selectedCategories);
        console.log('✅ Categories loaded successfully for CategoryBanner:', selectedCategories);
      } else {
        throw new Error('No categories found in API response');
      }
    } catch (err) {
      console.error('❌ Error loading categories for CategoryBanner:', err);
      setError(err.message);
      
      // Fallback to default categories
      const fallbackCategories = [
        {
          id: 1,
          name: 'STORAGE & ORGANISERS',
          image: null,
          color: 'bg-green-300'
        },
        {
          id: 2,
          name: 'COOKWARE',
          image: null,
          color: 'bg-green-300'
        },
        {
          id: 3,
          name: 'SERVEWARE',
          image: null,
          color: 'bg-green-300'
        }
      ];
      setCategories(fallbackCategories);
      console.log('🔄 Using fallback categories for CategoryBanner due to error');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    console.log('Category clicked:', category);
  };

  return (
    <div className="relative w-full h-[180px] sm:h-[220px] lg:h-[260px] xl:h-[300px] overflow-hidden rounded-lg">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/3Category-Banners.jpg)`,
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-10" />
      
      {/* Category Cards Overlay - Positioned on Right Side */}
      <div className="relative h-full flex items-center justify-end px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex gap-4 sm:gap-5 lg:gap-6 xl:gap-8 mr-2 sm:mr-4 lg:mr-6">
          {loading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="w-24 sm:w-28 lg:w-32 xl:w-36 bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="h-20 sm:h-24 lg:h-28 xl:h-32 bg-gray-200"></div>
                <div className="bg-gray-300 px-2 py-2 sm:py-3">
                  <div className="h-4 bg-gray-400 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            categories.map((category, index) => (
              <div
                key={category.id}
                className="w-24 sm:w-28 lg:w-32 xl:w-36 bg-white rounded-lg shadow-xl overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300"
                onClick={() => handleCategoryClick(category)}
              >
                {/* Product Image Area */}
                <div className="h-20 sm:h-24 lg:h-28 xl:h-32 bg-gray-100 flex items-center justify-center relative">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onLoad={() => {
                        console.log('✅ CategoryBanner image loaded:', category.name, category.image);
                      }}
                      onError={(e) => {
                        console.log('❌ CategoryBanner image failed to load:', category.name, category.image);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-gray-300 rounded-full flex items-center justify-center ${category.image ? 'hidden' : 'flex'}`}
                  >
                    <span className="text-gray-600 text-sm sm:text-base font-bold">
                      {index + 1}
                    </span>
                  </div>
                </div>
                
                {/* Category Name */}
                <div className={`${category.color} px-2 py-2 sm:py-3`}>
                  <p className="text-gray-800 text-sm sm:text-base font-semibold text-center leading-tight">
                    {category.name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryBanner;
