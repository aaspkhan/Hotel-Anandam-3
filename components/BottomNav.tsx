
import React from 'react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  cartCount: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, cartCount }) => {
  const tabs: { id: AppTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'fa-home' },
    { id: 'order', label: 'Order', icon: 'fa-shopping-cart' },
    { id: 'tracking', label: 'Track', icon: 'fa-truck-fast' },
    { id: 'profile', label: 'Profile', icon: 'fa-user' }
  ];

  return (
    <nav className="px-4 sm:px-12 py-3 sm:py-5 flex justify-around items-center w-full">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center space-y-1.5 transition-all duration-300 relative px-3 py-2 rounded-2xl ${
            activeTab === tab.id 
              ? 'text-orange-500 bg-orange-50' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="relative">
            <i className={`fas ${tab.icon} text-xl sm:text-2xl`}></i>
            {tab.id === 'order' && cartCount > 0 && (
              <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] sm:text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <span className="absolute -top-1 w-1 h-1 bg-orange-500 rounded-full animate-pulse"></span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
