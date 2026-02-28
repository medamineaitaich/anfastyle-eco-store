import { User, Order } from '../types';

// Mock API service
export const api = {
  login: async (credentials: any): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          address: '123 Nature Way, Eco City, 90210'
        });
      }, 1500);
    });
  },

  register: async (userData: any): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1500);
    });
  },

  processOrder: async (orderData: any): Promise<Order> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new Error('Payment failed. Please check your card details and try again.'));
          return;
        }

        resolve({
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          date: new Date().toLocaleDateString(),
          status: 'Processing',
          trackingNumber: 'ANF' + Math.floor(Math.random() * 1000000000),
          items: orderData.items,
          total: orderData.total
        });
      }, 2000);
    });
  }
};

export async function fetchProducts(params: {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string | number;
} = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.search) qs.set("search", params.search);
  if (params.category !== undefined) qs.set("category", String(params.category));

  const res = await fetch(`/api/products?${qs.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`/api/categories`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchStoreProduct(id: number | string) {
  const productRes = await fetch(`/api/store/products/${id}?t=${Date.now()}`);
  if (!productRes.ok) throw new Error(await productRes.text());
  const productData = await productRes.json();

  let variations: any[] = [];
  try {
    const variationsRes = await fetch(`/api/products/${id}/variations?per_page=100&page=1&t=${Date.now()}`);
    if (variationsRes.ok) {
      const rawVariations = await variationsRes.json();
      variations = Array.isArray(rawVariations) ? rawVariations : [];
    }
  } catch {
    variations = [];
  }

  return {
    source: "store-endpoint",
    product: productData?.product ?? productData,
    variations,
  } as { source: string; product: any; variations: any[] };
}

export async function fetchStoreProducts(params: {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string | number;
  sort?: "newest" | "price_asc" | "price_desc";
  on_sale?: boolean;
} = {}) {
  const qs = new URLSearchParams();
  qs.set("t", String(Date.now()));
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.search) qs.set("search", params.search);
  if (params.category !== undefined) qs.set("category", String(params.category));
  if (params.sort) qs.set("sort", params.sort);
  if (params.on_sale !== undefined) qs.set("on_sale", String(params.on_sale));

  const res = await fetch(`/api/store/products?${qs.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ source: string; page: number; per_page: number; total: number; totalPages: number; items: any[] }>;
}

export async function fetchStoreCategories() {
  const res = await fetch(`/api/store/categories?t=${Date.now()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ source: string; items: Array<{ id: number; name: string; slug: string; count: number; parent: number }> }>;
}
