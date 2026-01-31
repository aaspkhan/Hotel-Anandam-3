
import React, { useState } from 'react';
import { FoodItem } from '../types';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface ProfileTabProps {
  user: User;
  onOpenAdmin?: () => void;
  menuItems: FoodItem[];
  onUpdateItem: (id: string, updates: Partial<FoodItem>) => void;
  onDeleteItem: (id: string) => void;
  onToggleStock: (id: string) => void;
  onAddItem: (product: Omit<FoodItem, 'id'>) => void;
  dbError?: string | null;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ 
  user, 
  onOpenAdmin, 
  menuItems, 
  onUpdateItem, 
  onDeleteItem, 
  onToggleStock,
  onAddItem,
  dbError
}) => {
  const [view, setView] = useState<'profile' | 'menu'>('profile');
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [deleteItem, setDeleteItem] = useState<FoodItem | null>(null);
  
  // Password/PIN Protection State
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<'menu' | 'admin' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    category: 'Rice',
    description: '',
    image: ''
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdateItem(editingItem.id, editingItem);
      setEditingItem(null);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price <= 0) return;
    onAddItem({
      ...newProduct,
      image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
    });
    setNewProduct({ name: '', price: 0, category: 'Rice', description: '', image: '' });
    setShowAddModal(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteItem) {
      onDeleteItem(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      if (showPasswordPrompt === 'menu') {
        setView('menu');
      } else if (showPasswordPrompt === 'admin' && onOpenAdmin) {
        onOpenAdmin();
      }
      setShowPasswordPrompt(null);
      setPasswordInput('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput('');
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  const filteredMenu = menuItems.filter(item => 
    item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  if (view === 'menu') {
    return (
      <div className="p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => setView('profile')} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-400 hover:text-orange-500 transition-all shadow-sm"><i className="fas fa-arrow-left"></i></button>
            <h3 className="text-2xl font-extrabold text-gray-800">Menu Management</h3>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-orange-600 active:scale-95 transition-all"><i className="fas fa-plus mr-2"></i>New Dish</button>
        </div>

        {dbError && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-4 text-amber-800">
            <i className="fas fa-database mt-1 text-lg"></i>
            <div>
              <p className="text-sm font-bold">Local Sync Only</p>
              <p className="text-xs mt-1">The 'products' table is missing. Your changes will not be saved permanently until the table is created.</p>
            </div>
          </div>
        )}

        <div className="relative mb-8 group">
          <input type="text" placeholder="Search menu..." className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all font-medium" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} />
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500"></i>
        </div>

        <div className="space-y-4">
          {filteredMenu.map(item => (
            <div key={item.id} className="bg-white rounded-[2rem] p-4 sm:p-6 border border-gray-50 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-md transition-shadow">
              <img src={item.image} className="w-24 h-24 rounded-2xl object-cover shadow-sm" alt="" />
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-black text-gray-900 text-lg">{item.name}</h4>
                <p className="text-orange-500 font-bold">₹{item.price}</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${item.inStock ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{item.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onToggleStock(item.id)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${item.inStock ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'bg-white border-gray-100 text-gray-400'}`}>{item.inStock ? 'In Stock' : 'Out of Stock'}</button>
                <button onClick={() => setEditingItem(item)} className="w-11 h-11 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all shadow-sm"><i className="fas fa-edit"></i></button>
                <button onClick={() => setDeleteItem(item)} className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"><i className="fas fa-trash-alt"></i></button>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Modals for Edit/Add */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Add Dish</h3>
                <button onClick={() => setShowAddModal(false)}><i className="fas fa-times text-xl text-gray-400 hover:text-red-500 transition-colors"></i></button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <input type="text" placeholder="Name" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Price" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})} required />
                  <select className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl font-bold" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                    <option>Rice</option><option>Noodles</option><option>Breads</option><option>Specials</option><option>Drinks</option>
                  </select>
                </div>
                <input type="url" placeholder="Image URL" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl font-bold" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-orange-600 transition-all active:scale-95">Add to Menu</button>
              </form>
            </div>
          </div>
        )}

        {editingItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Edit Dish</h3>
                <button onClick={() => setEditingItem(null)}><i className="fas fa-times text-xl text-gray-400 hover:text-red-500 transition-colors"></i></button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <input type="text" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl font-bold" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl font-bold" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: parseInt(e.target.value)})} />
                  <select className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl font-bold" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                    <option>Rice</option><option>Noodles</option><option>Breads</option><option>Specials</option><option>Drinks</option>
                  </select>
                </div>
                <input type="url" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl font-bold" value={editingItem.image} onChange={e => setEditingItem({...editingItem, image: e.target.value})} />
                <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-orange-600 transition-all active:scale-95">Update Dish</button>
              </form>
            </div>
          </div>
        )}

        {deleteItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-trash-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Delete Dish?</h3>
              <p className="text-gray-500 font-medium text-sm mb-8 px-2">
                Are you sure you want to remove <span className="text-gray-900 font-bold">{deleteItem.name}</span>? 
                <br/>This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteItem(null)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={handleDeleteConfirm} className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold shadow-xl shadow-red-200 hover:bg-red-600 transition-all">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-4xl mx-auto">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-orange-50 p-1 mb-6 shadow-lg"><img src={user.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} className="w-full h-full rounded-full object-cover" alt="" /></div>
        <h3 className="text-3xl font-black text-gray-800">{user.user_metadata?.full_name || user.email?.split('@')[0]}</h3>
        <p className="text-gray-500 text-sm font-medium">{user.email}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <button onClick={() => setShowPasswordPrompt('menu')} className="w-full py-5 bg-white border border-gray-100 rounded-[2rem] font-bold flex items-center px-6 space-x-4 shadow-sm group transition-all hover:bg-gray-50 active:scale-[0.98]">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"><i className="fas fa-list-check"></i></div>
            <div className="text-left"><span className="block font-black">Menu Management</span><span className="text-[10px] text-gray-400 uppercase tracking-widest">Stock & Edit</span></div>
          </button>
          
          <button onClick={() => setShowPasswordPrompt('admin')} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-bold flex items-center px-6 space-x-4 shadow-xl group transition-all active:scale-[0.98]">
            <div className="w-12 h-12 bg-gray-800 text-orange-400 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12"><i className="fas fa-utensils"></i></div>
            <div className="text-left"><span className="block font-black">Kitchen Login</span><span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Restaurant Management</span></div>
          </button>
        </div>
        <div className="space-y-6">
          <button onClick={() => supabase.auth.signOut()} className="w-full py-5 border-2 border-red-50 text-red-500 rounded-[2rem] font-bold flex items-center px-6 space-x-4 hover:bg-red-50 transition-all active:scale-[0.98]">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center"><i className="fas fa-power-off"></i></div>
            <span className="font-black">Logout</span>
          </button>
        </div>
      </div>

      {/* Stylized Password/PIN Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 transition-all ${passwordError ? 'translate-x-1 ring-2 ring-red-500' : ''}`}>
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${passwordError ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                <i className={`fas ${passwordError ? 'fa-lock-open' : 'fa-lock'} text-xl`}></i>
              </div>
              <h3 className="text-xl font-black text-gray-800">Security Verification</h3>
              <p className="text-gray-500 font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">Enter Management PIN</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                  className={`w-full text-center text-4xl tracking-[0.8em] px-6 py-5 bg-gray-50 border-2 rounded-2xl outline-none transition-all font-black placeholder-gray-200 ${passwordError ? 'border-red-500 text-red-500' : 'border-transparent focus:border-orange-500 text-gray-800'}`}
                  value={passwordInput}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPasswordInput(val);
                    if (val.length === 4 && val === '1234') {
                       // Auto-submit if correct for smoother UX
                       setTimeout(() => {
                        if (showPasswordPrompt === 'menu') setView('menu');
                        else if (showPasswordPrompt === 'admin' && onOpenAdmin) onOpenAdmin();
                        setShowPasswordPrompt(null);
                        setPasswordInput('');
                       }, 200);
                    }
                  }}
                />
              </div>
              
              {passwordError && (
                <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">
                  Access Denied. Incorrect PIN.
                </p>
              )}

              <div className="flex gap-4">
                <button type="button" onClick={() => { setShowPasswordPrompt(null); setPasswordInput(''); setPasswordError(false); }} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95">Verify</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
