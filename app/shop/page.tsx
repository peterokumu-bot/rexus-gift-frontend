'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import api from '@/lib/api';

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const occasion = searchParams.get('occasion') || '';
  const recipient = searchParams.get('recipient') || '';
  const tag = searchParams.get('tag') || '';

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

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

  const roots = categories.filter((c) => !c.parentId && c.isActive !== false);
  const title =
    search || category || occasion || recipient || tag
      ? [search && `"${search}"`, category, occasion, recipient, tag].filter(Boolean).join(' · ')
      : 'All gifts';

  return (
    <div className="w-full min-h-[60vh] bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        {/* Dynamic category strip from admin */}
        {roots.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <Link
              href="/shop"
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition ${
                !category ? 'bg-[#2F6B52] text-white border-[#2F6B52]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#2F6B52]'
              }`}
            >
              All
            </Link>
            {roots.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition ${
                  category === c.slug
                    ? 'bg-[#2F6B52] text-white border-[#2F6B52]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#2F6B52]'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 capitalize">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">Try another search or category</p>
            <Link href="/shop" className="mt-4 inline-block text-[#2F6B52] hover:underline text-sm">
              View all gifts
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4">
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
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading shop…</div>}>
      <ShopContent />
    </Suspense>
  );
}
