'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

const VIP_STYLES: Record<string, string> = {
  REGULAR: 'bg-white/10 text-gray-300',
  PRESTIGE: 'bg-sky-500/20 text-sky-300',
  EXECUTIVE: 'bg-violet-500/20 text-violet-300',
  ELITE: 'bg-amber-500/20 text-amber-300',
  DYNASTY: 'bg-[#C4A227]/25 text-[#C4A227]',
};

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/admin/customers/${id}`)
      .then((res) => setCustomer(res.data.data))
      .catch(() => {
        toast.error('Customer not found');
        setCustomer(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [id, router]);

  const toggleActive = async () => {
    if (!customer) return;
    setBusy(true);
    try {
      await api.patch(`/admin/customers/${id}/active`, {
        isActive: !customer.isActive,
      });
      toast.success(customer.isActive ? 'Customer disabled' : 'Customer enabled');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-white/5 rounded animate-pulse" />
        <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Customer not found</p>
        <Link href="/admin/customers" className="mt-4 inline-block text-[#5aa882] hover:underline">
          ← Back to customers
        </Link>
      </div>
    );
  }

  const vip = customer.vipLevel || 'REGULAR';
  const orders = customer.orders || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/admin/customers" className="text-sm text-gray-500 hover:text-[#5aa882]">
          ← Customers
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-white">
            {customer.firstName} {customer.lastName}
          </h2>
          {customer.customerCode && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/5 text-gray-400">
              {customer.customerCode}
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${VIP_STYLES[vip] || VIP_STYLES.REGULAR}`}>
            {vip}
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${
              customer.isActive ? 'bg-[#2F6B52]/20 text-[#5aa882]' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {customer.isActive ? 'Active' : 'Disabled'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-KE') : '—'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Lifetime spend', value: formatKES(customer.lifetimeSpend || customer.lifetimeValue || 0) },
          { label: 'Orders', value: String(customer.orderCount ?? orders.length) },
          { label: 'Rexo ☥', value: String(customer.rexoBalance ?? 0) },
          { label: 'Wallet', value: formatKES(customer.walletBalance || 0) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/5 bg-[#161b22] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#161b22] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Contact</h3>
          <dl className="text-sm space-y-2">
            <div>
              <dt className="text-gray-500 text-xs">Email</dt>
              <dd className="text-gray-200 break-all">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">Phone</dt>
              <dd className="text-gray-200">{customer.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">Role</dt>
              <dd className="text-gray-200">{customer.role}</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={busy}
            onClick={toggleActive}
            className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-50"
          >
            {customer.isActive ? 'Disable account' : 'Enable account'}
          </button>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Orders</h3>
            <span className="text-xs text-gray-500">{orders.length}</span>
          </div>
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No orders linked to this account</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="px-5 py-2 font-medium">Order</th>
                  <th className="px-5 py-2 font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Payment</th>
                  <th className="px-5 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="text-[#5aa882] hover:underline font-medium">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-white">{formatKES(o.total)}</td>
                    <td className="px-5 py-3 text-gray-400">{o.orderStatus}</td>
                    <td className="px-5 py-3 text-gray-400">{o.paymentStatus}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString('en-KE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {customer.addresses?.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Addresses</h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm">
            {customer.addresses.map((a: any) => (
              <li key={a.id} className="border border-white/5 rounded-xl p-3 text-gray-300">
                <p className="font-medium text-white">
                  {a.label || 'Address'}
                  {a.isDefault && <span className="ml-2 text-xs text-[#5aa882]">Default</span>}
                </p>
                <p className="text-gray-400 mt-1">
                  {[a.building, a.street, a.town, a.county].filter(Boolean).join(', ')}
                </p>
                {a.phone && <p className="text-gray-500">{a.phone}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
