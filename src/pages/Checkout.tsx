import React, { useMemo, useState } from 'react';
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
  const [successOrder, setSuccessOrder] = useState<{ id: number | string; total: string | number } | null>(null);
  const [notes, setNotes] = useState('');
  const [customer, setCustomer] = useState({
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address_1: user?.address || '',
    city: '',
    country: 'US',
    postcode: '',
  });

  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const productId = Number(item.id);
        if (!Number.isFinite(productId) || productId <= 0) return null;
        return {
          product_id: productId,
          quantity: item.quantity,
          variation_id: item.variationId,
        };
      })
      .filter(Boolean);
  }, [cart]);

  const handleCompleteOrder = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: cartItems,
          notes: notes || undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Checkout failed. Please try again.');
      }

      const wcOrder = body?.order || {};
      setSuccessOrder({
        id: wcOrder.id ?? 'N/A',
        total: wcOrder.total ?? total.toFixed(2),
      });

      const newOrder: Order = {
        id: String(wcOrder.id ?? Math.random().toString(36).slice(2, 10).toUpperCase()),
        date: new Date().toLocaleDateString(),
        status: String(wcOrder.status || 'processing'),
        trackingNumber: 'ANF' + Math.floor(Math.random() * 1000000000),
        items: [...cart],
        total: Number(wcOrder.total ?? total),
      };
      onComplete(newOrder);
    } catch (e: any) {
      setError(e?.message || 'Checkout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="py-20 bg-cream min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-10 rounded-3xl shadow-sm text-center space-y-4">
            <h1 className="text-4xl font-serif">Order Placed</h1>
            <p className="text-primary/70">Your WooCommerce order has been created successfully.</p>
            <p className="text-sm text-primary/60">Order ID: <span className="font-bold text-primary">{successOrder.id}</span></p>
            <p className="text-sm text-primary/60">Total: <span className="font-bold text-primary">${successOrder.total}</span></p>
          </div>
        </div>
      </div>
    );
  }

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
                  <input
                    type="text"
                    value={customer.first_name}
                    onChange={(e) => setCustomer((v) => ({ ...v, first_name: e.target.value }))}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Last Name</label>
                  <input
                    type="text"
                    value={customer.last_name}
                    onChange={(e) => setCustomer((v) => ({ ...v, last_name: e.target.value }))}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Email</label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer((v) => ({ ...v, email: e.target.value }))}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Phone</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer((v) => ({ ...v, phone: e.target.value }))}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Address</label>
                  <input
                    type="text"
                    value={customer.address_1}
                    onChange={(e) => setCustomer((v) => ({ ...v, address_1: e.target.value }))}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">City</label>
                  <input
                    type="text"
                    value={customer.city}
                    onChange={(e) => setCustomer((v) => ({ ...v, city: e.target.value }))}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Postal Code</label>
                  <input
                    type="text"
                    value={customer.postcode}
                    onChange={(e) => setCustomer((v) => ({ ...v, postcode: e.target.value }))}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Country</label>
                  <select
                    value={customer.country}
                    onChange={(e) => setCustomer((v) => ({ ...v, country: e.target.value }))}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none appearance-none"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-6 py-4 bg-cream/50 border border-primary/10 rounded-xl focus:outline-none"
                    rows={3}
                  />
                </div>
              </form>
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm">
              <h2 className="text-xl font-bold mb-2">Payment</h2>
              <p className="text-sm text-primary/60">Cash on delivery</p>
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
                disabled={isLoading || cartItems.length === 0}
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
