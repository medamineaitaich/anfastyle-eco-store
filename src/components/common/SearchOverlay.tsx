import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  setActivePage: (page: string) => void;
  setSearchResults: (results: any[]) => void;
  products: Product[];
}

export const SearchOverlay = ({ isOpen, onClose, setActivePage, setSearchResults, products }: SearchOverlayProps) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const results = products.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setActivePage('search-results');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-primary/95 flex items-center justify-center px-4"
        >
          <button onClick={onClose} className="absolute top-8 right-8 text-cream hover:text-secondary">
            <X size={32} />
          </button>
          <div className="w-full max-w-3xl">
            <form onSubmit={handleSearch} className="relative">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search our collection..."
                className="w-full bg-transparent border-b-2 border-cream/30 py-6 text-3xl md:text-5xl text-cream placeholder:text-cream/30 focus:outline-none focus:border-secondary transition-colors font-serif"
              />
              <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-cream hover:text-secondary">
                <Search size={32} />
              </button>
            </form>
            <div className="mt-12 text-cream/50 text-sm uppercase tracking-widest">
              Popular: Permaculture, Compost, Nature
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
