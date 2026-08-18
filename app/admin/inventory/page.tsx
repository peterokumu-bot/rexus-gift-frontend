'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  const load = (f = filter) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (f) params.set('filter', f);
    api
      .get(`/admin/inventory?${params}`)
      .then((res) => {
        setProducts(res.data.data || []);
        setMeta(res.data.meta || { total: 0 });
      })
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [router, filter]);

  const submitAdjust = async (productId: string) => {
    const quantity = parseInt(qty, 10);
    if (isNaN(quantity) || quantity === 0) {
      toast.error('Enter a non-zero quantity (+ to add, - to remove)');
      return;
    }
    try {
      await api.post('/admin/inventory/adjust', {
        productId,
        quantity,
        type: 'ADJUSTMENT',
        reason: reason || 'Manual adjustment',
      });
      toast.success('Stock updated');
      setAdjusting(null);
      setQty('');
      setReason('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">Inventory</h1>
        <div className="flex gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filter === f.value ? 'bg-jungle-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Alert at</th>
                <th className="px-4 py-3 font-medium">Buy / Sell</th>
                <th className="px-4 py-3 font-medium">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock === 0
                          ? 'text-red-600 font-bold'
                          : p.stock <= (p.lowStockAlert || 5)
                            ? 'text-orange-600 font-semibold'
                            : 'font-medium'
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.lowStockAlert}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatKES(p.buyingPrice)} / {formatKES(p.sellingPrice)}
                  </td>
                  <td className="px-4 py-3">
                    {adjusting === p.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          placeholder="+5 or -2"
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                        />
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason"
                          className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => submitAdjust(p.id)}
                          className="bg-jungle-500 text-white text-xs font-medium px-3 py-1 rounded-lg"
                        >
                          Save
                        </button>
                        <button onClick={() => setAdjusting(null)} className="text-xs text-gray-500">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAdjusting(p.id);
                          setQty('');
                          setReason('');
                        }}
                        className="text-xs font-medium text-jungle-600 hover:underline"
                      >
                        Adjust stock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-sm text-gray-500">
        {meta.total} products · Use positive numbers to add stock, negative to reduce
      </p>
    </div>
  );
}
