'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Minus, Plus, ShoppingBag, Truck, RotateCcw, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get(`/products/${slug}`)
      .then((res) => {
        setProduct(res.data.data);
        setSelectedImage(0);
      })
      .catch(() => {
        toast.error('Product not found');
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await api.post('/cart/items', { productId: product.id, quantity });
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    await addToCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 animate-pulse">
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif font-bold text-gray-900">Product not found</h1>
        <Link href="/shop" className="mt-4 inline-block text-jungle-600 hover:underline">
          ← Back to shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ url: 'https://placehold.co/800x800/2F6B52/FFFFFF?text=Rexus', altText: product.name }];
  const inStock = product.stock > 0 && product.status === 'ACTIVE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-jungle-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-jungle-600">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
            <Image
              src={images[selectedImage]?.url}
              alt={images[selectedImage]?.altText || product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            {product.discountPercentage && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{product.discountPercentage}%
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === i ? 'border-jungle-500' : 'border-transparent'
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">{product.name}</h1>

          {product.reviewCount > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              ★ {product.averageRating?.toFixed(1) || '—'} · {product.reviewCount} reviews
            </p>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-jungle-600">{formatKES(product.sellingPrice)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.sellingPrice && (
              <span className="text-lg text-gray-400 line-through">{formatKES(product.compareAtPrice)}</span>
            )}
          </div>

          <p className="mt-2 text-sm">
            {inStock ? (
              <span className="text-jungle-600 font-medium">In stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-600 font-medium">Out of stock</span>
            )}
          </p>

          {product.shortDescription && (
            <p className="mt-4 text-gray-600 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Quantity + actions */}
          {inStock && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:bg-gray-50"
                    aria-label="Decrease"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="p-2 hover:bg-gray-50"
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
                  className="flex-1 flex items-center justify-center gap-2 bg-jungle-500 hover:bg-jungle-600 text-white font-semibold py-3.5 rounded-full transition disabled:opacity-60"
                >
                  <ShoppingBag size={18} />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={buyNow}
                  disabled={adding}
                  className="flex-1 flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-jungle-900 font-semibold py-3.5 rounded-full transition disabled:opacity-60"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => toast.info('Wishlist coming soon')}
                  className="p-3.5 border border-gray-200 rounded-full hover:bg-gray-50"
                  aria-label="Wishlist"
                >
                  <Heart size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm text-gray-600">
            {product.sku && <p><span className="text-gray-400">SKU:</span> {product.sku}</p>}
            {product.brand && <p><span className="text-gray-400">Brand:</span> {product.brand.name}</p>}
            {product.categories?.[0] && (
              <p><span className="text-gray-400">Category:</span> {product.categories[0].name}</p>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Truck size={18} className="text-jungle-500" />
              <span>Delivery across Kenya</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <RotateCcw size={18} className="text-jungle-500" />
              <span>Easy returns</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Shield size={18} className="text-jungle-500" />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-14 max-w-3xl">
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Description</h2>
          <div className="prose prose-gray text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        </div>
      )}
    </div>
  );
}
