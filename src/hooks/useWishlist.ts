import { useEffect, useMemo, useState } from 'react';
import { Product } from '../types';

const WISHLIST_STORAGE_PREFIX = 'anfauth:wishlist:';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadStoredWishlist(storageKey: string) {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

export const useWishlist = (userStorageKey: string | null = null) => {
  const storageKey = useMemo(
    () => `${WISHLIST_STORAGE_PREFIX}${userStorageKey || 'guest'}`,
    [userStorageKey]
  );

  const [wishlist, setWishlist] = useState<Product[]>(() => loadStoredWishlist(storageKey));

  useEffect(() => {
    setWishlist(loadStoredWishlist(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!isBrowser()) return;
    window.localStorage.setItem(storageKey, JSON.stringify(wishlist));
  }, [storageKey, wishlist]);

  const addToWishlist = (product: Product) => {
    setWishlist((prevWishlist) => {
      if (prevWishlist.find((p) => p.id === product.id)) {
        return prevWishlist;
      }
      return [...prevWishlist, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prevWishlist) => prevWishlist.filter((p) => p.id !== productId));
  };

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist
  };
};
