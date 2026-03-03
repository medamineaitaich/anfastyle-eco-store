import { apiUrl } from './api';
import { getSession } from './authStorage';

function getAuthToken(): string {
  const session = getSession();
  return String(session?.token || '').trim();
}

async function requestWishlist(method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<number[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Please sign in to use wishlist.');
  }

  const res = await fetch(apiUrl('/api/store/wishlist'), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(data?.error || 'Wishlist request failed.'));
  }

  const wishlist = Array.isArray(data?.wishlist) ? data.wishlist : [];
  return wishlist
    .map((id: unknown) => Number(id))
    .filter((id: number) => Number.isFinite(id) && id > 0);
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
