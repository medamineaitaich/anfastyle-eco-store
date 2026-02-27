import { useState } from 'react';
import { Product } from '../types';

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  const addToWishlist = (product: Product) => {
    if (!wishlist.find(p => p.id === product.id)) {
      setWishlist([...wishlist, product]);
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(wishlist.filter(p => p.id !== productId));
  };

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist
  };
};
