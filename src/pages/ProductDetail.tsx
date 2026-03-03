import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Heart, Star, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Product } from '../types';
import { fetchStoreProduct, fetchStoreProducts, mapStoreListItemToProduct } from '../services/api';
import { ProductCard } from '../components/ui/ProductCard';
import { Newsletter } from '../components/ui/Newsletter';
import { sanitizeHtml, splitDescriptionBlocks, toPlainText } from '../utils/html';
import { isProbablyColorAttribute, resolveColorToHex } from '../utils/resolveColorToHex';

interface ProductDetailProps {
  product?: Product;
  onBack: () => void;
  onAddToCart: (p: Product, color: string, size: string) => void;
  onToggleWishlist: (p: Product) => Promise<boolean>;
  isWishlisted: (productId: string | number) => boolean;
}

interface GalleryImage {
  src: string;
  alt: string;
}

const SIZE_ATTR_KEYS = ['size', 'sizes', 'pa_size', 'attribute_pa_size'];

function normalize(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value: unknown): string {
  return toNumber(value).toFixed(2);
}

function getAttributeKey(attribute: any): string {
  return normalize(attribute?.slug || attribute?.name || attribute?.key || '');
}

function isColorAttribute(attribute: any): boolean {
  return isProbablyColorAttribute(getAttributeKey(attribute));
}

function isSizeAttribute(attribute: any): boolean {
  const key = getAttributeKey(attribute);
  return SIZE_ATTR_KEYS.some((candidate) => key.includes(candidate));
}

function getVariationOption(variation: any, target: 'color' | 'size'): string {
  const attrs = Array.isArray(variation?.attributes) ? variation.attributes : [];
  const matcher = target === 'color' ? isColorAttribute : isSizeAttribute;
  const found = attrs.find((attr) => matcher(attr));
  return String(found?.option || '').trim();
}

function isVariationAvailable(variation: any): boolean {
  const stockStatus = normalize(variation?.stock_status || '');
  if (!stockStatus || stockStatus === 'instock') return true;
  if (stockStatus === 'outofstock') return false;
  const stockQuantity = Number(variation?.stock_quantity);
  return !Number.isFinite(stockQuantity) || stockQuantity > 0;
}

function stockLabel(status: string): string {
  if (status === 'instock') return 'In stock';
  if (status === 'outofstock') return 'Out of stock';
  if (status === 'onbackorder') return 'Backorder';
  return 'Availability unknown';
}

export const ProductDetail = ({ product: initialProduct, onBack, onAddToCart, onToggleWishlist, isWishlisted }: ProductDetailProps) => {
  const { id, productId } = useParams<{ id?: string; productId?: string }>();
  const productIdFromRoute = id ?? productId ?? initialProduct?.id;
  const [product, setProduct] = useState<any>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [descriptionQuery, setDescriptionQuery] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  const mainImageButtonRef = useRef<HTMLButtonElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);
  const hadLightboxOpenRef = useRef(false);

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
        setVariations(Array.isArray(data.variations) ? data.variations : []);
        setSelectedColor('');
        setSelectedSize('');
        setSelectionError('');
        setActiveImageIndex(0);
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

  const isVariableProduct = product?.type === 'variable' && variations.length > 0;

  const availableColors = useMemo(() => {
    if (!isVariableProduct) return [];
    return Array.from(
      new Set(
        variations
          .map((variation) => getVariationOption(variation, 'color'))
          .filter(Boolean),
      ),
    );
  }, [isVariableProduct, variations]);

  const availableSizes = useMemo(() => {
    if (!isVariableProduct) return [];
    return Array.from(
      new Set(
        variations
          .map((variation) => getVariationOption(variation, 'size'))
          .filter(Boolean),
      ),
    );
  }, [isVariableProduct, variations]);

  const requiresColor = availableColors.length > 0;
  const requiresSize = availableSizes.length > 0;
  const selectionComplete = (!requiresColor || Boolean(selectedColor)) && (!requiresSize || Boolean(selectedSize));

  const selectedVariation = useMemo(() => {
    if (!isVariableProduct || !selectionComplete) return null;
    const colorTarget = normalize(selectedColor);
    const sizeTarget = normalize(selectedSize);

    return (
      variations.find((variation) => {
        const variationColor = normalize(getVariationOption(variation, 'color'));
        const variationSize = normalize(getVariationOption(variation, 'size'));
        const colorMatches = !requiresColor || variationColor === colorTarget;
        const sizeMatches = !requiresSize || variationSize === sizeTarget;
        return colorMatches && sizeMatches;
      }) || null
    );
  }, [isVariableProduct, variations, selectionComplete, selectedColor, selectedSize, requiresColor, requiresSize]);

  const canChooseColor = (color: string): boolean => {
    return variations.some((variation) => {
      const variationColor = normalize(getVariationOption(variation, 'color'));
      const variationSize = normalize(getVariationOption(variation, 'size'));
      if (variationColor !== normalize(color)) return false;
      if (selectedSize && variationSize !== normalize(selectedSize)) return false;
      return isVariationAvailable(variation);
    });
  };

  const canChooseSize = (size: string): boolean => {
    return variations.some((variation) => {
      const variationColor = normalize(getVariationOption(variation, 'color'));
      const variationSize = normalize(getVariationOption(variation, 'size'));
      if (variationSize !== normalize(size)) return false;
      if (selectedColor && variationColor !== normalize(selectedColor)) return false;
      return isVariationAvailable(variation);
    });
  };

  const selectedVariationImage = selectedVariation?.image?.src || selectedVariation?.image?.thumbnail || '';
  const galleryImages = useMemo<GalleryImage[]>(() => {
    const images = new Map<string, GalleryImage>();

    if (selectedVariationImage) {
      images.set(selectedVariationImage, {
        src: selectedVariationImage,
        alt: String(product?.name || 'Product image'),
      });
    }

    (product?.images || []).forEach((img: any) => {
      const src = String(img?.src || img?.thumbnail || '').trim();
      if (!src || images.has(src)) return;
      images.set(src, {
        src,
        alt: String(img?.alt || product?.name || 'Product image'),
      });
    });

    if (images.size === 0) {
      images.set('https://picsum.photos/seed/placeholder/800/1000', {
        src: 'https://picsum.photos/seed/placeholder/800/1000',
        alt: String(product?.name || 'Product image'),
      });
    }

    return Array.from(images.values());
  }, [product, selectedVariationImage]);

  useEffect(() => {
    if (galleryImages.length === 0) {
      setActiveImageIndex(0);
      return;
    }
    if (activeImageIndex >= galleryImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, galleryImages.length]);

  useEffect(() => {
    if (!selectedVariationImage) return;
    const index = galleryImages.findIndex((image) => image.src === selectedVariationImage);
    if (index >= 0) {
      setActiveImageIndex(index);
    }
  }, [galleryImages, selectedVariationImage]);

  useEffect(() => {
    if (!product?.id) return;

    let mounted = true;
    const loadSimilar = async () => {
      const currentId = String(product.id);
      const categoryIds: number[] = (product?.categories || [])
        .map((category: any) => Number(category?.id))
        .filter((categoryId: number) => Number.isFinite(categoryId) && categoryId > 0);

      if (categoryIds.length === 0) {
        setSimilarProducts([]);
        return;
      }

      setSimilarLoading(true);
      try {
        const bucket = new Map<string, Product>();
        for (const categoryId of categoryIds) {
          const data = await fetchStoreProducts({
            category: categoryId,
            per_page: 8,
            page: 1,
          });
          for (const item of data.items || []) {
            const mapped = mapStoreListItemToProduct(item);
            if (mapped.id === currentId) continue;
            if (!bucket.has(mapped.id)) {
              bucket.set(mapped.id, mapped);
            }
            if (bucket.size >= 8) break;
          }
          if (bucket.size >= 8) break;
        }

        if (!mounted) return;
        setSimilarProducts(Array.from(bucket.values()).slice(0, 8));
      } catch {
        if (!mounted) return;
        setSimilarProducts([]);
      } finally {
        if (mounted) setSimilarLoading(false);
      }
    };

    loadSimilar();
    return () => {
      mounted = false;
    };
  }, [product?.categories, product?.id]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [galleryImages.length, isLightboxOpen]);

  useEffect(() => {
    if (isLightboxOpen) {
      hadLightboxOpenRef.current = true;
      lightboxCloseRef.current?.focus();
      return;
    }

    if (hadLightboxOpenRef.current) {
      mainImageButtonRef.current?.focus();
      hadLightboxOpenRef.current = false;
    }
  }, [isLightboxOpen]);

  const sanitizedShortDescription = useMemo(
    () => sanitizeHtml(String(product?.short_description || '')),
    [product?.short_description],
  );

  const sanitizedDescription = useMemo(
    () => sanitizeHtml(String(product?.description || '')),
    [product?.description],
  );

  const descriptionText = useMemo(
    () => toPlainText(sanitizedDescription),
    [sanitizedDescription],
  );

  const descriptionBlocks = useMemo(
    () => splitDescriptionBlocks(sanitizedDescription),
    [sanitizedDescription],
  );

  const filteredDescriptionBlocks = useMemo(() => {
    const query = normalize(descriptionQuery);
    if (!query) return descriptionBlocks;
    return descriptionBlocks.filter((block) => normalize(block.text).includes(query));
  }, [descriptionBlocks, descriptionQuery]);

  const isLongDescription = descriptionText.length > 1200;
  const hasDescriptionQuery = Boolean(descriptionQuery.trim());

  const displayPrice = useMemo(() => {
    if (selectedVariation) {
      return selectedVariation.price ?? selectedVariation.regular_price ?? product?.price ?? product?.regular_price ?? 0;
    }
    return product?.on_sale ? product?.sale_price : (product?.price ?? product?.regular_price ?? 0);
  }, [selectedVariation, product]);

  const effectiveStockStatus = normalize(selectedVariation?.stock_status || product?.stock_status || '');
  const isSelectionMissing = isVariableProduct && !selectionComplete;
  const addToCartDisabled =
    effectiveStockStatus === 'outofstock' ||
    (isVariableProduct && selectionComplete && (!selectedVariation || !isVariationAvailable(selectedVariation)));

  const cartProduct = useMemo<Product>(() => {
    return {
      id: String(product?.id ?? ''),
      name: String(product?.name || ''),
      price: toNumber(displayPrice),
      image: galleryImages[activeImageIndex]?.src || '',
      variationId: isVariableProduct ? selectedVariation?.id : undefined,
      attributes: {
        color: selectedColor || undefined,
        size: selectedSize || undefined,
      },
      category: String(product?.categories?.[0]?.name || ''),
      description: toPlainText(sanitizedShortDescription),
    };
  }, [
    activeImageIndex,
    displayPrice,
    galleryImages,
    isVariableProduct,
    product?.categories,
    product?.id,
    product?.name,
    sanitizedShortDescription,
    selectedColor,
    selectedSize,
    selectedVariation?.id,
  ]);

  if (loading) {
    return <div className="py-20 bg-cream min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="py-20 bg-cream min-h-screen">{error}</div>;
  }

  if (!product) {
    return <div className="py-20 bg-cream min-h-screen">Product not found.</div>;
  }

  const currentImage = galleryImages[activeImageIndex];

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
          <div className="space-y-4">
            <button
              ref={mainImageButtonRef}
              type="button"
              onClick={() => {
                setLightboxIndex(activeImageIndex);
                setIsLightboxOpen(true);
              }}
              className="w-full aspect-[3/4] overflow-hidden rounded-3xl bg-white shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Open image gallery"
            >
              <img
                src={currentImage?.src}
                alt={currentImage?.alt || product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${index === activeImageIndex ? 'border-primary shadow-md' : 'border-primary/10 hover:border-primary/40'}`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image.src} alt={image.alt || product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">{product.categories?.[0]?.name}</p>
              <h1 className="text-4xl md:text-5xl font-serif mb-4">{product.name}</h1>
              <p className="text-2xl text-primary mb-4">${formatPrice(displayPrice)}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-primary/70">
                <span className={`font-medium ${effectiveStockStatus === 'instock' ? 'text-green-700' : 'text-red-600'}`}>
                  {stockLabel(effectiveStockStatus)}
                </span>
                {toNumber(product?.average_rating) > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {toNumber(product?.average_rating).toFixed(1)}
                    <span className="text-primary/50">({toNumber(product?.rating_count)})</span>
                  </span>
                )}
              </div>
            </div>

            {sanitizedShortDescription && (
              <div
                className="text-primary/70 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizedShortDescription }}
              />
            )}

            {isVariableProduct && (
              <div className="space-y-5 rounded-2xl border border-primary/10 bg-white p-6">
                <p className="text-sm font-bold uppercase tracking-widest text-primary/60">Choose options</p>

                {availableColors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/50">Color</p>
                    <div className="flex flex-wrap gap-3">
                      {availableColors.map((colorOption, index) => {
                        const selected = normalize(selectedColor) === normalize(colorOption);
                        const isDisabled = !canChooseColor(colorOption);
                        const swatchHex = resolveColorToHex(colorOption);

                        if (!swatchHex) {
                          return (
                            <button
                              key={`${colorOption}-${index}`}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                setSelectedColor(colorOption);
                                setSelectionError('');
                              }}
                              className={`px-4 py-2 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-primary bg-primary text-cream' : 'border-primary/20 bg-white hover:border-primary/50'}`}
                              aria-label={`Color: ${String(colorOption || '').toUpperCase()}`}
                              title={colorOption}
                            >
                              {colorOption}
                            </button>
                          );
                        }

                        return (
                          <div key={`${colorOption}-${index}`} className="w-16 flex flex-col items-center gap-1">
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                setSelectedColor(colorOption);
                                setSelectionError('');
                              }}
                              className={`w-10 h-10 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-primary ring-2 ring-primary/40 ring-offset-2 shadow-md' : 'border-primary/20 hover:border-primary/50'}`}
                              style={{ backgroundColor: swatchHex }}
                              aria-label={`Color: ${String(colorOption || '').toUpperCase()}`}
                              title={colorOption}
                            >
                              <span className="sr-only">{colorOption}</span>
                            </button>
                            <span className="text-[11px] text-primary/70 text-center leading-tight break-words">
                              {colorOption}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/50">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((sizeOption) => {
                        const selected = normalize(selectedSize) === normalize(sizeOption);
                        const isDisabled = !canChooseSize(sizeOption);
                        return (
                          <button
                            key={sizeOption}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              setSelectedSize(sizeOption);
                              setSelectionError('');
                            }}
                            className={`px-4 py-2 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-primary bg-primary text-cream' : 'border-primary/20 bg-white hover:border-primary/50'}`}
                            aria-label={`Select size ${sizeOption}`}
                          >
                            {sizeOption}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectionError && <p className="text-sm text-red-600">{selectionError}</p>}
                {selectionComplete && selectedVariation && !isVariationAvailable(selectedVariation) && (
                  <p className="text-sm text-red-600">Selected variation is out of stock.</p>
                )}
              </div>
            )}

            {!isVariableProduct && Array.isArray(product?.colors) && product.colors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/50">Color</p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((colorOption: string, index: number) => {
                    const selected = normalize(selectedColor) === normalize(colorOption);
                    const swatchHex = resolveColorToHex(colorOption);

                    if (!swatchHex) {
                      return (
                        <button
                          key={`${colorOption}-${index}`}
                          type="button"
                          onClick={() => setSelectedColor(colorOption)}
                          className={`px-4 py-2 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${selected ? 'border-primary bg-primary text-cream' : 'border-primary/20 bg-white hover:border-primary/50'}`}
                          title={colorOption}
                          aria-label={`Color: ${String(colorOption || '').toUpperCase()}`}
                        >
                          {colorOption}
                        </button>
                      );
                    }

                    return (
                      <div key={`${colorOption}-${index}`} className="w-16 flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedColor(colorOption)}
                          className={`w-10 h-10 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${selected ? 'border-primary ring-2 ring-primary/40 ring-offset-2 shadow-md' : 'border-primary/20 hover:border-primary/50'}`}
                          style={{ backgroundColor: swatchHex }}
                          title={colorOption}
                          aria-label={`Color: ${String(colorOption || '').toUpperCase()}`}
                        >
                          <span className="sr-only">{colorOption}</span>
                        </button>
                        <span className="text-[11px] text-primary/70 text-center leading-tight break-words">
                          {colorOption}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isVariableProduct && Array.isArray(product?.sizes) && product.sizes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/50">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sizeOption: string) => {
                    const selected = normalize(selectedSize) === normalize(sizeOption);
                    return (
                      <button
                        key={sizeOption}
                        type="button"
                        onClick={() => setSelectedSize(sizeOption)}
                        className={`px-4 py-2 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all ${selected ? 'border-primary bg-primary text-cream' : 'border-primary/20 bg-white hover:border-primary/50'}`}
                      >
                        {sizeOption}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (isSelectionMissing) {
                      const missing: string[] = [];
                      if (requiresColor && !selectedColor) missing.push('color');
                      if (requiresSize && !selectedSize) missing.push('size');
                      setSelectionError(`Please select ${missing.join(' and ')}.`);
                      return;
                    }
                    if (addToCartDisabled) {
                      setSelectionError('This product is currently unavailable.');
                      return;
                    }
                    setSelectionError('');
                    onAddToCart(cartProduct, selectedColor, selectedSize);
                  }}
                  disabled={addToCartDisabled}
                  className="flex-grow bg-primary text-cream py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const added = await onToggleWishlist(cartProduct);
                      setWishlistMessage(added ? 'Added to wishlist.' : 'Removed from wishlist.');
                    } catch (e: any) {
                      setWishlistMessage(e?.message || 'Please sign in to use wishlist.');
                    } finally {
                      setTimeout(() => setWishlistMessage(''), 2400);
                    }
                  }}
                  className="px-6 bg-white text-primary border border-primary/10 rounded-2xl hover:bg-cream transition-all relative"
                >
                  <Heart size={24} className={isWishlisted(cartProduct.id) ? 'fill-secondary text-secondary' : ''} />
                  {wishlistMessage && (
                    <span className="absolute -top-11 left-1/2 -translate-x-1/2 bg-primary text-cream text-[10px] px-2 py-1 rounded whitespace-nowrap">
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

        <section className="mt-16 bg-white rounded-3xl shadow-sm p-8 md:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-3xl font-serif">Description</h2>
            <input
              type="search"
              value={descriptionQuery}
              onChange={(e) => setDescriptionQuery(e.target.value)}
              placeholder="Search in description..."
              className="w-full md:w-72 bg-cream/50 border border-primary/10 rounded-xl px-4 py-3 text-primary"
            />
          </div>

          {!hasDescriptionQuery && (
            <div className="relative">
              <div
                className={`prose prose-sm max-w-none text-primary/80 ${isLongDescription && !isDescriptionExpanded ? 'max-h-72 overflow-hidden' : ''}`}
                dangerouslySetInnerHTML={{ __html: sanitizedDescription || '<p>No description available.</p>' }}
              />
              {isLongDescription && !isDescriptionExpanded && (
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
          )}

          {hasDescriptionQuery && (
            <div className="space-y-4">
              {filteredDescriptionBlocks.length === 0 ? (
                <p className="text-sm text-primary/60">No description sections match your search.</p>
              ) : (
                filteredDescriptionBlocks.map((block, index) => (
                  <div
                    key={`${index}-${block.text.slice(0, 16)}`}
                    className="prose prose-sm max-w-none text-primary/80"
                    dangerouslySetInnerHTML={{ __html: block.html }}
                  />
                ))
              )}
            </div>
          )}

          {isLongDescription && !hasDescriptionQuery && (
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded((value) => !value)}
              className="text-sm font-bold uppercase tracking-widest text-secondary hover:underline"
            >
              {isDescriptionExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-serif">Similar Products</h2>
          </div>

          {similarLoading ? (
            <div className="bg-white rounded-3xl p-10 text-center text-primary/60">Loading similar products...</div>
          ) : similarProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center text-primary/60">No similar products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {similarProducts.slice(0, 8).map((similarProduct) => (
                <ProductCard
                  key={similarProduct.id}
                  product={similarProduct}
                  onSelect={() => undefined}
                  onToggleWishlist={(target) => {
                    onToggleWishlist(target).catch(() => undefined);
                  }}
                  isWishlisted={isWishlisted(similarProduct.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-16">
        <Newsletter />
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 md:p-8" role="dialog" aria-modal="true" aria-label="Product image gallery">
          <div className="h-full max-w-5xl mx-auto flex flex-col">
            <div className="flex justify-end">
              <button
                ref={lightboxCloseRef}
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="text-white/90 hover:text-white p-2"
                aria-label="Close gallery"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center gap-4">
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                  className="text-white text-4xl px-3 py-2 hover:bg-white/10 rounded-lg"
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}
              <img
                src={galleryImages[lightboxIndex]?.src}
                alt={galleryImages[lightboxIndex]?.alt || product.name}
                className="max-h-[78vh] w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryImages.length)}
                  className="text-white text-4xl px-3 py-2 hover:bg-white/10 rounded-lg"
                  aria-label="Next image"
                >
                  ›
                </button>
              )}
            </div>
            <p className="text-center text-sm text-white/70 mt-4">
              {lightboxIndex + 1} / {galleryImages.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
