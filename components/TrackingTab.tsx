
import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface TrackingTabProps {
  user: User;
}

const TrackingTab: React.FC<TrackingTabProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchOrderHistory();
      const subscription = supabase
        .channel('user-tracking-channel')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `user_email=eq.${user.email}` 
        }, fetchOrderHistory)
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchOrderHistory = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching tracking history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8 px-1">Track Orders</h3>

      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4 font-medium italic text-sm">Locating your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-box-open text-3xl opacity-20"></i>
          </div>
          <p className="font-bold text-lg text-gray-600">No active orders</p>
          <p className="text-sm mt-1">Order something famous to see it here!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2rem] p-6 border border-gray-50 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      order.status === 'Pending Acceptance' ? 'bg-amber-100 text-amber-600' :
                      order.status === 'Preparing' ? 'bg-blue-100 text-blue-600' :
                      order.status === 'Ready' ? 'bg-green-100 text-green-600' :
                      order.status === 'Delivered' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'
                    }`}>
                      {order.status}
                    </span>
                    {order.status !== 'Delivered' && (
                       <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-tighter">
                    ID: {order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-orange-600">₹{order.total_amount}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{order.payment_method}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 bg-white rounded-md flex items-center justify-center font-black text-orange-500 border border-gray-100">{item.quantity}</span>
                      <span className="text-gray-700 font-bold">{item.name}</span>
                    </div>
                    <span className="text-gray-400 font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-gray-200 mt-2 flex justify-between items-center">
                   <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <i className="fas fa-location-dot mr-1.5 text-orange-400"></i>
                     {order.location}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackingTab;
