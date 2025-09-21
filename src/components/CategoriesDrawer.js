import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CategoriesDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  const handleCategoryClick = (categoryName) => {
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/category/${categorySlug}`);
    onClose();
  };
  
  const categories = [
    {
      name: "GROCERY & STAPLES",
      icon: "🛒",
      subcategories: [
        "Dals & Pulses", "Rice & Rice Products", "Wheat & Other Grains",
        "Cooking Oil", "Ghee & Vanaspati", "Masala & Spices", "Salt & Sugar",
        "Jaggery & Sweeteners", "Flours & Atta", "Cereals & Muesli",
        "Dry Fruits & Nuts", "Seeds & Nuts", "Organic Staples"
      ]
    },
    {
      name: "FRUITS & VEGETABLES",
      icon: "🥕",
      subcategories: [
        "Fresh Fruits", "Fresh Vegetables", "Exotic Fruits", "Exotic Vegetables",
        "Leafy Vegetables", "Cut Fruits & Veggies", "Frozen Vegetables",
        "Frozen Fruits", "Seasonal Fruits", "Organic Fruits & Vegetables",
        "Hydroponic Vegetables", "Sprouts", "Herbs & Spices"
      ]
    },
    {
      name: "DAIRY & BEVERAGES",
      icon: "🥛",
      subcategories: [
        "Milk & Milk Products", "Cheese & Butter", "Yogurt & Curd",
        "Ice Cream & Frozen Desserts", "Soft Drinks", "Juices & Nectars",
        "Energy Drinks", "Tea & Coffee", "Health Drinks", "Water & Soda",
        "Sports Drinks", "Alcoholic Beverages"
      ]
    },
    {
      name: "PACKAGED FOOD",
      icon: "📦",
      subcategories: [
        "Biscuits & Cookies", "Snacks & Namkeen", "Breakfast Cereals",
        "Chocolates & Candies", "Ketchup & Sauces", "Jams & Spreads",
        "Pasta & Noodles", "Ready To Cook", "Gourmet Food", "Sweets & Mithai",
        "Pickles & Chutneys", "Health Food", "Mukhwas & Supari",
        "Bakery Products", "Canned Food", "Frozen Foods", "Instant Mixes"
      ]
    },
    {
      name: "PERSONAL CARE",
      icon: "💄",
      subcategories: [
        "Skin Care", "Hair Care", "Bath & Body", "Makeup & Cosmetics",
        "Personal Hygiene", "Oral Care", "Men's Grooming", "Fragrances",
        "Baby Care", "Feminine Care", "Health & Wellness", "Shaving & Grooming"
      ]
    },
    {
      name: "HOME & KITCHEN",
      icon: "🏠",
      subcategories: [
        "Cookware", "Serveware", "Cutlery", "Kitchen Tools", "Storage & Organizers",
        "Kitchen Appliances", "Bakeware", "Drinkware", "Tableware", "Jars & Containers",
        "Kitchen Accessories", "Dining & Serving", "Pooja Needs"
      ]
    },
    {
      name: "CLEANING SUPPLIES",
      icon: "🧽",
      subcategories: [
        "Detergent & Fabric Care", "Floor Cleaners", "Utensil Cleaners",
        "Bathroom Cleaners", "Glass Cleaners", "Disinfectants", "Fresheners",
        "Tissue Paper & Napkins", "Cleaning Tools", "Trash Bags", "Air Fresheners"
      ]
    },
    {
      name: "BABY CARE",
      icon: "👶",
      subcategories: [
        "Baby Food", "Baby Care", "Diapers & Wipes", "Baby Clothes",
        "Baby Toys", "Feeding Accessories", "Baby Health", "Nursing & Feeding"
      ]
    },
    {
      name: "PET CARE",
      icon: "🐕",
      subcategories: [
        "Pet Food", "Pet Care", "Pet Toys", "Pet Accessories", "Pet Health",
        "Pet Grooming", "Pet Litter", "Pet Treats"
      ]
    },
    {
      name: "HEALTH & WELLNESS",
      icon: "💊",
      subcategories: [
        "Vitamins & Supplements", "Health Monitors", "First Aid", "Medical Supplies",
        "Fitness & Sports", "Yoga & Meditation", "Health Drinks", "Protein Supplements"
      ]
    },
    {
      name: "STATIONERY & OFFICE",
      icon: "✏️",
      subcategories: [
        "Pens & Pencils", "Notebooks & Diaries", "Art & Craft", "Office Supplies",
        "Gift Bags & Boxes", "School Supplies", "Computer Accessories", "Filing & Storage"
      ]
    },
    {
      name: "AUTOMOTIVE",
      icon: "🚗",
      subcategories: [
        "Car Care", "Motor Oil", "Car Accessories", "Tire Care", "Car Cleaning",
        "Car Maintenance", "Car Electronics", "Car Safety"
      ]
    },
    {
      name: "ELECTRONICS",
      icon: "📱",
      subcategories: [
        "Mobile Accessories", "Computer Accessories", "Audio & Video", "Gaming",
        "Home Appliances", "Kitchen Appliances", "Personal Care Appliances",
        "Chargers & Cables", "Storage Devices"
      ]
    },
    {
      name: "FASHION & CLOTHING",
      icon: "👕",
      subcategories: [
        "Men's Clothing", "Women's Clothing", "Kids Clothing", "Footwear",
        "Accessories", "Jewelry", "Watches", "Bags & Luggage", "Underwear",
        "Sleepwear", "Activewear", "Traditional Wear"
      ]
    },
    {
      name: "HOME FURNISHING",
      icon: "🛏️",
      subcategories: [
        "Bedsheets & Bedding", "Bath Range", "Curtains & Blinds", "Home Decor",
        "Door Mats & Carpets", "Table Covers", "Home Furniture", "Lighting",
        "Wall Decor", "Garden & Outdoor", "Storage Solutions"
      ]
    },
    {
      name: "BOOKS & MEDIA",
      icon: "📚",
      subcategories: [
        "Fiction Books", "Non-Fiction Books", "Children's Books", "Educational Books",
        "Cookbooks", "Magazines", "Newspapers", "E-books", "Audiobooks",
        "Music & Movies", "Gaming", "Art & Photography"
      ]
    },
    {
      name: "SPORTS & FITNESS",
      icon: "⚽",
      subcategories: [
        "Outdoor Sports", "Indoor Sports", "Fitness Equipment", "Sports Clothing",
        "Sports Accessories", "Water Sports", "Winter Sports", "Adventure Sports",
        "Team Sports", "Individual Sports", "Fitness Supplements"
      ]
    },
    {
      name: "GARDEN & OUTDOOR",
      icon: "🌱",
      subcategories: [
        "Plants & Seeds", "Garden Tools", "Outdoor Furniture", "BBQ & Grilling",
        "Outdoor Lighting", "Pest Control", "Plant Care", "Garden Decor",
        "Outdoor Storage", "Landscaping", "Watering & Irrigation"
      ]
    },
    {
      name: "TOYS & GAMES",
      icon: "🎮",
      subcategories: [
        "Action Figures", "Board Games", "Puzzles", "Educational Toys",
        "Outdoor Toys", "Electronic Toys", "Arts & Crafts", "Building Sets",
        "Dolls & Accessories", "Sports Toys", "Baby Toys"
      ]
    },
    {
      name: "JEWELRY & WATCHES",
      icon: "💍",
      subcategories: [
        "Rings", "Necklaces", "Earrings", "Bracelets", "Watches",
        "Jewelry Boxes", "Jewelry Care", "Fashion Jewelry", "Precious Metals",
        "Gemstones", "Vintage Jewelry"
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer - positioned below the header bar */}
      <div className="fixed top-12 left-0 w-full bg-white z-50 shadow-lg border-t border-gray-200" style={{ height: 'calc(100vh - 3rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-8">
            <h2 className="text-lg font-semibold text-gray-800">All Categories</h2>
            <div className="flex gap-6 text-sm text-gray-600">
              <span className="hover:text-primary-600 cursor-pointer font-medium">Ready To Cook</span>
              <span className="hover:text-primary-600 cursor-pointer font-medium">Home Appliances</span>
              <span className="hover:text-primary-600 cursor-pointer font-medium">Cookware</span>
              <span className="hover:text-primary-600 cursor-pointer font-medium">Serveware</span>
              <span className="hover:text-primary-600 cursor-pointer font-medium">Cleaners</span>
              <span className="hover:text-primary-600 cursor-pointer font-medium">Detergent & Fabric Care</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="h-full overflow-y-auto bg-white" style={{ height: 'calc(100vh - 6rem)' }}>
          <div className="grid grid-cols-5 gap-0 p-6">
            {categories.map((category, index) => (
              <div key={index} className="border-r border-gray-100 last:border-r-0 pr-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                    {category.name}
                  </h3>
                </div>
                <ul className="space-y-1">
                  {category.subcategories.map((subcategory, subIndex) => (
                    <li key={subIndex}>
                      <button 
                        onClick={() => handleCategoryClick(subcategory)}
                        className="text-xs text-gray-600 hover:text-primary-600 hover:bg-gray-50 w-full text-left py-1 px-2 rounded transition-colors"
                      >
                        {subcategory}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoriesDrawer;
