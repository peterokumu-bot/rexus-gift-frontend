'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadCart = () => {
    setLoading(true);
    api
      .get('/cart')
      .then((res) => setCart(res.data.data))
      .catch(() => setCart({ items: [], subtotal: 0, itemCount: 0 }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(itemId);
    try {
      const res = await api.patch(`/cart/items/${itemId}`, { quantity });
      setCart(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      setCart(res.data.data);
      toast.success('Item removed');
    } catch {
      toast.error('Could not remove item');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-serif font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-gray-500">Looks like you haven’t added any gifts yet.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center bg-jungle-500 hover:bg-jungle-600 text-white font-semibold px-8 py-3 rounded-full transition"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900 mb-8">
        Shopping Cart ({cart?.itemCount || items.length})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl"
            >
              <Link href={`/product/${item.product.slug}`} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                <Image
                  src={item.product.images?.[0]?.url || 'https://placehold.co/200x200/2F6B52/FFFFFF?text=Rexus'}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.product.slug}`} className="font-medium text-gray-900 hover:text-jungle-600 line-clamp-2">
                  {item.product.name}
                </Link>
                <p className="mt-1 text-jungle-600 font-semibold">{formatKES(item.product.sellingPrice)}</p>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      disabled={!!updating || item.quantity <= 1}
                      className="p-1.5 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      disabled={!!updating}
                      className="p-1.5 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{formatKES(item.lineTotal)}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={!!updating}
                      className="p-2 text-gray-400 hover:text-red-500 transition"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h2 className="font-serif font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatKES(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-jungle-600">{formatKES(subtotal)}</span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 w-full flex items-center justify-center bg-jungle-500 hover:bg-jungle-600 text-white font-semibold py-3.5 rounded-full transition"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/shop"
              className="mt-3 w-full flex items-center justify-center text-jungle-600 font-medium py-2 hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
