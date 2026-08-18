'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = (page = 1, q = search) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (q) params.set('search', q);
    api
      .get(`/products?${params}`)
      .then((res) => {
        setProducts(res.data.data || []);
        setMeta(res.data.meta || { page: 1, total: 0 });
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(1, search)}
            placeholder="Search products..."
            className="border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500/30"
          />
          <button onClick={() => load(1, search)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-medium">
            Search
          </button>
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/product/${p.slug}`} className="font-medium text-gray-900 hover:text-jungle-600">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 font-medium">{formatKES(p.sellingPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 5 ? 'text-orange-600 font-medium' : ''}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-sm text-gray-500">{meta.total} products · Manage stock in Inventory</p>
    </div>
  );
}
