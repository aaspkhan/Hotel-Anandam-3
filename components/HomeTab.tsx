
import React, { useState } from 'react';
import { FoodItem } from '../types';

interface HomeTabProps {
  items: FoodItem[];
  onAdd: (item: FoodItem) => void;
  onInstall?: () => void;
  showInstallButton?: boolean;
}

const HomeTab: React.FC<HomeTabProps> = ({ items, onAdd, onInstall, showInstallButton }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const categories = ['All', 'Rice', 'Noodles', 'Breads', 'Specials', 'Drinks'];

  const displayedItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* App Install Promotion */}
      {showInstallButton && (
        <div className="bg-orange-600 rounded-3xl p-5 sm:p-6 text-white flex items-center justify-between shadow-xl shadow-orange-100">
          <div className="flex-1">
            <h4 className="font-extrabold text-base sm:text-lg mb-1 text-white">Install Hotel Anandam</h4>
            <p className="text-orange-100 text-xs sm:text-sm">Get the best experience on your home screen!</p>
          </div>
          <button 
            onClick={onInstall}
            className="bg-white text-orange-600 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm active:scale-95 transition-all ml-4"
          >
            INSTALL
          </button>
        </div>
      )}

      {/* Quick Categories */}
      <div className="overflow-hidden">
        <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 px-1">Quick Categories</h3>
        <div className="flex space-x-3 sm:space-x-8 overflow-x-auto pb-4 px-1 custom-scrollbar">
          {categories.map(cat => (
            <div 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div className={`w-14 h-14 sm:w-20 sm:h-20 border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center mb-1 transition-all ${
                activeCategory === cat 
                  ? 'bg-orange-500 text-white shadow-orange-200' 
                  : 'bg-white text-orange-500 hover:bg-orange-50'
              }`}>
                <i className={`fas ${
                  cat === 'All' ? 'fa-utensils' :
                  cat === 'Rice' ? 'fa-bowl-rice' : 
                  cat === 'Noodles' ? 'fa-bowl-food' : 
                  cat === 'Breads' ? 'fa-pizza-slice' : 
                  cat === 'Specials' ? 'fa-fire' : 'fa-glass-water'
                } text-lg sm:text-2xl`}></i>
              </div>
              <span className={`text-[10px] sm:text-xs font-bold transition-colors ${
                activeCategory === cat ? 'text-orange-600' : 'text-gray-600 group-hover:text-orange-600'
              }`}>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Section */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
          <h3 className="text-base sm:text-xl font-bold text-gray-800">
            {activeCategory === 'All' ? 'Famous Items' : `${activeCategory} Menu`}
          </h3>
        </div>
        
        {displayedItems.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <i className="fas fa-utensils text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 font-medium">No items found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {displayedItems.map(item => (
              <div 
                key={item.id} 
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all duration-300 group overflow-hidden ${
                  !item.inStock ? 'opacity-70 grayscale' : ''
                }`}
              >
                <div className="aspect-[4/3] sm:aspect-square w-full overflow-hidden relative">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Stock Indicator */}
                  <div className={`absolute top-2 left-2 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-sm border ${
                    item.inStock ? 'bg-white/90 border-green-100' : 'bg-red-500/90 border-red-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      item.inStock ? 'bg-green-500' : 'bg-white'
                    }`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-tight ${
                      item.inStock ? 'text-green-700' : 'text-white'
                    }`}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  <div className="mb-1">
                    <span className="text-[8px] sm:text-[10px] text-orange-500 uppercase font-black tracking-widest block">{item.category}</span>
                    <h4 className="font-bold text-gray-800 text-xs sm:text-base leading-tight mt-0.5 truncate">{item.name}</h4>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                    <span className={`font-bold text-sm sm:text-lg ${!item.inStock ? 'text-gray-400' : 'text-gray-900'}`}>
                      ₹{item.price}
                    </span>
                    <button 
                      onClick={() => onAdd(item)}
                      disabled={!item.inStock}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
                        item.inStock 
                          ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-90' 
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <i className={`fas ${item.inStock ? 'fa-plus' : 'fa-times'} text-[10px] sm:text-xs`}></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeTab;
