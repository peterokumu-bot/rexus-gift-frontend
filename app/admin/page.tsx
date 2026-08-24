'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="mt-4 inline-block text-[#C4A227] hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const stats = [
    {
      label: "Today's sales",
      value: formatKES(data.todaySales || 0),
      icon: TrendingUp,
      accent: 'from-[#2F6B52]/30 to-[#2F6B52]/5',
      iconBg: 'bg-[#2F6B52]/20 text-[#5aa882]',
      href: '/admin/orders',
    },
    {
      label: 'Total sales',
      value: formatKES(data.totalSales || 0),
      icon: DollarSign,
      accent: 'from-[#C4A227]/20 to-[#C4A227]/5',
      iconBg: 'bg-[#C4A227]/20 text-[#C4A227]',
      href: '/admin/orders',
    },
    {
      label: 'Orders',
      value: String(data.totalOrders || 0),
      sub: `${data.pendingOrders || 0} pending`,
      icon: ShoppingBag,
      accent: 'from-blue-500/20 to-blue-500/5',
      iconBg: 'bg-blue-500/20 text-blue-400',
      href: '/admin/orders',
    },
    {
      label: 'Customers',
      value: String(data.totalCustomers || 0),
      icon: Users,
      accent: 'from-purple-500/20 to-purple-500/5',
      iconBg: 'bg-purple-500/20 text-purple-400',
      href: '/admin/customers',
    },
    {
      label: 'Products',
      value: String(data.totalProducts || 0),
      icon: Package,
      accent: 'from-cyan-500/20 to-cyan-500/5',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      href: '/admin/products',
    },
    {
      label: 'Profit (paid)',
      value: formatKES(data.totalProfit || 0),
      icon: DollarSign,
      accent: 'from-[#2F6B52]/30 to-emerald-500/5',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      href: '/admin/orders',
    },
    {
      label: 'Low stock',
      value: String(data.lowStock || 0),
      icon: AlertTriangle,
      accent: 'from-orange-500/20 to-orange-500/5',
      iconBg: 'bg-orange-500/20 text-orange-400',
      href: '/admin/inventory?filter=low',
    },
    {
      label: 'Out of stock',
      value: String(data.outOfStock || 0),
      icon: AlertTriangle,
      accent: 'from-red-500/20 to-red-500/5',
      iconBg: 'bg-red-500/20 text-red-400',
      href: '/admin/inventory?filter=out',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h2>

        <p className="text-sm text-gray-500 mt-1">Store overview · Rexus Gift</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${s.accent} p-5 transition hover:border-white/15 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/40`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
                <p className="mt-2 text-2xl font-bold text-white tracking-tight">{s.value}</p>
                {s.sub && <p className="mt-1 text-xs text-gray-500">{s.sub}</p>}
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                <s.icon size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two column: recent orders + quick links */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              <h3 className="font-semibold text-white">Recent orders</h3>
            </div>
            <Link href="/admin/orders" className="text-xs text-[#C4A227] hover:underline">
              View all
            </Link>
          </div>
          {!data.recentOrders?.length ? (
            <p className="p-8 text-center text-gray-500 text-sm">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-white/5">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o: any) => (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/orders/${o.id}`} className="font-medium text-[#5aa882] hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">{o.guestName || '—'}</td>
                      <td className="px-5 py-3.5 font-medium text-white">{formatKES(o.total)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/5 text-gray-300">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString('en-KE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5">
            <h3 className="font-semibold text-white mb-4">Quick actions</h3>
            <div className="space-y-2">
              {[
                { href: '/admin/orders', label: 'Manage orders' },
                { href: '/admin/products', label: 'View products' },
                { href: '/admin/inventory', label: 'Adjust inventory' },
                { href: '/admin/customers', label: 'Customers' },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="block w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-300 bg-white/5 hover:bg-[#2F6B52]/30 hover:text-white transition"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#2F6B52]/40 to-[#161b22] p-5">
            <h3 className="font-semibold text-white">Stock alerts</h3>
            <p className="mt-2 text-3xl font-bold text-white">
              {(data.lowStock || 0) + (data.outOfStock || 0)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {data.lowStock || 0} low · {data.outOfStock || 0} out
            </p>
            <Link
              href="/admin/inventory?filter=low"
              className="mt-4 inline-block text-sm text-[#C4A227] hover:underline"
            >
              Review inventory →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
