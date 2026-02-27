import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ThankYouProps {
  setActivePage: (page: string) => void;
}

export const ThankYou = ({ setActivePage }: ThankYouProps) => (
  <div className="py-20 bg-cream min-h-screen flex items-center">
    <div className="max-w-2xl mx-auto px-4 text-center">
      <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-8 text-secondary">
        <CheckCircle2 size={48} />
      </div>
      <h1 className="text-5xl font-serif mb-6">Thank You for Your Order!</h1>
      <p className="text-xl text-primary/70 mb-10 leading-relaxed">
        Your order has been placed successfully. We've sent a confirmation email to your inbox with all the details.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => setActivePage('catalog')}
          className="bg-primary text-cream px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-accent transition-all"
        >
          Continue Shopping
        </button>
        <button 
          onClick={() => setActivePage('account')}
          className="bg-white text-primary border border-primary/10 px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-cream transition-all"
        >
          View My Orders
        </button>
      </div>
    </div>
  </div>
);
