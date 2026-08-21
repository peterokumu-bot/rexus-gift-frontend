'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    api
      .get('/wishlist')
      .then((r) => {
        const data = r.data.data || [];
        setItems(Array.isArray(data) ? data.map((w: any) => w.product || w) : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/account" className="text-sm text-[#2F6B52] hover:underline">← Account</Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Wishlist</h1>
      {loading ? (
        <p className="mt-8 text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 text-gray-500">No saved items yet. Heart products while you shop.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
