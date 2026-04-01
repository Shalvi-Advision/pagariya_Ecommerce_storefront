import React from 'react';

const SeasonalCategories = () => {
  const categories = [
    {
      name: "Rain Essentials",
      icon: "☔",
      bgColor: "bg-orange-500",
      image: "🧥" // Raincoat representation
    },
    {
      name: "Home Cleaners", 
      icon: "🧽",
      bgColor: "bg-blue-500",
      image: "🧴" // Cleaning products
    },
    {
      name: "Kitchen Needs",
      icon: "🍳",
      bgColor: "bg-gray-800",
      image: "☕" // Kitchen appliances
    },
    {
      name: "Laundry Care",
      icon: "👕", 
      bgColor: "bg-orange-600",
      image: "📦" // Detergent box
    },
    {
      name: "Personal Care",
      icon: "🧴",
      bgColor: "bg-blue-600", 
      image: "🧴" // Personal care products
    },
    {
      name: "Warm Treats",
      icon: "🍜",
      bgColor: "bg-red-600",
      image: "🍜" // Food items
    },
    {
      name: "Health Care",
      icon: "💊",
      bgColor: "bg-primary-600",
      image: "🍯" // Health products
    },
    {
      name: "Indoor Activities",
      icon: "🎮", 
      bgColor: "bg-purple-600",
      image: "🎲" // Games and activities
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-4">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-8 shadow-lg border border-gray-100 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            {/* Lightning bolts */}
            <div className="absolute top-4 left-12 text-white text-3xl animate-pulse">⚡</div>
            <div className="absolute top-8 right-16 text-white text-2xl animate-pulse">⚡</div>
            <div className="absolute top-16 right-32 text-white text-3xl animate-pulse">⚡</div>
            
            {/* Rain drops */}
            <div className="absolute top-6 left-24 text-white text-xl animate-bounce">💧</div>
            <div className="absolute top-12 left-48 text-white text-lg animate-bounce delay-75">💧</div>
            <div className="absolute top-20 left-64 text-white text-xl animate-bounce delay-150">💧</div>
            <div className="absolute top-4 left-96 text-white text-lg animate-bounce delay-200">💧</div>
            <div className="absolute top-24 left-80 text-white text-xl animate-bounce">💧</div>
            <div className="absolute top-16 right-48 text-white text-lg animate-bounce delay-100">💧</div>
            <div className="absolute top-28 right-64 text-white text-xl animate-bounce delay-300">💧</div>
            <div className="absolute top-8 right-80 text-white text-lg animate-bounce delay-75">💧</div>
          </div>

          <div className="relative z-10">
            {/* Header and Categories in same row */}
            <div className="flex items-center gap-8">
              {/* Header */}
              <div className="flex-shrink-0">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-wide leading-tight">
                  MONSOON
                </h1>
                <h2 className="text-3xl md:text-4xl font-light text-white italic tracking-wider">
                  Collection
                </h2>
              </div>

              {/* Category Cards */}
              <div className="flex gap-3 overflow-x-auto flex-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                  >
                    {/* Card */}
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex items-center justify-center mb-3 border border-white">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-inner">
                        <span className="text-4xl md:text-5xl w-full h-full flex items-center justify-center">
                          {category.image}
                        </span>
                      </div>
                    </div>
                    
                    {/* Label */}
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm md:text-base leading-tight max-w-20 md:max-w-24">
                        {category.name.split(' ').map((word, wordIndex) => (
                          <span key={wordIndex} className="block">
                            {word}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-blue-900 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalCategories;