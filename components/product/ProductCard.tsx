'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { formatKES } from '@/lib/utils';
import { addToCart } from '@/lib/cart';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sellingPrice?: number;
    shortDescription?: string | null;
    images?: { url: string; altText?: string }[];
    stock?: number;
    status?: string;
    isPersonalized?: boolean;
  };
  showPrice?: boolean;
  showAddToCart?: boolean;
}

function needsPersonalization(product: ProductCardProps['product']) {
  return Boolean(
    product.isPersonalized ||
      /personaliz/i.test(product.name || '') ||
      /personaliz/i.test(product.slug || '') ||
      /handwrit/i.test(product.name || ''),
  );
}

export function ProductCard({
  product,
  showPrice = true,
  showAddToCart = true,
}: ProductCardProps) {
  const router = useRouter();
  const image =
    product.images?.[0]?.url ||
    'https://placehold.co/400x400/2F6B52/FFFFFF?text=Rexus';
  const blurb = product.shortDescription?.trim();
  const personalized = needsPersonalization(product);
  const canAdd =
    showAddToCart &&
    product.stock !== 0 &&
    (product.status === undefined || product.status === 'ACTIVE');

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Personalized products need message + paper colour on the product page
    if (personalized) {
      toast.message('Choose paper & write your message');
      router.push(`/product/${product.slug}`);
      return;
    }
    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.images?.[0]?.altText || product.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
        />
        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="absolute bottom-2 right-2 p-2 rounded-full bg-white shadow-md text-[#2F6B52] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-[#2F6B52] hover:text-white"
            aria-label={personalized ? 'Personalize' : 'Add to cart'}
          >
            <ShoppingBag size={16} />
          </button>
        )}
      </div>
      <div className="p-2.5 sm:p-3 flex flex-col gap-0.5 flex-1">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-[#2F6B52] transition-colors">
          {product.name}
        </h3>
        {blurb && (
          <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {blurb}
          </p>
        )}
        {showPrice && product.sellingPrice != null && (
          <p className="mt-auto pt-1 text-sm font-semibold text-[#2F6B52]">
            {formatKES(product.sellingPrice)}
          </p>
        )}
      </div>
    </Link>
  );
}
