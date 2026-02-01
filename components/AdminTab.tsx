import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Order, OrderStatus } from '../types';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface AdminTabProps {
  onClose?: () => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio for new order notifications
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    fetchOrders();

    // 1. Real-time Subscription
    const channel = supabase
      .channel('kitchen-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Change received!', payload);
          fetchOrders();
          
          // Play sound only on new orders
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Kitchen Dashboard: Connected to real-time updates');
        }
      });

    // 2. Fallback Polling (Every 30 seconds)
    // Ensures data consistency even if the socket disconnects temporarily
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.warn("Audio play failed (user interaction might be needed first):", error);
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      // We don't strictly need to fetchOrders here because the subscription will catch the UPDATE event,
      // but calling it ensures instant UI feedback for the user who clicked.
      fetchOrders();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const getDailyToken = (order: Order) => {
    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
    const todayOrdersSorted = [...orders]
      .filter(o => o.created_at.startsWith(orderDate))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const tokenIdx = todayOrdersSorted.findIndex(o => o.id === order.id);
    return tokenIdx !== -1 ? tokenIdx + 1 : 'N/A';
  };

  const calculateTodayRevenue = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders
      .filter(o => o.created_at.startsWith(today) && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0);
  };

  const handleDownloadReport = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders
      .filter(o => o.created_at.startsWith(todayStr) && o.status !== 'Cancelled')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    if (todayOrders.length === 0) {
      alert("No sales data available for today yet.");
      return;
    }

    const doc = new jsPDF();
    const revenue = calculateTodayRevenue();

    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22);
    doc.text("Hotel Anandam", 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text("Daily Sales Report", 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 38, { align: 'center' });

    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, 45, 182, 20, 3, 3, 'FD');
    
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(`Total Orders: ${todayOrders.length}`, 20, 57);
    doc.text(`Total Revenue: Rs. ${revenue}`, 150, 57);

    const tableHeaders = [['Token', 'ID', 'Time', 'Customer Number', 'Items', 'Amount', 'Status']];
    const tableData = todayOrders.map((order, idx) => [
      idx + 1,
      order.id.slice(0, 6),
      new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      order.phone,
      order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      `Rs. ${order.total_amount}`,
      order.status
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 75,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 247, 237] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 75;
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(`Report generated at ${new Date().toLocaleTimeString()}`, 105, finalY + 20, { align: 'center' });

    doc.save(`HotelAnandam_Sales_${todayStr}.pdf`);
  };

  const handlePrintReceipt = (order: Order) => {
    const tokenNumber = getDailyToken(order);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-family: monospace;">
        <span>${item.quantity} x ${item.name}</span>
        <span>₹${item.price * item.quantity}</span>
      </div>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Receipt - Hotel Anandam</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .footer { border-top: 1px dashed #000; padding-top: 10px; margin-top: 15px; text-align: center; font-size: 12px; }
            .total { font-weight: bold; font-size: 18px; margin-top: 10px; display: flex; justify-content: space-between; }
            .info { font-size: 12px; margin-bottom: 15px; line-height: 1.6; }
            .bold-line { font-weight: 900; font-size: 14px; }
            .token-box { font-size: 32px; font-weight: 900; margin: 10px 0; border: 3px solid #000; display: inline-block; padding: 10px 25px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h2 style="margin:0;">HOTEL ANANDAM</h2>
            <p style="margin:5px 0; font-size:12px;">Samayapuram, Madurai</p>
            <div class="token-box">TOKEN: ${tokenNumber}</div>
            <p style="margin:5px 0 0 0; font-size:11px; font-weight:bold;">TAX INVOICE</p>
          </div>
          <div class="info">
            <div>Order ID: #${order.id.slice(0, 8)}</div>
            <div>Date: ${new Date(order.created_at).toLocaleString()}</div>
            <div class="bold-line">Customer Number: ${order.phone}</div>
            <div class="bold-line">Location: ${order.location}</div>
          </div>
          <div style="border-bottom: 1px solid #000; margin-bottom: 10px;"></div>
          ${itemsHtml}
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 10px;">
            <span>Delivery Fee</span>
            <span>₹30</span>
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>₹${order.total_amount}</span>
          </div>
          <div class="footer">
            <p>Thank you for choosing Hotel Anandam!</p>
            <p>Payment Mode: ${order.payment_method}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const revenue = calculateTodayRevenue();
  const pendingCount = orders.filter(o => o.status === 'Pending Acceptance').length;
  const completedCount = orders.filter(o => o.status === 'Delivered').length;

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center space-x-4">
          {onClose && (
            <button 
              onClick={onClose} 
              className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-100 transition-all shadow-sm active:scale-95"
              title="Exit Kitchen Dashboard"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
              Kitchen Dashboard
              <span className="ml-3 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </h2>
            <p className="text-gray-500 font-medium italic">Operations Control Center</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today Sales</p>
            <p className="text-lg font-black text-orange-600">₹{revenue}</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Orders</p>
            <p className="text-lg font-black text-amber-500">{pendingCount}</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Served</p>
            <p className="text-lg font-black text-green-500">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-gray-800">Live Order Queue</h3>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleDownloadReport} 
              className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm active:scale-95"
            >
              <i className="fas fa-file-pdf mr-2 text-orange-400"></i> Download Report
            </button>
            <button 
              onClick={fetchOrders} 
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95"
            >
              <i className="fas fa-sync-alt mr-2"></i> Sync
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-gray-200 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-utensils text-3xl text-gray-200"></i>
            </div>
            <p className="text-gray-400 font-bold">Waiting for first order of the day...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const token = getDailyToken(order);
              return (
                <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-lg transition-all relative overflow-hidden flex flex-col group">
                  <div className="absolute -top-1 -right-1 w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-black rounded-bl-3xl shadow-lg z-10 border-b border-l border-white/10">
                    {token}
                  </div>

                  {order.status !== 'Pending Acceptance' && order.status !== 'Cancelled' && (
                    <button 
                      onClick={() => handlePrintReceipt(order)}
                      className="absolute top-16 right-6 w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm z-10 animate-in fade-in zoom-in"
                      title="Print Bill"
                    >
                      <i className="fas fa-print"></i>
                    </button>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        order.status === 'Pending Acceptance' ? 'bg-amber-100 text-amber-600 animate-pulse' :
                        order.status === 'Preparing' ? 'bg-blue-100 text-blue-600' :
                        order.status === 'Ready' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Order #{order.id.slice(0, 8)}</p>
                    </div>
                    <div className={`text-right ${order.status === 'Pending Acceptance' ? 'pr-2' : 'pr-12'}`}>
                       <p className="text-lg font-black text-gray-900">₹{order.total_amount}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-orange-400">
                        <i className="fas fa-location-dot"></i>
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{order.location}</p>
                        <p className="text-[10px] text-gray-500 font-bold">{order.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 flex-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
                      Items <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 font-bold">
                          <span className="text-orange-500 font-black mr-1">{item.quantity}x</span> 
                          {item.name}
                        </span>
                        <span className="text-gray-400 font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    {order.status === 'Pending Acceptance' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'Preparing')}
                        className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all flex items-center justify-center group"
                      >
                        <i className="fas fa-check-circle mr-2 group-hover:rotate-12 transition-transform"></i>
                        Accept Order
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'Ready')}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center"
                      >
                        <i className="fas fa-utensils mr-2"></i>
                        Mark as Ready
                      </button>
                    )}
                    {order.status === 'Ready' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'Delivered')}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center"
                      >
                        <i className="fas fa-truck mr-2 text-orange-400"></i>
                        Confirm Delivered
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTab;