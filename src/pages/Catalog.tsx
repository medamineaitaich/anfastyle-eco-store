import React, { useEffect, useState } from 'react';
import { ProductCard } from '../components/ui/ProductCard';
import { Product } from '../types';
import { fetchProducts } from '../services/api';

interface CatalogProps {
  onSelectProduct: (product: Product) => void;
  products?: Product[];
}

export const Catalog = ({ onSelectProduct, products }: CatalogProps) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products ?? []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchProducts({ per_page: 12, page: 1 });
        const items = Array.isArray(data) ? data : data?.products;

        if (Array.isArray(items)) {
          const mapped: Product[] = items.map((p: any) => ({
            id: String(p.id),
            name: String(p.name ?? ''),
            price: Number(p.price ?? 0),
            image: String(p.image ?? p.images?.[0]?.src ?? 'https://picsum.photos/seed/placeholder/600/800'),
            category: String(p.category ?? p.categories?.[0]?.name ?? 'Uncategorized'),
            description: String(p.description ?? p.short_description ?? ''),
            colors: p.colors,
            sizes: p.sizes,
          }));

          setCatalogProducts(mapped);
        } else {
          setCatalogProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch catalog products:', err);
        setError('Failed to load products.');
        setCatalogProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);
  
  // Extract unique categories from products, plus 'All'
  const categories = ['All', ...Array.from(new Set(catalogProducts.map(p => p.category)))];

  const filteredProducts = activeCategory === 'All' 
    ? catalogProducts 
    : catalogProducts.filter(p => p.category === activeCategory);

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
        {isLoading ? (
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

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-primary/40 italic">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};
