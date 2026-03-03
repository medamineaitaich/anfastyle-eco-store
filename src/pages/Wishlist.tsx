import React from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ui/ProductCard';

interface WishlistPageProps {
  wishlist: Product[];
  onSelectProduct: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string | number) => boolean;
}

export const WishlistPage = ({ wishlist, onSelectProduct, onToggleWishlist, isWishlisted }: WishlistPageProps) => {
  return (
    <div className="py-20 bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif mb-12">My Wishlist</h1>
        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
            <Heart size={48} className="mx-auto mb-6 text-primary/10" />
            <p className="text-primary/40">Your wishlist is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {wishlist.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={isWishlisted(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
