import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Heart } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Product } from '../types';
import { fetchStoreProduct } from '../services/api';

interface ProductDetailProps {
  product?: Product;
  onBack: () => void;
  onAddToCart: (p: Product, color: string, size: string) => void;
  onAddToWishlist: (p: Product) => void;
}

export const ProductDetail = ({ product: initialProduct, onBack, onAddToCart, onAddToWishlist }: ProductDetailProps) => {
  const { id, productId } = useParams<{ id?: string; productId?: string }>();
  const productIdFromRoute = id ?? productId ?? initialProduct?.id;
  const [product, setProduct] = useState<any>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      if (!productIdFromRoute) {
        if (mounted) {
          setError('Product ID not found in route.');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await fetchStoreProduct(productIdFromRoute);
        if (!mounted) return;
        setProduct(data.product);
        setVariations(data.variations || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load product.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      mounted = false;
    };
  }, [productIdFromRoute]);

  const normalize = (value: string) => value.trim().toLowerCase();
  const getVariationAttribute = (variation: any, targetSlug: 'colors' | 'sizes') => {
    const attr = (variation?.attributes || []).find(
      (a: any) => String(a?.slug || '').toLowerCase() === targetSlug
    );
    return String(attr?.option || '').trim();
  };

  const isVariableProduct = product?.type === 'variable' && variations.length > 0;

  const availableColors = useMemo(() => {
    if (!isVariableProduct) return [];
    return Array.from(
      new Set(
        variations
          .map((v: any) => getVariationAttribute(v, 'colors'))
          .filter(Boolean)
      )
    );
  }, [isVariableProduct, variations]);

  const availableSizes = useMemo(() => {
    if (!isVariableProduct) return [];
    return Array.from(
      new Set(
        variations
          .map((v: any) => getVariationAttribute(v, 'sizes'))
          .filter(Boolean)
      )
    );
  }, [isVariableProduct, variations]);

  const availableSizesForColor = useMemo(() => {
    if (!isVariableProduct || !selectedColor) return availableSizes;
    const targetColor = normalize(selectedColor);
    return Array.from(
      new Set(
        variations
          .filter((v: any) => normalize(getVariationAttribute(v, 'colors')) === targetColor)
          .map((v: any) => getVariationAttribute(v, 'sizes'))
          .filter(Boolean)
      )
    );
  }, [availableSizes, isVariableProduct, selectedColor, variations]);

  const getSelectedVariation = () => {
    if (!isVariableProduct) return null;
    if (availableColors.length > 0 && !selectedColor) return null;
    if (availableSizes.length > 0 && !selectedSize) return null;

    const targetColor = normalize(selectedColor);
    const targetSize = normalize(selectedSize);

    return (
      variations.find((v: any) => {
        const variationColor = normalize(getVariationAttribute(v, 'colors'));
        const variationSize = normalize(getVariationAttribute(v, 'sizes'));
        const colorMatches = availableColors.length === 0 || variationColor === targetColor;
        const sizeMatches = availableSizes.length === 0 || variationSize === targetSize;
        return colorMatches && sizeMatches;
      }) || null
    );
  };

  useEffect(() => {
    if (!isVariableProduct) return;

    const firstValid = variations.find((v: any) => {
      const hasColor = availableColors.length === 0 || Boolean(getVariationAttribute(v, 'colors'));
      const hasSize = availableSizes.length === 0 || Boolean(getVariationAttribute(v, 'sizes'));
      return hasColor && hasSize;
    });

    if (!selectedColor && availableColors.length > 0) {
      const nextColor = firstValid ? getVariationAttribute(firstValid, 'colors') : availableColors[0];
      if (nextColor) setSelectedColor(nextColor);
    }

    const validSizes = selectedColor ? availableSizesForColor : availableSizes;
    const sizeStillValid = validSizes.some((size) => normalize(size) === normalize(selectedSize));

    if (validSizes.length > 0 && (!selectedSize || !sizeStillValid)) {
      setSelectedSize(validSizes[0]);
    }
  }, [
    availableColors,
    availableSizes,
    availableSizesForColor,
    isVariableProduct,
    selectedColor,
    selectedSize,
    variations,
  ]);

  const selectedVariation = getSelectedVariation();
  const displayPrice = selectedVariation
    ? (selectedVariation.price ?? selectedVariation.regular_price ?? product?.price ?? product?.regular_price)
    : (product?.on_sale ? product?.sale_price : (product?.price ?? product?.regular_price));
  const displayImage =
    selectedVariation?.image?.src ??
    selectedVariation?.image?.thumbnail ??
    product?.images?.[0]?.src ??
    product?.images?.[0]?.thumbnail ??
    '';
  const isOutOfStock = isVariableProduct && selectedVariation?.stock_status !== 'instock';
  const addToCartDisabled = isVariableProduct && (!selectedColor || !selectedSize || !selectedVariation || isOutOfStock);

  const cartProduct = useMemo<Product>(() => {
    return {
      id: String(product?.id ?? ''),
      name: product?.name ?? '',
      price: Number(displayPrice ?? product?.price ?? product?.regular_price ?? 0),
      image: displayImage ?? '',
      category: product?.categories?.[0]?.name ?? '',
      description: String(product?.short_description ?? '')
    };
  }, [displayImage, displayPrice, product]);

  if (loading) {
    return <div className="py-20 bg-cream min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="py-20 bg-cream min-h-screen">{error}</div>;
  }

  if (!product) {
    return <div className="py-20 bg-cream min-h-screen">Product not found.</div>;
  }

  return (
    <div className="py-20 bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center text-sm font-bold uppercase tracking-widest text-primary/50 hover:text-primary mb-12 transition-colors"
        >
          <ChevronRight size={18} className="rotate-180 mr-2" />
          Back to Catalog
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-white shadow-xl">
            <img 
              src={displayImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">{product.categories?.[0]?.name}</p>
              <h1 className="text-4xl md:text-5xl font-serif mb-4">{product.name}</h1>
              <p className="text-2xl text-primary">${displayPrice}</p>
            </div>

            <div
              className="text-primary/70 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.short_description || '' }}
            />

            {isVariableProduct && (
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-widest text-primary/50">Choose options</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Color</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        setSelectedSize('');
                      }}
                      className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 text-primary"
                    >
                      <option value="">Select color</option>
                      {availableColors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Size</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 text-primary"
                    >
                      <option value="">Select size</option>
                      {availableSizesForColor.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedColor && selectedSize && isOutOfStock && (
                  <p className="text-xs text-red-600">Out of stock</p>
                )}
              </div>
            )}

            {!isVariableProduct && product.colors && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/50">Color</p>
                <div className="flex gap-3">
                  {product.colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-primary scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {!isVariableProduct && product.sizes && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/50">Size</p>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        selectedSize === size 
                          ? 'border-primary bg-primary text-cream' 
                          : 'border-primary/10 hover:border-primary/30'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8 space-y-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => onAddToCart(cartProduct, selectedColor, selectedSize)}
                  disabled={addToCartDisabled}
                  className="flex-grow bg-primary text-cream py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={() => {
                    onAddToWishlist(cartProduct);
                    setWishlistMessage('Added to wishlist!');
                    setTimeout(() => setWishlistMessage(''), 2000);
                  }}
                  className="px-6 bg-white text-primary border border-primary/10 rounded-2xl hover:bg-cream transition-all relative"
                >
                  <Heart size={24} className={wishlistMessage ? 'fill-secondary text-secondary' : ''} />
                  {wishlistMessage && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-cream text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      {wishlistMessage}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-primary/40">
                Free shipping on orders over $75. 30-day easy returns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
