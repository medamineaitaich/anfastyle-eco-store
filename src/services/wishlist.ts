import { ApiError, apiFetch } from './http';

interface WishlistResponse {
  wishlist?: unknown[];
}

function toWishlistIds(raw: unknown): number[] {
  const wishlist = Array.isArray(raw) ? raw : [];
  return wishlist
    .map((id: unknown) => Number(id))
    .filter((id: number) => Number.isFinite(id) && id > 0);
}

function normalizeWishlistError(error: unknown): Error {
  if (error instanceof ApiError && error.status === 401) {
    return new Error('Session expired. Please sign in again.');
  }
  if (error instanceof Error) return error;
  return new Error('Unable to update wishlist right now.');
}

async function requestWishlist(method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<number[]> {
  try {
    const data = await apiFetch<WishlistResponse>(
      '/api/store/wishlist',
      {
        method,
        ...(body ? { body } : {}),
      },
      { auth: true },
    );
    return toWishlistIds(data?.wishlist);
  } catch (error) {
    throw normalizeWishlistError(error);
  }
}

export function getWishlist(): Promise<number[]> {
  return requestWishlist('GET');
}

export function addToWishlist(productId: string | number): Promise<number[]> {
  return requestWishlist('POST', { product_id: Number(productId), action: 'add' });
}

export function removeFromWishlist(productId: string | number): Promise<number[]> {
  return requestWishlist('POST', { product_id: Number(productId), action: 'remove' });
}
