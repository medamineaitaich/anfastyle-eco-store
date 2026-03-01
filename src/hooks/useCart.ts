import { useState } from 'react';
import { CartItem, Product } from '../types';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product, color: string, size: string) => {
    const productColor = product.attributes?.color || color;
    const productSize = product.attributes?.size || size;
    const existingItemIndex = cart.findIndex(
      item => {
        if (product.variationId || item.variationId) {
          return item.id === product.id && item.variationId === product.variationId;
        }
        return item.id === product.id && item.color === productColor && item.size === productSize;
      }
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        ...product,
        color: productColor,
        size: productSize,
        attributes: {
          color: productColor || product.attributes?.color,
          size: productSize || product.attributes?.size,
        },
        quantity: 1
      }]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    cartCount
  };
};
