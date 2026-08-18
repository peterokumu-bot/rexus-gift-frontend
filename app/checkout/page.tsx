'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [form, setForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    deliveryCounty: 'Nairobi',
    deliveryTown: '',
    deliveryBuilding: '',
    deliveryStreet: '',
    deliveryInstructions: '',
    deliveryOption: 'DELIVERY' as 'DELIVERY' | 'PICKUP',
    notes: '',
    paymentMethod: 'MPESA',
  });

  useEffect(() => {
    api
      .get('/cart')
      .then((r) => setCart(r.data.data))
      .catch(() => setCart({ items: [], subtotal: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.items?.length) {
      toast.error('Cart is empty');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        ...form,
        deliveryPhone: form.guestPhone,
      });
      setPlacedOrder(res.data.data);
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse mb-8" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Success state
  if (placedOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle size={56} className="mx-auto text-jungle-500 mb-4" />
        <h1 className="text-2xl font-serif font-bold text-gray-900">Order placed!</h1>
        <p className="mt-2 text-gray-600">
          Order number: <strong>{placedOrder.orderNumber}</strong>
        </p>
        <p className="mt-1 text-jungle-600 font-semibold text-lg">
          Total: {formatKES(Number(placedOrder.total))}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          We received your order. Complete M-Pesa payment when prompted, or pay on delivery if selected.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex bg-jungle-500 hover:bg-jungle-600 text-white font-semibold px-8 py-3 rounded-full transition"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif font-bold">Nothing to checkout</h1>
        <Link href="/shop" className="mt-4 inline-block text-jungle-600 hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={placeOrder} className="space-y-8">
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Full name</label>
              <input name="guestName" required value={form.guestName} onChange={onChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input name="guestEmail" type="email" required value={form.guestEmail} onChange={onChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone (M-Pesa)</label>
              <input name="guestPhone" type="tel" required placeholder="07..." value={form.guestPhone} onChange={onChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Delivery</h2>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="deliveryOption" value="DELIVERY" checked={form.deliveryOption === 'DELIVERY'}
                onChange={onChange} />
              <span>Delivery</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="deliveryOption" value="PICKUP" checked={form.deliveryOption === 'PICKUP'}
                onChange={onChange} />
              <span>Pickup</span>
            </label>
          </div>
          {form.deliveryOption === 'DELIVERY' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">County</label>
                <input name="deliveryCounty" required value={form.deliveryCounty} onChange={onChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Town / Area</label>
                <input name="deliveryTown" required value={form.deliveryTown} onChange={onChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Building / Estate</label>
                <input name="deliveryBuilding" value={form.deliveryBuilding} onChange={onChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Street / Landmark</label>
                <input name="deliveryStreet" value={form.deliveryStreet} onChange={onChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Delivery instructions</label>
                <textarea name="deliveryInstructions" rows={2} value={form.deliveryInstructions} onChange={onChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500" />
              </div>
            </div>
          )}
        </section>

        <section className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order summary</h2>
          <ul className="space-y-2 text-sm mb-4">
            {cart.items.map((item: any) => (
              <li key={item.id} className="flex justify-between">
                <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                <span className="font-medium">{formatKES(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-lg font-bold text-jungle-600 pt-3 border-t border-gray-200">
            <span>Subtotal</span>
            <span>{formatKES(cart.subtotal)}</span>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-jungle-500 hover:bg-jungle-600 text-white font-semibold py-4 rounded-full transition disabled:opacity-60"
        >
          {submitting ? 'Placing order...' : 'Place order'}
        </button>
      </form>
    </div>
  );
}
