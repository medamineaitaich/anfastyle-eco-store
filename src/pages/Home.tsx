import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ui/ProductCard';
import { Newsletter } from '../components/ui/Newsletter';
import { Product } from '../types';

interface HomeProps {
  setActivePage: (page: string) => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
}

export const Home = ({ setActivePage, onSelectProduct, products }: HomeProps) => {
  const featuredProducts = products.slice(0, 4);

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://picsum.photos/seed/nature/1920/1080"
            alt="Nature Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-cream">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
              Wear the Ecosystem. <br /> <span className="italic text-secondary">Live the Change.</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 text-cream/80 leading-relaxed">
              Discover our premium collection of apparel inspired by permaculture, nature, and sustainable living. Every design tells a story of regeneration.
            </p>
            <button 
              onClick={() => setActivePage('catalog')}
              className="bg-secondary text-cream px-10 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-cream hover:text-primary transition-all shadow-xl flex items-center group"
            >
              Shop Collection
              <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Info Icons */}
      <section className="py-16 bg-cream border-b border-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary">
                <ChevronRight size={24} className="rotate-90" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-xs">Eco-Conscious</h3>
              <p className="text-sm text-primary/60">Sustainable production & materials</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary">
                <ChevronRight size={24} className="rotate-90" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-xs">Premium Quality</h3>
              <p className="text-sm text-primary/60">Durable prints & soft fabrics</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary">
                <ChevronRight size={24} className="rotate-90" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-xs">Global Shipping</h3>
              <p className="text-sm text-primary/60">Delivered to your doorstep</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif mb-4">Featured Designs</h2>
              <p className="text-primary/60">Our most loved permaculture-inspired pieces.</p>
            </div>
            <button 
              onClick={() => setActivePage('catalog')}
              className="hidden md:block text-sm font-bold uppercase tracking-widest border-b-2 border-primary pb-1 hover:text-secondary hover:border-secondary transition-all"
            >
              View All Products
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
            ))}
          </div>

          <div className="mt-16 text-center md:hidden">
            <button 
              onClick={() => setActivePage('catalog')}
              className="bg-primary text-cream px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-accent transition-all"
            >
              View All Products
            </button>
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
};
