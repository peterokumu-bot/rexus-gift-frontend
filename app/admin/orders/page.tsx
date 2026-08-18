'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { toast } from 'sonner';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0 });
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
        setMeta(res.data.meta || { page: 1, total: 0 });
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
      load(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">Orders</h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-200 rounded-full px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(1)}
            placeholder="Search order #, name, phone..."
            className="border border-gray-200 rounded-full px-4 py-2 text-sm w-48"
          />
          <button onClick={() => load(1)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-medium">
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 py-12 text-center">No orders found</p>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="text-jungle-600 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.guestName || o.user?.firstName || '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatKES(o.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.paymentStatus}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-KE')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-jungle-600 hover:underline text-xs font-medium mr-2">
                      View
                    </Link>
                    <Link href={`/admin/invoices/${o.id}`} className="text-gold-600 hover:underline text-xs font-medium">
                      Invoice
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-sm text-gray-500">{meta.total} orders</p>
    </div>
  );
}
