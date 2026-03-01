import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { CartItem, User, Order } from '../types';

interface CheckoutProps {
  cart: CartItem[];
  onComplete: (order: Order) => void;
  user: User | null;
}

export const Checkout = ({ cart, onComplete, user }: CheckoutProps) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 75 ? 0 : 10;
  const total = subtotal + shipping;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompleteOrder = () => {
    setIsLoading(true);
    setError('');

    // Mock processing
    setTimeout(() => {
      setIsLoading(false);
      // Random failure simulation (10% chance)
      if (Math.random() < 0.1) {
        setError('Payment failed. Please check your card details and try again.');
        return;
      }

      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toLocaleDateString(),
        status: 'Processing',
        trackingNumber: 'ANF' + Math.floor(Math.random() * 1000000000),
        items: [...cart],
        total: total
      };
      onComplete(newOrder);
    }, 2000);
  };

  return (
    <div className="py-20 bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif mb-12">Checkout</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-12">
            <section className="bg-white p-8 rounded-3xl shadow-sm">
              <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">First Name</label>
                  <input type="text" defaultValue={user?.firstName || ''} className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Last Name</label>
                  <input type="text" defaultValue={user?.lastName || ''} className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Address</label>
                  <input type="text" defaultValue={user?.address || ''} className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">City</label>
                  <input type="text" className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">State / Province</label>
                  <input type="text" className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Postal Code</label>
                  <input type="text" className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Country</label>
                  <select className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none appearance-none">
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Phone Number (Optional)</label>
                  <input type="tel" className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" placeholder="+1 (555) 000-0000" />
                </div>
              </form>
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm">
              <h2 className="text-xl font-bold mb-6">Payment</h2>
              <div className="space-y-4">
                <div className="p-4 border-2 border-primary rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-primary" />
                    <span className="font-medium">Credit Card</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-5 bg-primary/10 rounded" />
                    <div className="w-8 h-5 bg-primary/10 rounded" />
                  </div>
                </div>
                <input type="text" placeholder="Card Number" className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM/YY" className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                  <input type="text" placeholder="CVC" className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-8 rounded-3xl shadow-sm sticky top-32">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-medium">{item.name}</h4>
                      <p className="text-xs text-primary/50">
                        {item.variationId
                          ? `${item.attributes?.color || item.color || '-'} / ${item.attributes?.size || item.size || '-'}`
                          : `${item.size} / ${item.color}`}
                      </p>
                      <p className="text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-primary/10">
                <div className="flex justify-between text-sm">
                  <span className="text-primary/60">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-primary/60">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-4 border-t border-primary/10">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCompleteOrder}
                disabled={isLoading}
                className="w-full bg-primary text-cream py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all mt-8 shadow-xl disabled:opacity-50 flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                ) : (
                  'Complete Order'
                )}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
