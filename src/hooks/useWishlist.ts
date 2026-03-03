import { useCallback, useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import * as wishlistApi from '../services/wishlist';

const WISHLIST_GUEST_KEY = 'anfauth:wishlist:guest_ids';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadGuestWishlistIds() {
  if (!isBrowser()) return [] as string[];
  try {
    const raw = window.localStorage.getItem(WISHLIST_GUEST_KEY);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [] as string[];
    return parsed.map((id) => String(id)).filter(Boolean);
  } catch {
    return [] as string[];
  }
}

export const useWishlist = (products: Product[], authToken: string) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => loadGuestWishlistIds());

  useEffect(() => {
    if (!authToken) {
      setWishlistIds(loadGuestWishlistIds());
      return;
    }

    let mounted = true;
    wishlistApi
      .getWishlist()
      .then((ids) => {
        if (!mounted) return;
        setWishlistIds(ids.map((id) => String(id)));
      })
      .catch(() => {
        if (!mounted) return;
        setWishlistIds([]);
      });

    return () => {
      mounted = false;
    };
  }, [authToken]);

  useEffect(() => {
    if (!isBrowser() || authToken) return;
    window.localStorage.setItem(WISHLIST_GUEST_KEY, JSON.stringify(wishlistIds));
  }, [authToken, wishlistIds]);

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  const wishlist = useMemo(
    () => products.filter((product) => wishlistSet.has(String(product.id))),
    [products, wishlistSet],
  );

  const isWishlisted = useCallback(
    (productId: string | number) => wishlistSet.has(String(productId)),
    [wishlistSet],
  );

  const addToWishlist = useCallback(
    async (product: Product) => {
      const productId = String(product.id);
      if (!productId) return;

      if (!authToken) {
        setWishlistIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
        return;
      }

      const ids = await wishlistApi.addToWishlist(productId);
      setWishlistIds(ids.map((id) => String(id)));
    },
    [authToken],
  );

  const removeFromWishlist = useCallback(
    async (productId: string | number) => {
      const normalizedId = String(productId);
      if (!normalizedId) return;

      if (!authToken) {
        setWishlistIds((prev) => prev.filter((id) => id !== normalizedId));
        return;
      }

      const ids = await wishlistApi.removeFromWishlist(normalizedId);
      setWishlistIds(ids.map((id) => String(id)));
    },
    [authToken],
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (isWishlisted(product.id)) {
        await removeFromWishlist(product.id);
        return false;
      }
      await addToWishlist(product);
      return true;
    },
    [addToWishlist, isWishlisted, removeFromWishlist],
  );

  return {
    wishlist,
    wishlistIds,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  };
};
