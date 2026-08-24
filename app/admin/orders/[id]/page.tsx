'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { OrderTimeline } from '@/components/order/OrderTimeline';

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const PAYMENT_STATUSES = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [note, setNote] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/admin/orders/${id}`)
      .then((res) => {
        const o = res.data.data;
        setOrder(o);
        setOrderStatus(o.orderStatus || o.status || 'PENDING');
        setPaymentStatus(o.paymentStatus || 'PENDING');
      })
      .catch(() => {
        toast.error('Order not found');
        setOrder(null);
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

  const downloadMessages = async () => {
    try {
      const res = await api.get(`/admin/orders/${id}/handwritten-messages`);
      const data = res.data.data;
      if (!data.messages?.length) {
        toast.error('No personalized messages on this order');
        return;
      }
      const w = window.open('', '_blank');
      if (!w) return;
      const papers = data.messages
        .map(
          (m: any) => `
          <div style="page-break-after:always;padding:24px;font-family:Georgia,serif;background:${
            m.paperColor === 'pink' ? '#fce4ec' : '#fff9c4'
          };min-height:80vh;margin-bottom:16px;border:1px solid #ddd">
            <p style="font-size:12px;color:#666">Order ${data.orderNumber} · ${data.customerName || ''} · ${m.productName}</p>
            <div style="margin-top:24px;font-size:22px;line-height:1.6;white-space:pre-wrap;font-family:cursive,Georgia,serif;color:#1a237e">${(
              m.message || ''
            ).replace(/</g, '&lt;')}</div>
          </div>`,
        )
        .join('');
      w.document.write(`<html><head><title>Messages ${data.orderNumber}</title></head><body onload="window.print()">${papers}</body></html>`);
      w.document.close();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not download messages');
    }
  };

  const updateStatus = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, {
        status: orderStatus,
        note: note || undefined,
      });
      toast.success('Order status updated');
      setNote('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const updatePayment = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${id}/payment`, {
        paymentStatus,
      });
      toast.success('Payment status updated');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update payment (ADMIN only)');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Order not found</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-[#5aa882] hover:underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const customerName =
    order.guestName ||
    (order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest');
  const customerEmail = order.guestEmail || order.user?.email || '—';
  const customerPhone = order.deliveryPhone || order.guestPhone || order.user?.phone || '—';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-[#5aa882]">
            ← Orders
          </Link>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {order.orderNumber}
          </h2>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString('en-KE')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-gray-300">
            {order.orderStatus}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-gray-300">
            Payment: {order.paymentStatus}
          </span>
          <Link
            href={`/admin/invoices/${order.id}`}
            className="text-xs px-2.5 py-1 rounded-md bg-[#1e3a5f] text-white hover:bg-[#152a45]"
          >
            Download invoice
          </Link>
          <button
            type="button"
            onClick={downloadMessages}
            className="text-xs px-2.5 py-1 rounded-md bg-[#C4A227]/20 text-[#C4A227] hover:bg-[#C4A227]/30"
          >
            Handwritten message PDF
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Customer & delivery */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Customer</h3>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500 text-xs">Name</dt>
                <dd className="text-gray-200">{customerName}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Email</dt>
                <dd className="text-gray-200 break-all">{customerEmail}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Phone</dt>
                <dd className="text-gray-200">{customerPhone}</dd>
              </div>
              {order.userId && (
                <div>
                  <dt className="text-gray-500 text-xs">Account</dt>
                  <dd>
                    <Link
                      href={`/admin/customers/${order.userId}`}
                      className="text-[#5aa882] hover:underline"
                    >
                      View customer
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Delivery</h3>
            <p className="text-sm text-gray-300">
              {order.deliveryOption || 'DELIVERY'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {[
                order.deliveryBuilding,
                order.deliveryStreet,
                order.deliveryArea,
                order.deliveryTown,
                order.deliveryCounty,
              ]
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
            {order.deliveryInstructions && (
              <p className="text-sm text-gray-500 mt-2">Note: {order.deliveryInstructions}</p>
            )}
            {order.notes && (
              <p className="text-sm text-gray-500 mt-1">Order notes: {order.notes}</p>
            )}
            {order.isGift && (
              <div className="mt-3 pt-3 border-t border-white/5 text-sm">
                <p className="text-[#C4A227] font-medium">Gift order</p>
                <p className="text-gray-300">Recipient: {order.recipientName}</p>
                <p className="text-gray-400">{order.recipientPhone}</p>
                {order.giftMessage && (
                  <p className="text-gray-500 mt-1 italic">"{order.giftMessage}"</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="px-5 py-2 font-medium">Product</th>
                  <th className="px-5 py-2 font-medium">Qty</th>
                  <th className="px-5 py-2 font-medium">Unit</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || order.orderItems || []).map((item: any) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-5 py-3 text-gray-200">
                      {item.productName || item.product?.name}
                      {item.productSku && (
                        <span className="block text-xs text-gray-500 font-mono">
                          {item.productSku}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400">{item.quantity}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {formatKES(item.unitPrice)}
                    </td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      {formatKES(item.totalPrice ?? item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 space-y-1 text-sm border-t border-white/5">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{formatKES(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Discount</span>
                  <span>−{formatKES(order.discountAmount)}</span>
                </div>
              )}
              {Number(order.deliveryFee) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Delivery</span>
                  <span>{formatKES(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2">
                <span>Total</span>
                <span className="text-[#5aa882]">{formatKES(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit panels */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Update order status</h3>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#161b22]">
                  {s}
                </option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note (optional)"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500"
            />
            <button
              type="button"
              disabled={saving}
              onClick={updateStatus}
              className="w-full py-2.5 rounded-xl bg-[#2F6B52] hover:bg-[#275a45] text-white text-sm font-medium disabled:opacity-50"
            >
              Save status
            </button>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Update payment</h3>
            <p className="text-xs text-gray-500">Admin only</p>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#161b22]">
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={updatePayment}
              className="w-full py-2.5 rounded-xl bg-[#C4A227]/90 hover:bg-[#C4A227] text-[#1a3b2e] text-sm font-semibold disabled:opacity-50"
            >
              Save payment status
            </button>
          </div>

          {order.payments?.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Payment records</h3>
              <ul className="space-y-2 text-sm">
                {order.payments.map((p: any) => (
                  <li key={p.id} className="flex justify-between gap-2 text-gray-400">
                    <span>
                      {p.method || p.paymentMethod} · {p.status}
                    </span>
                    <span className="text-white">{formatKES(p.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Tracking timeline</h3>
        <div className="text-gray-200">
          <OrderTimeline currentStatus={order.orderStatus} history={order.statusHistory || []} />
        </div>
      </div>
    </div>
  );
}
