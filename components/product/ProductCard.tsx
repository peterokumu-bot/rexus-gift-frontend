'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { formatKES } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
    compareAtPrice?: number | null;
    discountPercentage?: number | null;
    images?: { url: string; altText?: string }[];
    featured?: boolean;
    stock?: number;
    tags?: { name: string; slug: string; color?: string }[];
    averageRating?: number;
    reviewCount?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0]?.url || 'https://placehold.co/400x400/228B22/FFFFFF?text=Rexus';
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post('/cart/items', { productId: product.id, quantity: 1 });
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-jungle-100 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={image}
          alt={product.images?.[0]?.altText || product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.discountPercentage && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              -{product.discountPercentage}%
            </span>
          )}
          {product.tags?.some((t) => t.slug === 'new-arrival') && (
            <span className="bg-jungle-500 text-white text-xs font-bold px-2 py-0.5 rounded">NEW</span>
          )}
          {product.tags?.some((t) => t.slug === 'bestseller') && (
            <span className="bg-gold-500 text-white text-xs font-bold px-2 py-0.5 rounded">BESTSELLER</span>
          )}
          {isLowStock && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">LOW STOCK</span>
          )}
        </div>
        <button
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            toast.info('Wishlist coming soon');
          }}
          aria-label="Add to wishlist"
        >
          <Heart size={16} className="text-gray-600" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-jungle-600 transition-colors">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-jungle-600">{formatKES(product.sellingPrice)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.sellingPrice && (
            <span className="text-sm text-gray-400 line-through">{formatKES(product.compareAtPrice)}</span>
          )}
        </div>
        {product.reviewCount !== undefined && product.reviewCount > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            ★ {product.averageRating?.toFixed(1) || '—'} ({product.reviewCount})
          </div>
        )}
        <button
          onClick={addToCart}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-jungle-500 hover:bg-jungle-600 text-white text-sm font-medium py-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <ShoppingBag size={16} />
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
