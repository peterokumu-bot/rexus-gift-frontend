'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import api from '@/lib/api';

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    searchParams.forEach((v, k) => params.set(k, v));
    if (!params.has('limit')) params.set('limit', '20');

    setLoading(true);
    api
      .get(`/products?${params.toString()}`)
      .then((res) => {
        setProducts(res.data.data || []);
        setMeta(res.data.meta || { page: 1, limit: 20, total: 0 });
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Shop Gifts</h1>
        <p className="mt-1 text-gray-500">
          {loading ? 'Loading...' : `${meta.total} products`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No products found</p>
          <p className="text-sm mt-2">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
