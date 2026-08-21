'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import api from '@/lib/api';

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const occasion = searchParams.get('occasion') || '';
  const recipient = searchParams.get('recipient') || '';
  const tag = searchParams.get('tag') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '56' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (occasion) params.set('occasion', occasion);
    if (recipient) params.set('recipient', recipient);
    if (tag) params.set('tag', tag);

    api
      .get(`/products?${params}`)
      .then((res) => {
        setProducts(res.data.data || []);
        setTotal(res.data.meta?.total || res.data.data?.length || 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, category, occasion, recipient, tag]);

  const title =
    search || category || occasion || recipient || tag
      ? [
          search && `"${search}"`,
          category,
          occasion,
          recipient,
          tag,
        ]
          .filter(Boolean)
          .join(' · ')
      : 'All gifts';

  return (
    <div className="w-full min-h-[60vh] bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 capitalize">
            {title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg bg-gray-200/80 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No products found</p>
            <p className="text-sm mt-1">Try another search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-20 text-center text-gray-400">Loading shop…</div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
