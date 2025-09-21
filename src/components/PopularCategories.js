import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const PopularCategories = () => {
  const categories = [
    {
      name: "Dals",
      icon: "🫘",
      color: "bg-orange-50",
      iconColor: "text-orange-600",
      link: "/category/dals"
    },
    {
      name: "Dairy",
      icon: "🥛",
      color: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      name: "Tea",
      icon: "🍵",
      color: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      name: "Soft Drinks",
      icon: "🥤",
      color: "bg-red-50",
      iconColor: "text-red-600"
    },
    {
      name: "Cleaners",
      icon: "🧽",
      color: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      name: "Bath Soaps",
      icon: "🧼",
      color: "bg-yellow-50",
      iconColor: "text-yellow-600"
    },
    {
      name: "Toothpaste",
      icon: "🦷",
      color: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      name: "Shampoos",
      icon: "🧴",
      color: "bg-pink-50",
      iconColor: "text-pink-600"
    },
    {
      name: "Pooja Needs",
      icon: "🕉️",
      color: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      name: "Towels",
      icon: "🛁",
      color: "bg-cyan-50",
      iconColor: "text-cyan-600"
    },
    {
      name: "Bath Utility",
      icon: "🪣",
      color: "bg-gray-50",
      iconColor: "text-gray-600"
    },
    {
      name: "Coffee",
      icon: "☕",
      color: "bg-amber-50",
      iconColor: "text-amber-600"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-4">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Popular Categories</h2>
              <p className="text-gray-600 text-sm">Shop from our most loved categories</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Fresh & Fast Delivery</span>
            </div>
          </div>
          
          <div className="relative">
            <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categories.map((category, index) => {
                const CategoryComponent = category.link ? Link : 'div';
                const categoryProps = category.link ? { to: category.link } : {};
                
                return (
                  <CategoryComponent
                    key={index}
                    {...categoryProps}
                    className="flex-shrink-0 w-32 h-32 bg-white rounded-2xl border-2 border-gray-100 shadow-md hover:shadow-xl hover:border-green-200 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        <span className={`text-5xl ${category.iconColor} w-full h-full flex items-center justify-center`}>
                          {category.icon}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 text-center leading-tight group-hover:text-green-600 transition-colors duration-200">
                        {category.name}
                      </span>
                    </div>
                  </CategoryComponent>
                );
              })}
            </div>
            
            {/* Enhanced Scroll Arrow */}
            <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border-2 border-gray-200 rounded-full p-3 shadow-lg hover:shadow-xl hover:border-green-300 transition-all duration-200 group">
              <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularCategories;
