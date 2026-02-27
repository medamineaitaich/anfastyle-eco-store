import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard = ({ product, onSelect }: ProductCardProps) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="group cursor-pointer"
    onClick={() => onSelect(product)}
  >
    <div className="relative aspect-[3/4] overflow-hidden bg-white mb-4">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      <button className="absolute bottom-4 left-4 right-4 bg-cream text-primary py-3 text-xs font-bold uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        View Details
      </button>
    </div>
    <h3 className="text-sm font-medium text-primary mb-1">{product.name}</h3>
    <p className="text-sm text-primary/60">${product.price.toFixed(2)}</p>
  </motion.div>
);
