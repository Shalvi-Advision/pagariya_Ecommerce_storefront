import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { getActiveDepartments, getActiveCategories } from '../services/groceryApi';

const PopularCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Color and icon mappings for categories
  const colorMappings = [
    { color: "bg-orange-50", iconColor: "text-orange-600" },
    { color: "bg-blue-50", iconColor: "text-blue-600" },
    { color: "bg-green-50", iconColor: "text-green-600" },
    { color: "bg-red-50", iconColor: "text-red-600" },
    { color: "bg-purple-50", iconColor: "text-purple-600" },
    { color: "bg-yellow-50", iconColor: "text-yellow-600" },
    { color: "bg-pink-50", iconColor: "text-pink-600" },
    { color: "bg-cyan-50", iconColor: "text-cyan-600" },
    { color: "bg-amber-50", iconColor: "text-amber-600" },
    { color: "bg-emerald-50", iconColor: "text-emerald-600" },
    { color: "bg-indigo-50", iconColor: "text-indigo-600" },
    { color: "bg-gray-50", iconColor: "text-gray-600" }
  ];

  const iconMappings = {
    "GROCERY & STAPLES": "🛒",
    "FRUITS & VEGETABLES": "🥕",
    "DAIRY & BEVERAGES": "🥛",
    "PACKAGED FOOD": "📦",
    "PERSONAL CARE": "💄",
    "HOME & KITCHEN": "🏠",
    "CLEANING SUPPLIES": "🧽",
    "BABY CARE": "👶",
    "PET CARE": "🐾",
    "HEALTH & WELLNESS": "💊",
    "STATIONERY & OFFICE": "✏️",
    "AUTOMOTIVE": "🚗",
    "ELECTRONICS": "📱",
    "FASHION & CLOTHING": "👕",
    "HOME FURNISHING": "🛏️",
    "BOOKS & MEDIA": "📚",
    "SPORTS & FITNESS": "⚽",
    "GARDEN & OUTDOOR": "🌱",
    "TOYS & GAMES": "🎮",
    "JEWELRY & WATCHES": "💍",
    "DEFAULT": "📦"
  };


  // Default fallback image
  const getDefaultImage = () => '/images/logo.jpg';

  useEffect(() => {
    const fetchRandomCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get departments first
        const departmentsResponse = await getActiveDepartments();
        
        if (!departmentsResponse.success || !departmentsResponse.data || departmentsResponse.data.length === 0) {
          throw new Error('Failed to fetch departments');
        }
        
        // Randomly select departments to get categories from
        const shuffledDepartments = [...departmentsResponse.data].sort(() => 0.5 - Math.random());
        const selectedDepartments = shuffledDepartments.slice(0, 3); // Take 3 random departments
        
        let allCategories = [];
        
        // Fetch categories for each selected department
        for (const department of selectedDepartments) {
          const categoriesResponse = await getActiveCategories(department.department_id);
          
          if (categoriesResponse.success && categoriesResponse.data && categoriesResponse.data.length > 0) {
            allCategories = [...allCategories, ...categoriesResponse.data];
          }
        }
        
        // Shuffle all categories and take 8 random ones
        const shuffledCategories = [...allCategories].sort(() => 0.5 - Math.random());
        const randomCategories = shuffledCategories.slice(0, 8);
        
        // Format categories with UI properties
        const formattedCategories = randomCategories.map((category, index) => {
          const colorMapping = colorMappings[index % colorMappings.length];

          // Get department name for this category to determine icon
          const department = departmentsResponse.data.find(dept =>
            dept.department_id === (category.dept_id || category.department_id)
          );

          const departmentName = department ? department.department_name : 'DEFAULT';
          const icon = iconMappings[departmentName] || iconMappings['DEFAULT'];

          return {
            id: category.idcategory_master || category.category_id,
            name: category.category_name,
            icon: icon,
            image_link: category.image_link || null,
            color: colorMapping.color,
            iconColor: colorMapping.iconColor,
            link: `/category/${category.category_name.toLowerCase().replace(/\s+/g, '-')}`
          };
        });
        
        setCategories(formattedCategories);
      } catch (error) {
        console.error('Error fetching random categories:', error);
        setError(error.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRandomCategories();
  }, []);

  return (
    <div className="relative overflow-hidden py-4 sm:py-6 lg:py-8">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/50 to-indigo-50/50"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 lg:p-10 shadow-md border border-white/60 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
               
                
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Top Categories
                </span>
              </h2>
              <p className="text-gray-600 text-sm sm:text-base"></p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>Fresh & Fast Delivery</span>
            </div>
          </div>
          
          <div className="relative">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-transparent border-t-cyan-500 border-r-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-lg animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {categories.map((category, index) => {
                  const CategoryComponent = category.link ? Link : 'div';
                  const categoryProps = category.link ? { to: category.link } : {};
                  
                  return (
                    <CategoryComponent
                      key={category.id || index}
                      {...categoryProps}
                      className="flex-shrink-0 w-32 h-56 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100/50 shadow hover:shadow-md hover:border-cyan-300 hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden"
                    >
                      <div className="flex flex-col items-center h-full pt-4 pb-2">
                        <div className={`w-32 h-32 flex-shrink-0 ${category.color} flex items-center justify-center mb-3 transition-all duration-300 shadow-sm relative overflow-hidden rounded-xl`}>
                          {category.image_link ? (
                            <img 
                              src={category.image_link} 
                              alt={category.name}
                              className="w-full h-full object-cover drop-shadow group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const iconElement = e.target.parentElement.querySelector('.fallback-icon');
                                if (iconElement) iconElement.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`fallback-icon absolute inset-0 z-10 bg-gradient-to-br from-white to-gray-100 flex items-center justify-center transition-transform duration-300 rounded-xl ${category.image_link ? 'hidden' : 'flex'}`}
                          >
                            <span className={`text-5xl ${category.iconColor} w-full h-full flex items-center justify-center`}>
                              {category.icon}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-800 text-center leading-tight group-hover:text-cyan-600 transition-colors duration-200 px-2 line-clamp-2 flex items-center justify-center flex-1">
                          {category.name}
                        </span>
                      </div>
                    </CategoryComponent>
                  );
                })}
              </div>
            )}
            
            {/* Enhanced Scroll Arrow with Gradient */}
            <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full p-3 shadow hover:shadow-md hover:scale-105 transition-all duration-200 group">
              <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularCategories;