'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold">Order not found</h1>
        <Link href="/shop" className="mt-4 inline-block text-jungle-600 hover:underline">Back to shop</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <CheckCircle size={56} className="mx-auto text-jungle-500 mb-4" />
      <h1 className="text-2xl font-serif font-bold text-gray-900">Order placed!</h1>
      <p className="mt-2 text-gray-600">
        Order number: <strong>{order.orderNumber}</strong>
      </p>
      <p className="mt-1 text-jungle-600 font-semibold text-lg">
        Total: {formatKES(Number(order.total))}
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Status: {order.orderStatus} · Payment: {order.paymentStatus}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        We’ll confirm payment and delivery details shortly. For M-Pesa, complete the STK prompt on your phone when prompted.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/shop" className="bg-jungle-500 hover:bg-jungle-600 text-white font-semibold px-6 py-3 rounded-full transition">
          Continue shopping
        </Link>
        <Link href="/" className="border border-gray-200 hover:bg-gray-50 font-medium px-6 py-3 rounded-full transition">
          Home
        </Link>
      </div>
    </div>
  );
}
