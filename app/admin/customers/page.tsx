'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = (q = search) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (q) params.set('search', q);
    api
      .get(`/admin/customers?${params}`)
      .then((res) => {
        setCustomers(res.data.data || []);
        setMeta(res.data.meta || { total: 0 });
      })
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/customers/${id}/active`, { isActive: !isActive });
      toast.success(isActive ? 'Customer disabled' : 'Customer enabled');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">Customers</h1>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            placeholder="Search name, email, phone..."
            className="border border-gray-200 rounded-full px-4 py-2 text-sm"
          />
          <button onClick={() => load(search)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-medium">
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Lifetime value</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium text-gray-900 hover:text-jungle-600">
                      {c.firstName} {c.lastName}
                    </Link>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3">{c.orderCount}</td>
                  <td className="px-4 py-3 font-medium">{formatKES(c.lifetimeValue || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-jungle-50 text-jungle-700' : 'bg-red-50 text-red-600'}`}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c.id, c.isActive)}
                      className="text-xs font-medium text-gray-600 hover:text-jungle-600"
                    >
                      {c.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-sm text-gray-500">{meta.total} customers</p>
    </div>
  );
}
