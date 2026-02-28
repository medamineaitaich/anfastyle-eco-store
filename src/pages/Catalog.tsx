import React, { useEffect, useState } from 'react';
import { ProductCard } from '../components/ui/ProductCard';
import { Product } from '../types';
import { fetchStoreCategories, fetchStoreProducts } from '../services/api';

interface CatalogProps {
  onSelectProduct: (product: Product) => void;
}

export const Catalog = ({ onSelectProduct }: CatalogProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string; count: number; parent: number }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchStoreCategories();
        setCategories(data.items || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchStoreProducts({
          page,
          per_page: 12,
          search: searchQuery || undefined,
          category: selectedCategoryId || undefined,
        });
        setTotalPages(Number(data.totalPages || 0));

        const mapped: Product[] = (data.items || []).map((p: any) => ({
          id: String(p.id),
          name: String(p.name ?? p.title ?? ''),
          price: Number((p.on_sale ? p.sale_price : (p.price ?? p.regular_price)) ?? 0),
          image: String(p.image?.src ?? p.images?.[0]?.src ?? 'https://picsum.photos/seed/placeholder/600/800'),
          category: String(p.categories?.[0]?.name ?? 'Uncategorized'),
          description: '',
        }));

        setProducts(mapped);
      } catch (err) {
        console.error('Failed to fetch catalog products:', err);
        setError('Failed to load products.');
        setProducts([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [page, searchQuery, selectedCategoryId]);

  return (
    <div className="py-20 bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-serif mb-6">Our Collection</h1>
          <p className="text-primary/60 max-w-2xl mx-auto">
            Explore our range of sustainably inspired apparel. Each category represents a core pillar of our commitment to the earth.
          </p>
        </div>

        {error && (
          <p className="text-center text-sm text-red-600 mb-6">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setPage(1);
            }}
            className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 text-primary"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search products..."
            className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 text-primary"
          />
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-primary/60">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-primary/40 italic">No products found.</p>
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-6 py-3 rounded-xl bg-white border border-primary/10 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-primary/60">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={totalPages !== 0 && page >= totalPages}
              className="px-6 py-3 rounded-xl bg-white border border-primary/10 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
