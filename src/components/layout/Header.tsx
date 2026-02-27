import React, { useState } from 'react';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onAccountOpen: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  cartCount: number;
}

export const Header = ({ onSearchOpen, onCartOpen, onAccountOpen, activePage, setActivePage, cartCount }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Catalog', id: 'catalog' },
    { name: 'About', id: 'about' },
    { name: 'Contact', id: 'contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-primary p-2">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setActivePage('home')}>
            <span className="text-2xl font-serif font-bold tracking-tighter text-primary">ANFASTYLE</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-10">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActivePage(link.id)}
                className={`text-sm font-medium tracking-wide transition-colors hover:text-secondary ${
                  activePage === link.id ? 'text-primary border-b-2 border-primary' : 'text-primary/70'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button onClick={onSearchOpen} className="text-primary hover:text-secondary transition-colors p-2">
              <Search size={20} />
            </button>
            <button onClick={onAccountOpen} className="text-primary hover:text-secondary transition-colors p-2">
              <User size={20} />
            </button>
            <button onClick={onCartOpen} className="text-primary hover:text-secondary transition-colors p-2 relative">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-secondary text-cream text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-cream border-b border-primary/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setActivePage(link.id);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left text-lg font-medium text-primary py-2"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
