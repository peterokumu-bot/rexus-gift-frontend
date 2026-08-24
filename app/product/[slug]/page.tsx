'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Minus, Plus, ShoppingBag, Truck, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { addToCart as addToCartApi } from '@/lib/cart';
import { HandwrittenPreview } from '@/components/product/HandwrittenPreview';
import { formatKES } from '@/lib/utils';

function parseDims(dim?: string | null) {
  if (!dim) return { physical: '', colors: [] as string[], sizes: [] as string[] };
  const colors: string[] = [];
  const sizes: string[] = [];
  let physical = dim;
  dim.split('|').forEach((part) => {
    const p = part.trim();
    if (p.toLowerCase().startsWith('colors:')) {
      colors.push(...p.slice(7).split(',').map((c) => c.trim()).filter(Boolean));
      physical = physical.replace(part, '');
    } else if (p.toLowerCase().startsWith('sizes:')) {
      sizes.push(...p.slice(6).split(',').map((c) => c.trim()).filter(Boolean));
      physical = physical.replace(part, '');
    }
  });
  return {
    physical: physical.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim(),
    colors,
    sizes,
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loveMessage, setLoveMessage] = useState('');
  const [paperColor, setPaperColor] = useState<'yellow' | 'pink'>('yellow');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get(`/products/${slug}`)
      .then((res) => {
        const p = res.data.data;
        setProduct(p);
        setSelectedImage(0);
        const dims = (p.dimensions || '') as string;
        const colors: string[] = [];
        const sizes: string[] = [];
        dims.split('|').map((x: string) => x.trim()).forEach((part: string) => {
          if (part.toLowerCase().startsWith('colors:')) {
            colors.push(...part.slice(7).split(',').map((c: string) => c.trim()).filter(Boolean));
          } else if (part.toLowerCase().startsWith('sizes:')) {
            sizes.push(...part.slice(6).split(',').map((c: string) => c.trim()).filter(Boolean));
          }
        });
        setSelectedColor(colors[0] || null);
        setSelectedSize(sizes[0] || null);
      })
      .catch(() => {
        toast.error('Product not found');
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const isPersonalizedProduct = Boolean(
    product?.isPersonalized ||
      /personaliz/i.test(product?.name || '') ||
      /personaliz/i.test(product?.slug || '') ||
      /handwrit/i.test(product?.name || ''),
  );

  const addToCart = async () => {
    if (!product) return;
    if (parsed.colors.length > 0 && !selectedColor) {
      toast.error('Please select a colour');
      return;
    }
    if (parsed.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (isPersonalizedProduct) {
      if (!loveMessage.trim()) {
        toast.error('Please write your personalized message');
        return;
      }
      if (loveMessage.trim().length > 1200) {
        toast.error('Message is too long (max 1200 characters)');
        return;
      }
    }
    setAdding(true);
    try {
      const msg = loveMessage.trim();
      await addToCartApi(product.id, quantity, {
        selectedColor,
        selectedSize,
        personalizationMessage: isPersonalizedProduct ? msg : undefined,
        paperColor: isPersonalizedProduct ? paperColor : undefined,
      });
      toast.success('Added to cart');
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
      return false;
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    const ok = await addToCart();
    if (ok) router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-6 bg-gray-100 rounded w-1/4" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <Link href="/shop" className="mt-4 inline-block text-[#2F6B52] hover:underline">
          ← Back to shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ url: 'https://placehold.co/800x800/2F6B52/FFFFFF?text=Rexus', altText: product.name }];
  const inStock = product.stock > 0 && product.status === 'ACTIVE';
  const parsed = parseDims(product.dimensions);

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <nav className="text-xs sm:text-sm text-gray-500 mb-5">
          <Link href="/" className="hover:text-[#2F6B52]">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/shop" className="hover:text-[#2F6B52]">Shop</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-900 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[selectedImage]?.url}
                alt={images[selectedImage]?.altText || product.name}
                className="w-full h-full object-cover"
              />
              {product.discountPercentage ? (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  -{product.discountPercentage}%
                </span>
              ) : null}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      selectedImage === i ? 'border-[#2F6B52]' : 'border-transparent'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 leading-tight">
              {product.name}
            </h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#2F6B52]">
                {formatKES(product.sellingPrice)}
              </span>
              {product.compareAtPrice > product.sellingPrice && (
                <span className="text-base text-gray-400 line-through">
                  {formatKES(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm">
              {inStock ? (
                <span className="text-[#2F6B52] font-medium">In stock ({product.stock} available)</span>
              ) : (
                <span className="text-red-600 font-medium">Out of stock</span>
              )}
            </p>

            {product.shortDescription && (
              <p className="mt-4 text-gray-600 text-sm sm:text-base leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Colors */}
            {parsed.colors.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-800 mb-2">
                  Colour{selectedColor ? `: ${selectedColor}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {parsed.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition ${
                        selectedColor === c
                          ? 'border-[#2F6B52] bg-[#2F6B52]/10 text-[#2F6B52] font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {parsed.sizes.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium text-gray-800 mb-2">
                  Size{selectedSize ? `: ${selectedSize}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {parsed.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[2.75rem] px-3 py-1.5 rounded-lg text-xs sm:text-sm border transition ${
                        selectedSize === s
                          ? 'border-[#2F6B52] bg-[#2F6B52]/10 text-[#2F6B52] font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* Personalized handwritten message */}
            {isPersonalizedProduct && (
              <div className="mt-6 space-y-4 border border-[#2F6B52]/20 rounded-2xl p-4 bg-[#2F6B52]/[0.03]">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Your handwritten message</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    We&apos;ll print this to look like real handwriting on coloured paper.
                  </p>
                </div>
                <textarea
                  value={loveMessage}
                  onChange={(e) => setLoveMessage(e.target.value)}
                  rows={5}
                  maxLength={1200}
                  placeholder={"Dear love,\n\nMy heart misses you...\n\nLove always,"}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/30"
                />
                <p className="text-[11px] text-gray-400 text-right">{loveMessage.length}/1200</p>

                <div>
                  <p className="text-sm font-medium text-gray-800 mb-2">Paper colour</p>
                  <div className="flex gap-3">
                    {([
                      { id: 'yellow' as const, label: 'Yellow notepad', swatch: '#fff9c4' },
                      { id: 'pink' as const, label: 'Pink letter', swatch: '#fce4ec' },
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaperColor(opt.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
                          paperColor === opt.id
                            ? 'border-[#2F6B52] bg-[#2F6B52]/10 text-[#2F6B52] font-medium'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ background: opt.swatch }}
                        />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Preview</p>
                  <HandwrittenPreview message={loveMessage} paperColor={paperColor} />
                </div>
              </div>
            )}

            {/* Labels / meta */}
            <div className="mt-5 flex flex-wrap gap-2">
              {product.categories?.map((c: any) => (
                <span key={c.id || c.name} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {c.name}
                </span>
              ))}
              {product.sku && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-mono">
                  SKU {product.sku}
                </span>
              )}
              {parsed.physical && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {parsed.physical}
                </span>
              )}
              {product.weight != null && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {product.weight} kg
                </span>
              )}
            </div>

            {inStock && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Quantity</span>
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2.5 hover:bg-gray-50"
                      aria-label="Decrease"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-medium text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="p-2.5 hover:bg-gray-50"
                      aria-label="Increase"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={addToCart}
                    disabled={adding}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#2F6B52] hover:bg-[#275a45] text-white font-semibold py-3.5 rounded-full transition disabled:opacity-60"
                  >
                    <ShoppingBag size={18} />
                    {adding ? 'Adding…' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={buyNow}
                    disabled={adding}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#C4A227] hover:bg-[#d4b84a] text-[#1a3b2e] font-semibold py-3.5 rounded-full transition disabled:opacity-60"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        if (!localStorage.getItem('accessToken')) {
                          toast.error('Sign in to save wishlist');
                          return;
                        }
                        await api.post('/wishlist', { productId: product.id });
                        toast.success('Saved to wishlist');
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Could not save');
                      }
                    }}
                    className="p-3.5 border border-gray-200 rounded-full hover:bg-gray-50 self-center"
                    aria-label="Wishlist"
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[#2F6B52]" />
                Delivery across Kenya
              </div>
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#2F6B52]" />
                Secure checkout
              </div>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="mt-12 max-w-3xl border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Product details</h2>
            <div className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
