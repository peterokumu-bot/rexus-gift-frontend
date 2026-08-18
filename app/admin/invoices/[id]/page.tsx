'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    api
      .get(`/admin/orders/${id}/invoice`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null));
  }, [id, router]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        Loading invoice...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 print:py-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Link href={`/admin/orders/${id}`} className="text-sm text-jungle-600 hover:underline">
          ← Back to order
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-jungle-500 hover:bg-jungle-600 text-white font-semibold px-5 py-2 rounded-full text-sm"
        >
          Print invoice
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-0 print:rounded-none">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold text-jungle-600">Rexus Gift</h1>
            <p className="text-sm text-gray-500 mt-1">hello@rexusgift.com · +254 700 000 000</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">INVOICE</p>
            <p className="text-sm text-gray-500">{order.orderNumber}</p>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleDateString('en-KE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bill to</p>
          <p className="font-medium">{order.guestName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`}</p>
          <p className="text-sm text-gray-600">{order.guestEmail || order.user?.email}</p>
          <p className="text-sm text-gray-600">{order.guestPhone || order.deliveryPhone}</p>
          {order.deliveryTown && (
            <p className="text-sm text-gray-600 mt-1">
              {[order.deliveryBuilding, order.deliveryStreet, order.deliveryTown, order.deliveryCounty]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium text-center">Qty</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-3">{item.productName}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">{formatKES(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium">{formatKES(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-48 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatKES(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              <span>{formatKES(order.deliveryFee)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span>-{formatKES(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-jungle-600">{formatKES(order.total)}</span>
            </div>
            <p className="text-xs text-gray-400 pt-1">Payment: {order.paymentStatus}</p>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          Thank you for shopping with Rexus Gift
        </p>
      </div>
    </div>
  );
}
