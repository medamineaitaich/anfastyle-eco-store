import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';

interface FooterProps {
  setActivePage: (page: string) => void;
}

export const Footer = ({ setActivePage }: FooterProps) => (
  <footer className="bg-accent text-cream pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="space-y-6">
        <h3 className="text-2xl font-serif font-bold tracking-tighter">ANFASTYLE</h3>
        <p className="text-cream/70 text-sm leading-relaxed">
          Sustainable style for the conscious earth-dweller. Inspired by permaculture and the beauty of our natural world.
        </p>
        <div className="flex space-x-4">
          <Facebook size={20} className="text-cream/50 hover:text-secondary cursor-pointer" />
          <Instagram size={20} className="text-cream/50 hover:text-secondary cursor-pointer" />
          <Twitter size={20} className="text-cream/50 hover:text-secondary cursor-pointer" />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Shop</h4>
        <ul className="space-y-4 text-sm text-cream/70">
          <li><button onClick={() => setActivePage('catalog')} className="hover:text-secondary transition-colors">All Products</button></li>
          <li><button onClick={() => setActivePage('catalog')} className="hover:text-secondary transition-colors">Permaculture Collection</button></li>
          <li><button onClick={() => setActivePage('catalog')} className="hover:text-secondary transition-colors">Eco-Nature Designs</button></li>
          <li><button onClick={() => setActivePage('catalog')} className="hover:text-secondary transition-colors">Compost Series</button></li>
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Support</h4>
        <ul className="space-y-4 text-sm text-cream/70">
          <li><button onClick={() => setActivePage('faqs')} className="hover:text-secondary transition-colors">FAQs</button></li>
          <li><button onClick={() => setActivePage('privacy')} className="hover:text-secondary transition-colors">Privacy Policy</button></li>
          <li><button onClick={() => setActivePage('terms')} className="hover:text-secondary transition-colors">Terms of Service</button></li>
          <li><button onClick={() => setActivePage('disclaimer')} className="hover:text-secondary transition-colors">Disclaimer</button></li>
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Contact</h4>
        <ul className="space-y-4 text-sm text-cream/70">
          <li>contact@anfastyle.com</li>
          <li>1209 MOUNTAIN ROAD PL NE STE R</li>
          <li>Albuquerque, NM 87110, USA</li>
          <li>+1 (202) 773-7432</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-cream/10 text-center text-xs text-cream/40">
      <p>© {new Date().getFullYear()} ANFASTYLE. Operated by <a href="https://medaitllc.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary underline transition-colors">MEDAIT REGISTERED LLC</a>. All rights reserved.</p>
    </div>
  </footer>
);
