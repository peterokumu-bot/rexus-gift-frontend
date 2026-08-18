'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .get('/orders/my')
      .then((res) => setOrders(res.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-serif font-bold text-gray-900">My orders</h1>
        <Link href="/account" className="text-sm text-jungle-600 hover:underline">
          ← Account
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>No orders yet.</p>
          <Link href="/shop" className="mt-4 inline-block text-jungle-600 font-medium hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 bg-white border border-gray-100 rounded-2xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-jungle-600">{formatKES(Number(order.total))}</p>
                  <p className="text-xs mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {order.orderStatus}
                    </span>
                    {' · '}
                    <span className="text-gray-500">{order.paymentStatus}</span>
                  </p>
                </div>
              </div>
              {order.items?.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  {order.items.map((i: any) => i.productName).join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
