import React, { useState, useEffect } from 'react';
import { AppTab, CartItem, FoodItem, Order } from './types';
import { FOOD_ITEMS } from './constants';
import HomeTab from './components/HomeTab';
import OrderTab from './components/OrderTab';
import TrackingTab from './components/TrackingTab';
import ProfileTab from './components/ProfileTab';
import AdminTab from './components/AdminTab';
import BottomNav from './components/BottomNav';
import LandingPage from './components/LandingPage';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showNotification, setShowNotification] = useState<{msg: string, type: 'info' | 'error' | 'success'} | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Filter items based on the search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cartTotalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (e) {
        console.error('Initial session fetch failed', e);
      } finally {
        setAuthLoading(false);
      }
    };
    
    initAuth();
    fetchMenuItems();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const menuSubscription = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchMenuItems)
      .subscribe();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      subscription.unsubscribe();
      menuSubscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('relation "products" does not exist')) {
          setDbError("Database table 'products' missing.");
        }
        throw error;
      }
      
      setDbError(null);
      if (data && data.length > 0) {
        setItems(data);
      } else {
        setItems(FOOD_ITEMS);
      }
    } catch (err) {
      console.warn('DB Fetch failed, using fallback items');
      if (items.length === 0) setItems(FOOD_ITEMS);
    } finally {
      setMenuLoading(false);
    }
  };
  
  const triggerNotification = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setShowNotification({ msg, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  const addToCart = (item: FoodItem) => {
    if (!item.inStock) {
      triggerNotification(`${item.name} is out of stock!`, 'error');
      return;
    }
    if (orderStatus === 'success') setOrderStatus('idle');
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    triggerNotification(`${item.name} added!`, 'success');
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const clearCart = () => setCart([]);

  const handlePlaceOrder = async (phone: string, location: string, paymentMethod: 'COD' | 'GPay') => {
    if (cart.length === 0 || !session?.user) return;
    setOrderStatus('processing');
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + 30;

    try {
      const { error } = await supabase.from('orders').insert([{
        user_id: session.user.id,
        user_email: session.user.email,
        phone, 
        location, 
        items: cart, 
        total_amount: total,
        status: 'Pending Acceptance', 
        payment_method: paymentMethod
      }]);
      
      if (error) throw error;
      
      setTimeout(() => { 
        setOrderStatus('success'); 
        setCart([]); 
      }, 1500);
    } catch (err: any) {
      console.error('Order placement error:', err);
      triggerNotification(`Order failed: ${err.message || 'Database error'}`, 'error');
      setOrderStatus('idle');
    }
  };

  const handleAddNewProduct = async (product: Omit<FoodItem, 'id'>) => {
    try {
      const { data, error } = await supabase.from('products').insert([{ ...product, inStock: true }]).select();
      if (error) throw error;
      if (data) {
        setItems(prev => [data[0], ...prev]);
        triggerNotification(`${product.name} saved!`, 'success');
      }
    } catch (err: any) {
      triggerNotification("Table missing - item saved locally", 'info');
      const tempItem = { ...product, id: Math.random().toString(36).substr(2, 9), inStock: true };
      setItems(prev => [tempItem, ...prev]);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<FoodItem>) => {
    try {
      const { error } = await supabase.from('products').update(updates).eq('id', id);
      if (error) throw error;
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      triggerNotification("Updated successfully", 'success');
    } catch (err) {
      triggerNotification("Update failed - local only", 'info');
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
      triggerNotification("Item removed", 'success');
    } catch (err) {
      triggerNotification("Delete failed - local only", 'info');
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleToggleStock = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.inStock;
    try {
      const { error } = await supabase.from('products').update({ inStock: newStatus }).eq('id', id);
      if (error) throw error;
      setItems(prev => prev.map(i => i.id === id ? { ...i, inStock: newStatus } : i));
      triggerNotification(`${item.name} is now ${newStatus ? 'In Stock' : 'Out of Stock'}`, 'info');
    } catch (err) {
      triggerNotification("Stock update failed - local only", 'info');
      setItems(prev => prev.map(i => i.id === id ? { ...i, inStock: newStatus } : i));
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const startListening = () => {
    if (isListening) return;

    // Support for standard API and WebKit prefix (iOS Safari)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    
    if (!SpeechRecognition) {
      triggerNotification("Voice search not supported on this browser", 'error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        // Optional: Auto-stop or just let it end naturally
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          triggerNotification("Mic access denied. Enable permissions in settings.", 'error');
        } else if (event.error === 'no-speech') {
          triggerNotification("No speech detected. Please try again.", 'info');
        } else {
          // Ignore minor errors or just log
          // triggerNotification("Voice search error", 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      triggerNotification("Failed to start microphone", 'error');
    }
  };

  if (authLoading || menuLoading) {
    return <div className="h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!session) return <LandingPage />;

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden relative font-sans">
      <header className="bg-orange-500 text-white shadow-md z-40 w-full shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center space-x-2 cursor-pointer shrink-0" onClick={() => setActiveTab('home')}>
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
               <i className="fas fa-utensils text-xs sm:text-base"></i>
             </div>
             <h1 className="text-lg sm:text-2xl font-black whitespace-nowrap tracking-tight">Hotel Anandam</h1>
          </div>
          <div className="flex-1 relative max-w-lg">
            <input 
              type="text" 
              placeholder="Find a dish..." 
              className="w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-2xl bg-orange-400/30 text-white placeholder-orange-100 border-none focus:bg-white focus:text-gray-800 text-sm transition-all outline-none" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-orange-100 pointer-events-none"></i>
            <button 
              onClick={startListening} 
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-300' 
                  : 'text-orange-100 hover:text-white active:scale-95'
              }`}
              title="Voice Search"
            >
              <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto bg-gray-50 pb-24">
        {activeTab === 'home' && <HomeTab items={filteredItems} onAdd={addToCart} onInstall={handleInstallClick} showInstallButton={!!installPrompt} />}
        {activeTab === 'order' && <OrderTab cartItems={cart} onAdd={addToCart} onRemove={removeFromCart} onClear={clearCart} orderStatus={orderStatus} onPlaceOrder={handlePlaceOrder} onTrackOrder={() => setActiveTab('tracking')} />}
        {activeTab === 'tracking' && session?.user && <TrackingTab user={session.user} />}
        {activeTab === 'profile' && session?.user && <ProfileTab user={session.user} onOpenAdmin={() => setActiveTab('admin')} menuItems={items} onUpdateItem={handleUpdateProduct} onDeleteItem={handleDeleteProduct} onToggleStock={handleToggleStock} onAddItem={handleAddNewProduct} dbError={dbError} />}
        {activeTab === 'admin' && <AdminTab onClose={() => setActiveTab('profile')} />}
      </main>
      {showNotification && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl z-50 flex items-center animate-in fade-in slide-in-from-bottom-4 ${showNotification.type === 'error' ? 'bg-red-600 text-white' : showNotification.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'}`}>
          <i className={`fas mr-2 ${showNotification.type === 'error' ? 'fa-circle-exclamation' : showNotification.type === 'success' ? 'fa-circle-check' : 'fa-info-circle text-orange-400'}`}></i>
          {showNotification.msg}
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-30">
        <BottomNav activeTab={activeTab === 'admin' ? 'profile' : activeTab} setActiveTab={setActiveTab} cartCount={cartTotalItems} />
      </div>
    </div>
  );
};

export default App;