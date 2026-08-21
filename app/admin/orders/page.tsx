'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { downloadAdminCsv } from '@/lib/export';
import { toast } from 'sonner';
import { formatKES } from '@/lib/utils';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    api
      .get(`/admin/orders?${params}`)
      .then((res) => {
        setOrders(res.data.data || []);
        setMeta(res.data.meta || { total: 0 });
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [router, status]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
      toast.success('Status updated');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold text-white">Orders</h2>
      <button type="button" onClick={async () => { try { await downloadAdminCsv('orders'); toast.success('Export downloaded'); } catch (e: any) { toast.error(e.message || 'Export failed'); } }} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5">Export CSV</button></div>
          <p className="text-sm text-gray-500">{meta.total} orders</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#161b22]">{s}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search order #, name..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-500 w-48 focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/50"
          />
          <button onClick={() => load()} className="bg-[#2F6B52] hover:bg-[#275a45] text-white text-sm font-medium px-4 py-2 rounded-xl">
            Search
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-white/5">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-[#5aa882] hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{o.guestName || o.user?.firstName || '—'}</td>
                  <td className="px-5 py-3 font-medium text-white">{formatKES(o.total)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#161b22]">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{o.paymentStatus}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-KE')}</td>
                  <td className="px-5 py-3 space-x-2">
                    <Link href={`/admin/orders/${o.id}`} className="text-xs text-[#5aa882] hover:underline">View</Link>
                    <Link href={`/admin/invoices/${o.id}`} className="text-xs text-[#C4A227] hover:underline">Invoice</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
