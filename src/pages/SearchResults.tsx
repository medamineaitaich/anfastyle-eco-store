import React from 'react';
import { Search } from 'lucide-react';
import { ProductCard } from '../components/ui/ProductCard';
import { Product } from '../types';

interface SearchResultsProps {
  results: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchResults = ({ results, onSelectProduct }: SearchResultsProps) => (
  <div className="py-20 bg-cream min-h-screen">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-serif mb-12">Search Results ({results.length})</h1>
      {results.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
          <Search size={48} className="mx-auto mb-6 text-primary/10" />
          <p className="text-primary/40">No products found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} onSelect={() => onSelectProduct(product)} />
          ))}
        </div>
      )}
    </div>
  </div>
);
