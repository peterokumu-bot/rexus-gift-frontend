'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { toast } from 'sonner';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get(`/admin/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [id, router]);

  const updateStatus = async (status: string) => {
    try {
      const res = await api.patch(`/admin/orders/${id}/status`, { status });
      setOrder(res.data.data);
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const markPaid = async () => {
    try {
      const res = await api.patch(`/admin/orders/${id}/payment`, { paymentStatus: 'PAID' });
      setOrder(res.data.data);
      toast.success('Marked as paid');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading || !order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminNav />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <AdminNav />
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleString('en-KE')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/invoices/${order.id}`}
            className="bg-gold-500 hover:bg-gold-400 text-jungle-900 font-semibold px-4 py-2 rounded-full text-sm"
          >
            Invoice
          </Link>
          <Link href="/admin/orders" className="text-sm text-gray-500 hover:underline px-3 py-2">
            ← Orders
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Items</h2>
            <ul className="space-y-2 text-sm">
              {order.items?.map((item: any) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.productName} × {item.quantity}</span>
                  <span className="font-medium">{formatKES(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatKES(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>{formatKES(order.deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-{formatKES(order.discountAmount)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span className="text-jungle-600">{formatKES(order.total)}</span></div>
            </div>
          </div>

          {order.statusHistory?.length > 0 && (
            <div className="border border-gray-100 rounded-2xl p-5">
              <h2 className="font-semibold mb-3">Status history</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                {order.statusHistory.map((h: any) => (
                  <li key={h.id}>
                    <span className="font-medium text-gray-900">{h.status}</span>
                    {h.note && ` — ${h.note}`}
                    <span className="text-gray-400 ml-2">{new Date(h.createdAt).toLocaleString('en-KE')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Customer</h2>
            <p className="text-sm">{order.guestName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`}</p>
            <p className="text-sm text-gray-500">{order.guestEmail || order.user?.email}</p>
            <p className="text-sm text-gray-500">{order.guestPhone || order.deliveryPhone || order.user?.phone}</p>
          </div>

          <div className="border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Delivery</h2>
            <p className="text-sm text-gray-600">{order.deliveryOption}</p>
            {order.deliveryTown && (
              <p className="text-sm mt-1">
                {[order.deliveryBuilding, order.deliveryStreet, order.deliveryTown, order.deliveryCounty]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {order.deliveryInstructions && (
              <p className="text-sm text-gray-500 mt-2">{order.deliveryInstructions}</p>
            )}
          </div>

          <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold">Update status</h2>
            <select
              value={order.orderStatus}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {order.paymentStatus !== 'PAID' && (
              <button
                onClick={markPaid}
                className="w-full bg-jungle-500 hover:bg-jungle-600 text-white font-medium py-2 rounded-xl text-sm"
              >
                Mark payment as paid
              </button>
            )}
            <p className="text-xs text-gray-500">Payment: {order.paymentStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
