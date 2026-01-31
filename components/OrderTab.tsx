
import React, { useState } from 'react';
import { CartItem, FoodItem } from '../types';

interface OrderTabProps {
  cartItems: CartItem[];
  onAdd: (item: FoodItem) => void;
  onRemove: (itemId: string) => void;
  onClear: () => void;
  orderStatus: 'idle' | 'processing' | 'success';
  onPlaceOrder: (phone: string, location: string, paymentMethod: 'COD' | 'GPay') => void;
  onTrackOrder: () => void;
}

const OrderTab: React.FC<OrderTabProps> = ({ 
  cartItems, 
  onAdd, 
  onRemove, 
  onClear, 
  orderStatus, 
  onPlaceOrder,
  onTrackOrder 
}) => {
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('S-block');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'GPay'>('COD');
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 30 : 0;
  const total = subtotal + deliveryFee;

  const handleValidateAndOrder = () => {
    if (paymentMethod === 'GPay') return; // Double safety
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    onPlaceOrder(phone, location, paymentMethod);
  };

  if (orderStatus === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h3 className="text-2xl font-bold text-gray-800">Processing Your Order</h3>
        <p className="text-gray-500 mt-2 text-sm">Securing your delicious meal...</p>
      </div>
    );
  }

  if (orderStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-xl shadow-orange-50">
          <i className="fas fa-clock"></i>
        </div>
        <h3 className="text-3xl font-bold text-gray-800">Order Received!</h3>
        <p className="text-gray-500 mt-4 max-w-sm text-lg leading-relaxed">
          Waiting for Hotel Anandam to accept your order. You can track the status in your profile.
        </p>
        <button 
          onClick={onTrackOrder}
          className="mt-10 bg-orange-500 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 active:scale-95 transition-all hover:bg-orange-600"
        >
          Track My Order
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 lg:p-12">
      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-8 px-1">Checkout</h3>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-400 py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-shopping-basket text-3xl opacity-20"></i>
          </div>
          <p className="font-bold text-lg text-gray-600">Your basket is empty</p>
          <p className="text-sm mt-1">Discover something delicious today!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Basket Items */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-gray-800 text-lg">Items ({cartItems.length})</h4>
                <button onClick={onClear} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest">Clear All</button>
              </div>
              <div className="space-y-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                    <img src={item.image} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover" />
                    <div className="ml-4 flex-1">
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">{item.name}</h4>
                      <p className="text-orange-600 font-bold text-xs sm:text-sm">₹{item.price}</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-1.5">
                      <button onClick={() => onRemove(item.id)} className="w-8 h-8 bg-white text-gray-400 rounded-lg flex items-center justify-center shadow-sm"><i className="fas fa-minus text-[10px]"></i></button>
                      <span className="font-bold text-gray-700 w-4 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => onAdd(item)} className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-md"><i className="fas fa-plus text-[10px]"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Details Form */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h4 className="font-bold text-gray-800 text-lg">Delivery Details</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Mobile Number</label>
                  <input 
                    type="tel"
                    maxLength={10}
                    placeholder="10 digit mobile number"
                    className={`w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl focus:outline-none transition-all font-medium ${error ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-orange-500'}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                  {error && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-wider">{error}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Select Building</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['S-block', 'G-block', 'IST Building'].map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={`py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 transition-all ${
                          location === loc 
                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg' 
                            : 'bg-white border-gray-100 text-gray-500 hover:border-orange-200'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center space-y-2 transition-all ${
                        paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <i className="fas fa-hand-holding-dollar text-xl text-orange-500"></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">Cash on Delivery</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('GPay')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center space-y-2 transition-all relative ${
                        paymentMethod === 'GPay' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-tighter">Soon</span>
                      <i className="fab fa-google-pay text-2xl text-blue-600 opacity-60"></i>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">GPay Online</span>
                    </button>
                  </div>
                  {paymentMethod === 'GPay' && (
                    <p className="mt-3 text-[10px] text-blue-600 font-bold bg-blue-50 p-2 rounded-lg border border-blue-100 text-center uppercase tracking-widest">
                      GPay is currently being configured. Please use COD for now.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-50 sticky top-4">
              <h4 className="font-bold text-gray-800 text-xl mb-6">Order Summary</h4>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 text-sm font-medium">
                  <span>Subtotal</span>
                  <span className="text-gray-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm font-medium">
                  <span>Delivery Fee</span>
                  <span className="text-gray-800">₹{deliveryFee}</span>
                </div>
                <div className="h-px bg-gray-100 w-full my-2"></div>
                <div className="flex justify-between text-xl font-extrabold text-gray-800">
                  <span>Total</span>
                  <span className="text-orange-600">₹{total}</span>
                </div>
              </div>

              <button 
                onClick={handleValidateAndOrder}
                disabled={paymentMethod === 'GPay'}
                className={`w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center group ${
                  paymentMethod === 'GPay' 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-orange-500 text-white shadow-orange-100 hover:bg-orange-600 active:scale-95'
                }`}
              >
                <span>Place Order</span>
                {paymentMethod === 'COD' && <i className="fas fa-arrow-right ml-3 text-sm opacity-50 group-hover:translate-x-1 transition-transform"></i>}
              </button>
              
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6 leading-relaxed">
                By clicking, you agree to our <br/> Terms of Service
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTab;
