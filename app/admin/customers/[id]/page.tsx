'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    api.get(`/admin/customers/${id}`).then((res) => setCustomer(res.data.data)).catch(() => setCustomer(null));
  }, [id, router]);

  if (!customer) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminNav />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <AdminNav />
      <Link href="/admin/customers" className="text-sm text-jungle-600 hover:underline">← Customers</Link>
      <h1 className="text-2xl font-serif font-bold text-gray-900 mt-2">
        {customer.firstName} {customer.lastName}
      </h1>
      <p className="text-gray-500 text-sm">{customer.email} · {customer.phone || 'No phone'}</p>
      <p className="mt-2 font-semibold text-jungle-600">Lifetime value: {formatKES(customer.lifetimeValue || 0)}</p>

      <h2 className="font-semibold mt-8 mb-3">Orders</h2>
      {customer.orders?.length === 0 ? (
        <p className="text-gray-500 text-sm">No orders</p>
      ) : (
        <div className="space-y-2">
          {customer.orders?.map((o: any) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex justify-between p-4 border border-gray-100 rounded-xl hover:border-jungle-200 text-sm"
            >
              <span className="font-medium">{o.orderNumber}</span>
              <span>{formatKES(o.total)} · {o.orderStatus}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
