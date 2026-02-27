import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export const Popup = ({ isVisible, onClose }: PopupProps) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-cream max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
        >
          <button onClick={onClose} className="absolute top-4 right-4 z-10 text-primary hover:text-secondary">
            <X size={24} />
          </button>
          <div className="w-full md:w-1/2 h-48 md:h-auto">
            <img
              src="https://picsum.photos/seed/popup/600/800"
              alt="Join us"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="w-full md:w-1/2 p-10 flex flex-col justify-center text-center">
            <h2 className="text-3xl font-serif mb-4">Wait! Don't Miss Out</h2>
            <p className="text-primary/70 mb-8">
              Join our community today and get 10% off your first order. Plus, receive our monthly permaculture guide!
            </p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-6 py-4 bg-white border border-primary/10 rounded-xl focus:outline-none"
              />
              <button className="w-full bg-primary text-cream py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-accent transition-all">
                Claim My Discount
              </button>
            </form>
            <button onClick={onClose} className="mt-4 text-xs text-primary/40 uppercase tracking-widest hover:text-primary">
              No thanks, I prefer full price
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
