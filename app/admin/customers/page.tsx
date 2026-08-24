'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatKES } from '@/lib/utils';

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Customers</h2>
          <p className="text-sm text-gray-500">{meta.total} customers</p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            placeholder="Search name, email..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/50"
          />
          <button onClick={() => load(search)} className="bg-[#2F6B52] hover:bg-[#275a45] text-white text-sm font-medium px-4 py-2 rounded-xl">
            Search
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-white/5">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">LTV</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-mono text-xs font-semibold text-[#C4A227] hover:underline"
                    >
                      {c.customerCode || '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium text-white hover:text-[#5aa882]">
                      {c.firstName} {c.lastName}
                    </Link>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{c.phone || '—'}</td>
                  <td className="px-5 py-3 text-gray-300">{c.orderCount}</td>
                  <td className="px-5 py-3 text-white font-medium">{formatKES(c.lifetimeValue || 0)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${c.isActive ? 'bg-[#2F6B52]/20 text-[#5aa882]' : 'bg-red-500/20 text-red-400'}`}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(c.id, c.isActive)} className="text-xs text-gray-400 hover:text-white">
                      {c.isActive ? 'Disable' : 'Enable'}
                    </button>
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
