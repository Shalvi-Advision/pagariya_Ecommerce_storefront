import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountSidebar from '../components/AccountSidebar';
import { useCart } from '../context/CartContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import { useAuth } from '../context/AuthContextOptimized';
import { 
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon, 
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const ReadyListPage = () => {
  // Hooks
  const navigate = useNavigate();
  const { addItem: addToCart, openDrawer } = useCart();
  const { openDrawer: openCartDrawer } = useCartDrawer();
  const { user } = useAuth();
  
  // State management
  const [lists, setLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Mock data for most repurchased items (in production, fetch from order history API)
  const [suggestedItems] = useState([
    { 
      id: 'tea-001', 
      name: 'Tata Tea Gold', 
      category: 'Beverages', 
      price: 450, 
      image: '/images/tea.jpg', 
      purchaseCount: 12, 
      lastPurchased: '2 days ago',
      title: 'Tata Tea Gold'
    },
    { 
      id: 'butter-001', 
      name: 'Amul Butter', 
      category: 'Dairy', 
      price: 56, 
      image: '/images/butter.jpg', 
      purchaseCount: 10, 
      lastPurchased: '5 days ago',
      title: 'Amul Butter'
    },
    { 
      id: 'atta-001', 
      name: 'Aashirvaad Atta 10kg', 
      category: 'Staples', 
      price: 450, 
      image: '/images/atta.jpg', 
      purchaseCount: 8, 
      lastPurchased: '1 week ago',
      title: 'Aashirvaad Atta 10kg'
    },
    { 
      id: 'milk-001', 
      name: 'Amul Milk 1L', 
      category: 'Dairy', 
      price: 64, 
      image: '/images/milk.jpg', 
      purchaseCount: 15, 
      lastPurchased: '1 day ago',
      title: 'Amul Milk 1L'
    },
    { 
      id: 'bread-001', 
      name: 'Britannia Bread', 
      category: 'Bakery', 
      price: 35, 
      image: '/images/bread.jpg', 
      purchaseCount: 9, 
      lastPurchased: '3 days ago',
      title: 'Britannia Bread'
    },
    { 
      id: 'oil-001', 
      name: 'Fortune Oil 1L', 
      category: 'Oil & Ghee', 
      price: 180, 
      image: '/images/oil.jpg', 
      purchaseCount: 6, 
      lastPurchased: '10 days ago',
      title: 'Fortune Oil 1L'
    }
  ]);

  // Get storage key for current user
  const getStorageKey = () => {
    const userId = user?.id || user?.mobile_no || 'guest';
    return `pagariya_lists_${userId}`;
  };

  // Load lists from localStorage on mount
  useEffect(() => {
    const storageKey = getStorageKey();
    const savedLists = localStorage.getItem(storageKey);
    
    if (savedLists) {
      try {
        const parsedLists = JSON.parse(savedLists);
        setLists(parsedLists);
        if (parsedLists.length > 0) {
          setActiveList(parsedLists[0]);
        }
      } catch (error) {
        console.error('Error loading lists from localStorage:', error);
      }
    }
  }, [user]);

  // Save lists to localStorage whenever they change
  useEffect(() => {
    if (lists.length > 0) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(lists));
    }
  }, [lists, user]);

  // Handlers
  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList = {
        id: Date.now(),
        name: newListName,
        items: [],
        createdDate: new Date().toISOString().split('T')[0],
        totalItems: 0,
        completedItems: 0
      };
      setLists([...lists, newList]);
      setActiveList(newList);
      setNewListName('');
      setShowCreateModal(false);
    }
  };

  const handleDeleteList = (listId) => {
    const updatedLists = lists.filter(list => list.id !== listId);
    setLists(updatedLists);
    if (activeList?.id === listId) {
      setActiveList(updatedLists[0] || null);
    }
  };

  const handleAddItemToList = (item) => {
    if (activeList) {
      const newItem = {
        ...item,
        id: Date.now(),
        quantity: 1,
        checked: false
      };
      
      const updatedLists = lists.map(list => {
        if (list.id === activeList.id) {
          return {
            ...list,
            items: [...list.items, newItem],
            totalItems: list.items.length + 1
          };
        }
        return list;
      });
      
      setLists(updatedLists);
      setActiveList(updatedLists.find(l => l.id === activeList.id));
    }
  };

  const handleRemoveItem = (itemId) => {
    const updatedLists = lists.map(list => {
      if (list.id === activeList.id) {
        const updatedItems = list.items.filter(item => item.id !== itemId);
        return {
          ...list,
          items: updatedItems,
          totalItems: updatedItems.length,
          completedItems: updatedItems.filter(i => i.checked).length
        };
      }
      return list;
    });
    
    setLists(updatedLists);
    setActiveList(updatedLists.find(l => l.id === activeList.id));
  };

  const handleToggleItem = (itemId) => {
    const updatedLists = lists.map(list => {
      if (list.id === activeList.id) {
        const updatedItems = list.items.map(item => 
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        return {
          ...list,
          items: updatedItems,
          completedItems: updatedItems.filter(i => i.checked).length
        };
      }
      return list;
    });
    
    setLists(updatedLists);
    setActiveList(updatedLists.find(l => l.id === activeList.id));
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedLists = lists.map(list => {
      if (list.id === activeList.id) {
        const updatedItems = list.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        return { ...list, items: updatedItems };
      }
      return list;
    });
    
    setLists(updatedLists);
    setActiveList(updatedLists.find(l => l.id === activeList.id));
  };

  // Search for products
  const handleProductSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // In production, fetch from API
    // For now, filter from suggested items
    const results = suggestedItems.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setIsSearching(false);
  };

  // Add item from search
  const handleAddFromSearch = (product) => {
    if (activeList) {
      const newItem = {
        id: `${product.id}-${Date.now()}`, // Unique ID for list item
        productId: product.id,
        name: product.name,
        title: product.title || product.name,
        quantity: 1,
        price: product.price,
        category: product.category,
        image: product.image,
        checked: false
      };
      
      const updatedLists = lists.map(list => {
        if (list.id === activeList.id) {
          const updatedItems = [...list.items, newItem];
          return {
            ...list,
            items: updatedItems,
            totalItems: updatedItems.length,
            completedItems: updatedItems.filter(i => i.checked).length
          };
        }
        return list;
      });
      
      setLists(updatedLists);
      setActiveList(updatedLists.find(l => l.id === activeList.id));
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Buy all items - Add to cart
  const handleBuyAll = () => {
    if (!activeList || activeList.items.length === 0) {
      alert('No items in the list to buy!');
      return;
    }

    // Add all items to cart
    let addedCount = 0;
    activeList.items.forEach(item => {
      try {
        addToCart({
          id: item.productId || item.id,
          title: item.title || item.name,
          price: item.price,
          image: item.image || '',
          quantity: item.quantity
        });
        addedCount++;
      } catch (error) {
        console.error('Error adding item to cart:', error);
      }
    });

    if (addedCount > 0) {
      // Mark all items as checked
      const updatedLists = lists.map(list => {
        if (list.id === activeList.id) {
          const updatedItems = list.items.map(item => ({ ...item, checked: true }));
          return {
            ...list,
            items: updatedItems,
            completedItems: updatedItems.length
          };
        }
        return list;
      });
      
      setLists(updatedLists);
      setActiveList(updatedLists.find(l => l.id === activeList.id));

      // Show success and open cart
      alert(`Successfully added ${addedCount} items to cart!`);
      openCartDrawer();
    }
  };

  // Buy single item - Add to cart
  const handleBuyItem = (item) => {
    try {
      addToCart({
        id: item.productId || item.id,
        title: item.title || item.name,
        price: item.price,
        image: item.image || '',
        quantity: item.quantity
      });

      // Mark item as checked
      handleToggleItem(item.id);

      openCartDrawer();
    } catch (error) {
      console.error('Error adding item to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const getTotalPrice = () => {
    if (!activeList) return 0;
    return activeList.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getProgress = () => {
    if (!activeList || activeList.totalItems === 0) return 0;
    return Math.round((activeList.completedItems / activeList.totalItems) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-primary-50/30">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <AccountSidebar />

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <span className="text-4xl">📋</span>
                    Pagariya List
                  </h1>
                  <p className="text-gray-600">Manage your monthly grocery lists with smart suggestions</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create New List
                </button>
              </div>
            </div>

            {lists.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-5xl">📝</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Your First Pagariya List</h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    Start managing your monthly groceries efficiently. Add frequently purchased items and reorder with just one click!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lists Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CalendarIcon className="w-6 h-6 text-primary-600" />
                      My Lists
                    </h2>
                    <div className="space-y-3">
                      {lists.map(list => (
                        <div
                          key={list.id}
                          onClick={() => setActiveList(list)}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                            activeList?.id === list.id
                              ? 'bg-gradient-to-r from-primary-50 to-primary-50 border-2 border-primary-500 shadow-md'
                              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{list.name}</h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list.id);
                              }}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <ShoppingCartIcon className="w-4 h-4" />
                              {list.totalItems} items
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                              {list.completedItems}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${list.totalItems > 0 ? (list.completedItems / list.totalItems) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                  {activeList && (
                    <>
                      {/* Active List Header */}
                      <div className="bg-gradient-to-r from-primary-600 to-primary-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-bold mb-2">{activeList.name}</h2>
                            <p className="text-primary-100">
                              {activeList.completedItems} of {activeList.totalItems} items purchased
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-3xl font-bold">₹{getTotalPrice().toFixed(2)}</div>
                            <div className="flex items-center gap-2">
                              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                                {getProgress()}% Complete
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setShowAddItemModal(true)}
                          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-primary-500 transition-all duration-200"
                        >
                          <PlusIcon className="w-5 h-5" />
                          Add Item
                        </button>
                        <button
                          onClick={handleBuyAll}
                          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <ShoppingCartIcon className="w-5 h-5" />
                          Buy All Items
                        </button>
                        <button
                          onClick={() => setShowSuggestions(!showSuggestions)}
                          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-primary-500 transition-all duration-200"
                        >
                          <SparklesIcon className="w-5 h-5 text-yellow-500" />
                          {showSuggestions ? 'Hide' : 'Show'} Suggestions
                        </button>
                      </div>

                      {/* Items List */}
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Items in List</h3>
                          {activeList.items.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600">No items yet. Add some items to get started!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {activeList.items.map(item => (
                                <div
                                  key={item.id}
                                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                    item.checked
                                      ? 'bg-primary-50 border-primary-300'
                                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    {/* Checkbox */}
                                    <button
                                      onClick={() => handleToggleItem(item.id)}
                                      className="flex-shrink-0"
                                    >
                                      {item.checked ? (
                                        <CheckCircleSolid className="w-6 h-6 text-primary-600" />
                                      ) : (
                                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full hover:border-primary-500 transition-colors"></div>
                                      )}
                                    </button>

                                    {/* Item Details */}
                                    <div className="flex-1">
                                      <h4 className={`font-semibold ${item.checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                        {item.name}
                                      </h4>
                                      <p className="text-sm text-gray-500">{item.category}</p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2 py-1">
                                      <button
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                      >
                                        <MinusIcon className="w-4 h-4 text-gray-600" />
                                      </button>
                                      <span className="font-semibold text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                                      <button
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                      >
                                        <PlusIcon className="w-4 h-4 text-gray-600" />
                                      </button>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right min-w-[5rem]">
                                      <div className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</div>
                                      <div className="text-xs text-gray-500">₹{item.price}/unit</div>
                                    </div>

                                    {/* Buy Button */}
                                    {!item.checked && (
                                      <button
                                        onClick={() => handleBuyItem(item)}
                                        className="px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1"
                                      >
                                        <ShoppingCartIcon className="w-4 h-4" />
                                        Buy
                                      </button>
                                    )}

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <TrashIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Suggested Items */}
                      {showSuggestions && (
                        <div className="bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 rounded-2xl shadow-lg border border-primary-200 overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <SparklesIcon className="w-6 h-6 text-yellow-600" />
                              <h3 className="text-xl font-bold text-gray-900">Frequently Purchased Items</h3>
                            </div>
                            <p className="text-gray-600 mb-6">Based on your purchase history</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {suggestedItems.map(item => (
                                <div
                                  key={item.id}
                                  className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-2xl">🛒</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                                      <p className="text-sm text-gray-500">{item.category}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                          {item.purchaseCount}x bought
                                        </span>
                                        <span className="text-xs text-gray-500">{item.lastPurchased}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-4">
                                    <div className="font-bold text-gray-900">₹{item.price}</div>
                                    <button
                                      onClick={() => handleAddItemToList(item)}
                                      className="flex items-center gap-1 bg-gradient-to-r from-primary-500 to-primary-500 hover:from-primary-600 hover:to-primary-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
                                    >
                                      <PlusIcon className="w-4 h-4" />
                                      Add
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Create New List</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">Give your grocery list a name</p>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Monthly Essentials, Weekly Groceries"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors mb-6"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal - Product Search */}
      {showAddItemModal && activeList && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Add Items to {activeList.name}</h3>
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {searchQuery.length < 2 ? (
                <div className="text-center py-8">
                  <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Start typing to search for products...</p>
                </div>
              ) : isSearching ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No products found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-2xl">🛒</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <p className="text-lg font-bold text-primary-600 mt-1">₹{product.price}</p>
                      </div>
                      <button
                        onClick={() => {
                          handleAddFromSearch(product);
                          setShowAddItemModal(false);
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Suggested Items Quick Add */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">Or add from frequently purchased:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedItems.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleAddItemToList(item);
                      setShowAddItemModal(false);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-primary-50 border border-gray-200 hover:border-primary-500 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-700 transition-all duration-200"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadyListPage;
