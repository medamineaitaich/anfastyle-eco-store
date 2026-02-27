import React, { useEffect, useState } from 'react';
import { ProductCard } from '../components/ui/ProductCard';
import { Product } from '../types';
import { fetchStoreProducts } from '../services/api';

interface CatalogProps {
  onSelectProduct: (product: Product) => void;
}

export const Catalog = ({ onSelectProduct }: CatalogProps) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchStoreProducts({
          page,
          per_page: 12,
          search: search || undefined,
        });

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
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [page, search]);
  
  // Extract unique categories from products, plus 'All'
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

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

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${
                activeCategory === cat 
                  ? 'bg-primary text-cream shadow-lg' 
                  : 'bg-white text-primary/60 hover:bg-primary/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-primary/60">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-primary/40 italic">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};
