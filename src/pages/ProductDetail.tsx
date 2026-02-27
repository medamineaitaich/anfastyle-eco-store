import React, { useState } from 'react';
import { ChevronRight, Heart } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (p: Product, color: string, size: string) => void;
  onAddToWishlist: (p: Product) => void;
}

export const ProductDetail = ({ product, onBack, onAddToCart, onAddToWishlist }: ProductDetailProps) => {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [wishlistMessage, setWishlistMessage] = useState('');

  return (
    <div className="py-20 bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center text-sm font-bold uppercase tracking-widest text-primary/50 hover:text-primary mb-12 transition-colors"
        >
          <ChevronRight size={18} className="rotate-180 mr-2" />
          Back to Catalog
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-white shadow-xl">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">{product.category}</p>
              <h1 className="text-4xl md:text-5xl font-serif mb-4">{product.name}</h1>
              <p className="text-2xl text-primary">${product.price.toFixed(2)}</p>
            </div>

            <p className="text-primary/70 leading-relaxed">
              {product.description}
            </p>

            {product.colors && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/50">Color</p>
                <div className="flex gap-3">
                  {product.colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-primary scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/50">Size</p>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        selectedSize === size 
                          ? 'border-primary bg-primary text-cream' 
                          : 'border-primary/10 hover:border-primary/30'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8 space-y-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => onAddToCart(product, selectedColor, selectedSize)}
                  className="flex-grow bg-primary text-cream py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-xl"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={() => {
                    onAddToWishlist(product);
                    setWishlistMessage('Added to wishlist!');
                    setTimeout(() => setWishlistMessage(''), 2000);
                  }}
                  className="px-6 bg-white text-primary border border-primary/10 rounded-2xl hover:bg-cream transition-all relative"
                >
                  <Heart size={24} className={wishlistMessage ? 'fill-secondary text-secondary' : ''} />
                  {wishlistMessage && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-cream text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      {wishlistMessage}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-primary/40">
                Free shipping on orders over $75. 30-day easy returns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
