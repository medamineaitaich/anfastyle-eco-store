import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../../types';

interface CartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
}

export const CartOverlay = ({ isOpen, onClose, cart, onUpdateQuantity, onRemove, onCheckout }: CartOverlayProps) => {
  const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[160] w-full max-w-md bg-cream shadow-2xl flex flex-col"
          >
            <div className="p-8 flex justify-between items-center border-b border-primary/10">
              <h2 className="text-2xl font-serif">Your Cart</h2>
              <button onClick={onClose} className="text-primary hover:text-secondary">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-8">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-primary/40 mb-8">Your cart is empty.</p>
                  <button 
                    onClick={onClose}
                    className="text-sm font-bold uppercase tracking-widest border-b-2 border-primary pb-1"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-6">
                    <div className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{item.name}</h4>
                        <button onClick={() => onRemove(idx)} className="text-primary/30 hover:text-red-500">
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-primary/50 uppercase tracking-widest">
                        {item.variationId
                          ? `${item.attributes?.color || item.color || '-'} / ${item.attributes?.size || item.size || '-'}`
                          : (
                            <>
                              {item.size} / <span className="inline-block w-2 h-2 rounded-full align-middle" style={{ backgroundColor: item.color }} />
                            </>
                          )}
                      </p>
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center border border-primary/10 rounded-lg overflow-hidden">
                          <button 
                            onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                            className="px-3 py-1 hover:bg-primary/5"
                          >-</button>
                          <span className="px-3 py-1 text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                            className="px-3 py-1 hover:bg-primary/5"
                          >+</button>
                        </div>
                        <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-white border-t border-primary/10 space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-primary/60 uppercase tracking-widest text-xs font-bold">Subtotal</span>
                  <span className="text-2xl font-serif">${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-primary/40 text-center uppercase tracking-widest">
                  Shipping & taxes calculated at checkout
                </p>
                <button 
                  onClick={onCheckout}
                  className="w-full bg-primary text-cream py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-xl"
                >
                  Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
