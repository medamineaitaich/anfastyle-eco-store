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
    return <div className="py-32 bg-cream min-h-screen grid items-center justify-center text-primary/60 tracking-widest uppercase text-sm font-bold animate-pulse">Loading Product...</div>;
  }

  if (error) {
    return <div className="py-32 bg-cream min-h-screen grid items-center justify-center text-red-700 tracking-widest uppercase text-sm font-bold">{error}</div>;
  }

  if (!product) {
    return <div className="py-32 bg-cream min-h-screen grid items-center justify-center text-primary/60 tracking-widest uppercase text-sm font-bold">Product not found.</div>;
  }

  const currentImage = galleryImages[activeImageIndex];

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 lg:pt-16">

        {/* Breadcrumb Navigation */}
        <button
          onClick={onBack}
          className="group flex items-center text-xs font-bold uppercase tracking-[0.2em] text-primary/40 hover:text-primary mb-10 transition-all duration-300"
        >
          <ChevronRight size={14} className="rotate-180 mr-3 transition-transform group-hover:-translate-x-1" />
          Back to Collection
        </button>

        <div className="flex flex-col lg:flex-row gap-12 xl:gap-24 relative items-start">

          {/* Left Column: Sticky Image Gallery */}
          <div className="w-full lg:w-[55%] lg:sticky lg:top-32 space-y-6">
            <button
              ref={mainImageButtonRef}
              type="button"
              onClick={() => {
                setLightboxIndex(activeImageIndex);
                setIsLightboxOpen(true);
              }}
              className="w-full aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-stone-100 shadow-2xl shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 relative group"
              aria-label="Open image gallery"
            >
              <img
                src={currentImage?.src}
                alt={currentImage?.alt || product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
            </button>

            {galleryImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {galleryImages.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative shrink-0 w-24 aspect-[4/5] rounded-2xl overflow-hidden transition-all duration-300 snap-center
                      ${index === activeImageIndex
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#FAF9F6]'
                        : 'opacity-60 hover:opacity-100 mix-blend-multiply'}`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image.src} alt={image.alt || product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Scrolling Product Details */}
          <div className="w-full lg:w-[45%] lg:py-6 flex flex-col min-h-full">

            {/* Header Section */}
            <div className="space-y-4 mb-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-secondary">
                {product.categories?.[0]?.name || 'Eco Collection'}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary leading-[1.1] tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-6 pt-2">
                <p className="text-3xl font-light text-primary">
                  ${formatPrice(displayPrice)}
                </p>
                <div className="h-6 w-px bg-primary/10" />
                <span className={`text-xs font-bold uppercase tracking-widest ${effectiveStockStatus === 'instock' ? 'text-secondary/80' : 'text-red-800/80'}`}>
                  {stockLabel(effectiveStockStatus)}
                </span>
              </div>
            </div>

            {/* Short Description */}
            {sanitizedShortDescription && (
              <div
                className="prose prose-stone text-primary/70 leading-relaxed mb-12 prose-p:text-lg prose-p:font-light"
                dangerouslySetInnerHTML={{ __html: sanitizedShortDescription }}
              />
            )}

            <div className="h-px w-full bg-primary/10 mb-12" />

            {/* Variations / Options */}
            {isVariableProduct && (
              <div className="space-y-10 mb-12">

                {availableColors.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">Select Color</p>
                      <p className="text-[11px] uppercase tracking-widest text-primary/40 font-medium">{selectedColor || 'None selected'}</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {availableColors.map((colorOption, index) => {
                        const selected = normalize(selectedColor) === normalize(colorOption);
                        const isDisabled = !canChooseColor(colorOption);
                        const swatchHex = resolveColorToHex(colorOption);

                        return (
                          <button
                            key={`${colorOption}-${index}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              setSelectedColor(colorOption);
                              setSelectionError('');
                            }}
                            className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-20
                              ${selected ? 'ring-1 ring-primary ring-offset-4 ring-offset-[#FAF9F6]' : 'hover:scale-110'}`}
                            title={colorOption}
                          >
                            {swatchHex ? (
                              <span
                                className="absolute inset-1 rounded-full border border-primary/5 shadow-inner"
                                style={{ backgroundColor: swatchHex }}
                              />
                            ) : (
                              <span className={`absolute inset-1 rounded-full border flex items-center justify-center text-[9px] uppercase tracking-tighter ${selected ? 'border-primary bg-primary text-white' : 'border-primary/20 bg-white text-primary/80'}`}>
                                {colorOption.slice(0, 3)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">Select Size</p>
                      <button className="text-[10px] uppercase tracking-widest text-primary/40 font-medium hover:text-secondary hover:underline underline-offset-4 transition-all">Size Guide</button>
                    </div>

                    <div className="flex flex-wrap gap-3">
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
                            className={`min-w-[3.5rem] px-5 py-3 rounded-2xl border text-sm font-medium uppercase tracking-widest transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30
                              ${selected
                                ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20'
                                : 'border-primary/10 bg-white/50 hover:border-primary/30 text-primary/80 hover:bg-white hover:shadow-sm'}`}
                          >
                            {sizeOption}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error Messages */}
                <div className="min-h-[1.5rem] flex items-center">
                  {selectionError && <p className="text-[11px] uppercase tracking-widest font-bold text-red-800">{selectionError}</p>}
                  {selectionComplete && selectedVariation && !isVariationAvailable(selectedVariation) && (
                    <p className="text-[11px] uppercase tracking-widest font-bold text-red-800">Variation out of stock</p>
                  )}
                </div>
              </div>
            )}

            {/* Simple Product Fallback Swatches */}
            {!isVariableProduct && Array.isArray(product?.colors) && product.colors.length > 0 && (
              <div className="space-y-4 mb-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">Available Colors</p>
                <div className="flex flex-wrap gap-4">
                  {product.colors.map((colorOption: string, index: number) => {
                    const selected = normalize(selectedColor) === normalize(colorOption);
                    const swatchHex = resolveColorToHex(colorOption);

                    return (
                      <button
                        key={`${colorOption}-${index}`}
                        type="button"
                        onClick={() => setSelectedColor(colorOption)}
                        className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 
                            ${selected ? 'ring-1 ring-primary ring-offset-4 ring-offset-[#FAF9F6]' : 'hover:scale-110'}`}
                        title={colorOption}
                      >
                        {swatchHex ? (
                          <span className="absolute inset-1 rounded-full border border-primary/5 shadow-inner" style={{ backgroundColor: swatchHex }} />
                        ) : (
                          <span className={`absolute inset-1 rounded-full border flex items-center justify-center text-[9px] uppercase tracking-tighter ${selected ? 'border-primary bg-primary text-white' : 'border-primary/20 bg-white text-primary/80'}`}>{colorOption.slice(0, 3)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isVariableProduct && Array.isArray(product?.sizes) && product.sizes.length > 0 && (
              <div className="space-y-4 mb-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">Available Sizes</p>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((sizeOption: string) => {
                    const selected = normalize(selectedSize) === normalize(sizeOption);
                    return (
                      <button
                        key={sizeOption}
                        type="button"
                        onClick={() => setSelectedSize(sizeOption)}
                        className={`px-5 py-3 rounded-2xl border text-sm font-medium uppercase tracking-widest transition-all duration-300
                           ${selected ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20' : 'border-primary/10 bg-white/50 hover:border-primary/30 text-primary/80 hover:bg-white'}`}
                      >
                        {sizeOption}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => {
                  if (isSelectionMissing) {
                    const missing: string[] = [];
                    if (requiresColor && !selectedColor) missing.push('color');
                    if (requiresSize && !selectedSize) missing.push('size');
                    setSelectionError(`Please select ${missing.join(' and ')}`);
                    return;
                  }
                  if (addToCartDisabled) {
                    setSelectionError('Currently unavailable');
                    return;
                  }
                  setSelectionError('');
                  onAddToCart(cartProduct, selectedColor, selectedSize);
                }}
                disabled={addToCartDisabled}
                className="flex-grow bg-primary text-white py-[1.125rem] rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all duration-500 shadow-2xl shadow-primary/20 disabled:opacity-40 disabled:hover:bg-primary disabled:shadow-none"
              >
                Add to Cart
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const added = await onToggleWishlist(cartProduct);
                    setWishlistMessage(added ? 'Saved' : 'Removed');
                  } catch (e: any) {
                    setWishlistMessage(e?.message || 'Sign in required');
                  } finally {
                    setTimeout(() => setWishlistMessage(''), 2400);
                  }
                }}
                className="w-14 h-[4.25rem] shrink-0 bg-white border border-primary/5 rounded-full flex items-center justify-center hover:bg-primary/5 hover:border-primary/20 transition-all duration-300 relative group"
                aria-label="Toggle Wishlist"
              >
                <Heart
                  size={20}
                  strokeWidth={1.5}
                  className={`transition-colors duration-300 ${isWishlisted(cartProduct.id) ? 'fill-[#A96B56] text-[#A96B56]' : 'text-primary/60 group-hover:text-primary'}`}
                />

                {wishlistMessage && (
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary/95 backdrop-blur-sm text-white text-[10px] font-medium tracking-wider uppercase px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
                    {wishlistMessage}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/95 rotate-45" />
                  </span>
                )}
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-primary/40">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary line-through opacity-80" /> Free Shipping</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary line-through opacity-80" /> 30-Day Returns</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary line-through opacity-80" /> Eco Packaging</span>
            </div>

            {/* Long Description Accordion logic visually separated */}
            {(hasDescriptionQuery || isLongDescription || sanitizedDescription) && (
              <div className="mt-16 pt-12 border-t border-primary/10">
                <div className="relative">
                  {!isDescriptionExpanded && isLongDescription && !hasDescriptionQuery && (
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6]/90 to-transparent pointer-events-none z-10 flex items-end justify-center pb-4">
                      <button
                        type="button"
                        onClick={() => setIsDescriptionExpanded(true)}
                        className="pointer-events-auto bg-white/80 backdrop-blur border border-primary/10 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 hover:text-primary hover:bg-white transition-all shadow-sm"
                      >
                        Read Full Details
                      </button>
                    </div>
                  )}

                  <div className={`prose prose-stone prose-h2:text-2xl prose-h2:font-serif prose-h2:font-normal prose-h2:mt-8 prose-p:text-primary/70 prose-p:leading-relaxed max-w-none ${!isDescriptionExpanded && isLongDescription && !hasDescriptionQuery ? 'max-h-[22rem] overflow-hidden' : ''}`}
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription || '<p>No description available.</p>' }}
                  />

                  {isDescriptionExpanded && isLongDescription && !hasDescriptionQuery && (
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded(false)}
                      className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <ChevronRight size={14} className="-rotate-90" />
                      Show Less
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Similar Products Carousel */}
        <section className="mt-32 pt-16 border-t border-primary/5">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-secondary mb-3">Keep Exploring</p>
              <h2 className="text-4xl lg:text-5xl font-serif text-primary">Discover More</h2>
            </div>
          </div>

          {similarLoading ? (
            <div className="h-64 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-primary/40 animate-pulse">Loading Curated Selection...</div>
          ) : similarProducts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-primary/40">No similar pieces found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-10">
              {similarProducts.slice(0, 4).map((similarProduct) => (
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

      <div className="mt-32">
        <Newsletter />
      </div>

      {/* Lightbox / Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-[#FAF9F6]/95 backdrop-blur-md p-4 md:p-8" role="dialog" aria-modal="true" aria-label="Product image gallery">
          <div className="h-full w-full max-w-6xl mx-auto flex flex-col relative">
            <button
              ref={lightboxCloseRef}
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-0 right-0 z-10 w-12 h-12 rounded-full bg-white shadow-xl shadow-primary/5 flex items-center justify-center text-primary hover:scale-110 transition-transform duration-300"
              aria-label="Close gallery"
            >
              <X size={20} strokeWidth={2} />
            </button>
            <div className="flex-1 flex items-center justify-center w-full h-full relative">
              {galleryImages.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                  className="absolute left-0 md:-left-8 w-12 h-12 rounded-full bg-white shadow-xl shadow-primary/5 flex items-center justify-center text-primary hover:scale-110 transition-all z-10"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
              )}

              <img
                src={galleryImages[lightboxIndex]?.src}
                alt={galleryImages[lightboxIndex]?.alt || 'Gallery image'}
                className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded-sm"
              />

              {galleryImages.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryImages.length)}
                  className="absolute right-0 md:-right-8 w-12 h-12 rounded-full bg-white shadow-xl shadow-primary/5 flex items-center justify-center text-primary hover:scale-110 transition-all z-10"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="mt-8 flex justify-center gap-3">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === lightboxIndex ? 'bg-primary w-8' : 'bg-primary/20 w-3 hover:bg-primary/40'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
