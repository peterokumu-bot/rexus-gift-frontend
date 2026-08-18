'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      router.push('/login');
      return;
    }
    try {
      const u = JSON.parse(user);
      if (u.role !== 'ADMIN' && u.role !== 'STAFF') {
        setError('Access denied');
        setLoading(false);
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 inline-block text-jungle-600 hover:underline">Go home</Link>
      </div>
    );
  }

  const cards = [
    { label: "Today's sales", value: formatKES(data.todaySales || 0) },
    { label: 'Total sales', value: formatKES(data.totalSales || 0) },
    { label: 'Profit (paid)', value: formatKES(data.totalProfit || 0) },
    { label: 'Orders', value: String(data.totalOrders || 0) },
    { label: 'Pending', value: String(data.pendingOrders || 0) },
    { label: 'Customers', value: String(data.totalCustomers || 0) },
    { label: 'Products', value: String(data.totalProducts || 0) },
    { label: 'Low stock', value: String(data.lowStock || 0) },
    { label: 'Out of stock', value: String(data.outOfStock || 0) },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
      <AdminNav />
      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="font-serif font-bold text-lg text-gray-900 mb-4">Recent orders</h2>
      {!data.recentOrders?.length ? (
        <p className="text-gray-500">No orders yet.</p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentOrders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="text-jungle-600 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.guestName || '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatKES(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-xs">{o.orderStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.paymentStatus}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-KE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
