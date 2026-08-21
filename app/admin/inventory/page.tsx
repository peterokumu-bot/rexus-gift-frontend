'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { downloadAdminCsv } from '@/lib/export';
import { toast } from 'sonner';
import { formatKES } from '@/lib/utils';

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
      toast.error('Enter a non-zero quantity (+ to add, − to remove)');
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold text-white">Inventory</h2>
      <button type="button" onClick={async () => { try { await downloadAdminCsv('inventory'); toast.success('Export downloaded'); } catch (e: any) { toast.error(e.message || 'Export failed'); } }} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5">Export CSV</button></div>
          <p className="text-sm text-gray-500">{meta.total} products</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === f.value
                  ? 'bg-[#2F6B52] text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-white/5">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Alert</th>
                <th className="px-5 py-3 font-medium">Buy / Sell</th>
                <th className="px-5 py-3 font-medium">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-5 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        p.stock === 0
                          ? 'text-red-400 font-bold'
                          : p.stock <= (p.lowStockAlert || 5)
                            ? 'text-orange-400 font-semibold'
                            : 'text-gray-300'
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{p.lowStockAlert}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {formatKES(p.buyingPrice)} / {formatKES(p.sellingPrice)}
                  </td>
                  <td className="px-5 py-3">
                    {adjusting === p.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          placeholder="+5 or -2"
                          className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
                        />
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason"
                          className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
                        />
                        <button onClick={() => submitAdjust(p.id)} className="bg-[#2F6B52] text-white text-xs font-medium px-3 py-1 rounded-lg">
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
                        className="text-xs font-medium text-[#5aa882] hover:underline"
                      >
                        Adjust stock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-500">Use positive numbers to add stock, negative to reduce</p>
    </div>
  );
}
