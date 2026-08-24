'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { OrderTimeline } from '@/components/order/OrderTimeline';

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><div className="h-48 bg-gray-100 rounded-2xl animate-pulse" /></div>;
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Order not found</p>
        <Link href="/account/orders" className="text-[#2F6B52] hover:underline text-sm mt-4 inline-block">
          My orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link href="/account/orders" className="text-sm text-[#2F6B52] hover:underline">
          ← My orders
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Track order</h1>
        <p className="text-sm text-gray-500 mt-1">
          {order.orderNumber} · {formatKES(order.total)} · Payment: {order.paymentStatus}
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Delivery timeline</h2>
        <OrderTimeline
          currentStatus={order.orderStatus}
          history={order.statusHistory || []}
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Items</h2>
        <ul className="divide-y divide-gray-50">
          {(order.items || []).map((item: any) => (
            <li key={item.id} className="py-3 flex justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                {item.personalizationMessage && (
                  <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">
                    Message: {item.personalizationMessage}
                  </p>
                )}
              </div>
              <p className="font-medium text-[#2F6B52] shrink-0">{formatKES(item.totalPrice)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
