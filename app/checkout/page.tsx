'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, MapPin, AlertCircle, Gift } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { notifyCartUpdated } from '@/lib/cart';
import {
  formatPersonName,
  isValidEmail,
  isValidFullName,
  isValidPhone,
} from '@/lib/validation';

function readUser() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  const raw = localStorage.getItem('user');
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [rexoBalance, setRexoBalance] = useState(0);
  const [rexoToUse, setRexoToUse] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  /** self = deliver to my address; gift = someone else */
  const [deliverTo, setDeliverTo] = useState<'self' | 'gift'>('self');

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
    recipientName: '',
    recipientPhone: '',
    giftMessage: '',
  });

  useEffect(() => {
    const u = readUser();
    setUser(u);
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const tasks: Promise<any>[] = [
      api.get('/cart').then((r) => setCart(r.data.data)).catch(() => setCart({ items: [], subtotal: 0 })),
    ];

    if (token) {
      tasks.push(
        api.get('/users/me').then((r) => {
          const me = r.data.data;
          if (me) {
            setUser(me);
            localStorage.setItem(
              'user',
              JSON.stringify({
                id: me.id,
                firstName: me.firstName,
                lastName: me.lastName,
                email: me.email,
                phone: me.phone,
                role: me.role,
                vipLevel: me.vipLevel,
              }),
            );
          }
        }).catch(() => setUser(null)),
      );
      tasks.push(
        api.get('/wallet').then((r) => {
          setRexoBalance(r.data.data?.rexoBalance || 0);
          setWalletBalance(r.data.data?.walletBalance || 0);
        }).catch(() => {}),
      );
      tasks.push(
        api.get('/users/me/addresses').then((r) => {
          const arr = r.data.data || [];
          setAddresses(arr);
          const def = arr.find((a: any) => a.isDefault) || arr[0];
          if (def) setSelectedAddressId(def.id);
        }).catch(() => {
          try {
            const local = JSON.parse(localStorage.getItem('rexus_addresses') || '[]');
            setAddresses(local);
            if (local[0]) setSelectedAddressId(local[0].id);
          } catch {
            setAddresses([]);
          }
        }),
      );
    }

    Promise.all(tasks).finally(() => setLoading(false));
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'guestName' || name === 'recipientName') {
      // Capitalize as they type (light touch on blur is better; apply format on blur below)
      v = value;
    }
    setForm((f) => ({ ...f, [name]: v }));
  };

  const onNameBlur = (field: 'guestName' | 'recipientName') => {
    setForm((f) => ({ ...f, [field]: formatPersonName(f[field]) }));
  };

  const isLoggedIn = Boolean(user && typeof window !== 'undefined' && localStorage.getItem('accessToken'));
  const subtotal = cart?.subtotal || 0;
  const rexoDiscount =
    isLoggedIn && rexoToUse > 0 && subtotal >= 5000
      ? Math.min(rexoToUse, rexoBalance) * 500
      : 0;
  const total = Math.max(0, subtotal - rexoDiscount);
  const isGift = deliverTo === 'gift';

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.items?.length) {
      toast.error('Cart is empty');
      return;
    }

    if (!isLoggedIn) {
      if (!isValidFullName(form.guestName)) {
        toast.error('Enter your full name (first and last)');
        return;
      }
      if (!isValidEmail(form.guestEmail)) {
        toast.error('Enter a valid email');
        return;
      }
      if (!isValidPhone(form.guestPhone)) {
        toast.error('Enter a valid phone number');
        return;
      }
    }

    if (form.deliveryOption === 'DELIVERY') {
      if (isGift) {
        if (!isValidFullName(form.recipientName)) {
          toast.error('Recipient needs first and last name');
          return;
        }
        if (!isValidPhone(form.recipientPhone)) {
          toast.error('Enter a valid recipient phone');
          return;
        }
        if (!form.deliveryTown.trim()) {
          toast.error('Enter delivery town / area for the gift');
          return;
        }
      } else if (isLoggedIn) {
        if (addresses.length === 0) {
          toast.error('Add a delivery address in your account, or send as a gift');
          return;
        }
        if (!selectedAddressId) {
          toast.error('Select a delivery address');
          return;
        }
      } else if (!form.deliveryTown.trim()) {
        toast.error('Enter delivery town / area');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        deliveryOption: form.deliveryOption,
        notes: form.notes,
        paymentMethod: form.paymentMethod,
        rexoToUse: isLoggedIn ? rexoToUse : 0,
        isGift,
      };

      if (isGift) {
        payload.recipientName = formatPersonName(form.recipientName);
        payload.recipientPhone = form.recipientPhone;
        payload.giftMessage = form.giftMessage || undefined;
        payload.deliveryCounty = form.deliveryCounty;
        payload.deliveryTown = form.deliveryTown;
        payload.deliveryBuilding = form.deliveryBuilding;
        payload.deliveryStreet = form.deliveryStreet;
        payload.deliveryInstructions = form.deliveryInstructions;
        payload.deliveryPhone = form.recipientPhone;
      } else if (isLoggedIn && selectedAddressId) {
        payload.addressId = selectedAddressId;
        const addr = addresses.find((a) => a.id === selectedAddressId);
        if (addr) {
          payload.deliveryCounty = addr.county || 'Nairobi';
          payload.deliveryTown = addr.town || '';
          payload.deliveryBuilding = addr.building || '';
          payload.deliveryStreet = addr.street || '';
          payload.deliveryPhone = addr.phone || user.phone;
        }
      } else {
        payload.guestName = formatPersonName(form.guestName);
        payload.guestEmail = form.guestEmail.trim().toLowerCase();
        payload.guestPhone = form.guestPhone;
        payload.deliveryCounty = form.deliveryCounty;
        payload.deliveryTown = form.deliveryTown;
        payload.deliveryBuilding = form.deliveryBuilding;
        payload.deliveryStreet = form.deliveryStreet;
        payload.deliveryInstructions = form.deliveryInstructions;
        payload.deliveryPhone = form.guestPhone;
      }

      if (!isLoggedIn && !isGift) {
        payload.guestName = formatPersonName(form.guestName);
        payload.guestEmail = form.guestEmail.trim().toLowerCase();
        payload.guestPhone = form.guestPhone;
      }

      const res = await api.post('/orders', payload);
      setPlacedOrder(res.data.data);
      notifyCartUpdated();
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
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (placedOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle size={56} className="mx-auto text-[#2F6B52] mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Order placed!</h1>
        <p className="mt-2 text-gray-600">
          Order number: <strong>{placedOrder.orderNumber}</strong>
        </p>
        <p className="mt-1 text-[#2F6B52] font-semibold text-lg">{formatKES(placedOrder.total)}</p>
        {placedOrder.isGift && (
          <p className="mt-2 text-sm text-gray-500">Gift for {placedOrder.recipientName}</p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={placedOrder.id ? `/orders/${placedOrder.id}` : '/account/orders'}
            className="px-6 py-3 rounded-full bg-[#2F6B52] text-white font-medium"
          >
            Track order
          </Link>
          <Link href="/shop" className="px-6 py-3 rounded-full border border-gray-200 font-medium">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-block text-[#2F6B52] font-medium hover:underline">
          Browse gifts
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {isLoggedIn ? (
            <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
              <h2 className="font-semibold text-gray-900 mb-2">Account</h2>
              <p className="text-sm text-gray-800">
                Ordering as <strong>{user.firstName} {user.lastName}</strong>
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.vipLevel && user.vipLevel !== 'REGULAR' && (
                <p className="mt-2 text-xs font-semibold text-[#C4A227]">VIP {user.vipLevel}</p>
              )}
            </section>
          ) : (
            <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Contact</h2>
              <p className="text-sm text-gray-500">
                <Link href="/login" className="text-[#2F6B52] font-medium hover:underline">Sign in</Link> for faster checkout
              </p>
              <input
                name="guestName"
                required
                placeholder="Full name (first and last)"
                value={form.guestName}
                onChange={onChange}
                onBlur={() => onNameBlur('guestName')}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <input name="guestEmail" type="email" required placeholder="Email" value={form.guestEmail} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                <input name="guestPhone" required placeholder="Phone e.g. 0712345678" value={form.guestPhone} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
            </section>
          )}

          {/* Who receives */}
          {form.deliveryOption === 'DELIVERY' && (
            <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Gift size={18} /> Who is this for?
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setDeliverTo('self')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border text-left ${
                    deliverTo === 'self' ? 'border-[#2F6B52] bg-[#2F6B52]/10 text-[#2F6B52]' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Deliver to my address
                  <span className="block text-xs font-normal opacity-80 mt-0.5">Use my saved address</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverTo('gift')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border text-left ${
                    deliverTo === 'gift' ? 'border-[#2F6B52] bg-[#2F6B52]/10 text-[#2F6B52]' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Gift for someone else
                  <span className="block text-xs font-normal opacity-80 mt-0.5">Enter their name & address</span>
                </button>
              </div>
            </section>
          )}

          <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={18} /> Delivery
            </h2>
            <div className="flex gap-3">
              {(['DELIVERY', 'PICKUP'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, deliveryOption: opt }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${
                    form.deliveryOption === opt
                      ? 'border-[#2F6B52] bg-[#2F6B52]/10 text-[#2F6B52]'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {opt === 'DELIVERY' ? 'Delivery' : 'Pickup'}
                </button>
              ))}
            </div>

            {form.deliveryOption === 'DELIVERY' && isGift && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Recipient details</p>
                <input
                  name="recipientName"
                  required
                  placeholder="Recipient full name (first and last)"
                  value={form.recipientName}
                  onChange={onChange}
                  onBlur={() => onNameBlur('recipientName')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
                <input
                  name="recipientPhone"
                  required
                  placeholder="Recipient phone"
                  value={form.recipientPhone}
                  onChange={onChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <input name="deliveryCounty" placeholder="County" value={form.deliveryCounty} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                  <input name="deliveryTown" required placeholder="Town / Area" value={form.deliveryTown} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                  <input name="deliveryBuilding" placeholder="Building / Estate" value={form.deliveryBuilding} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                  <input name="deliveryStreet" placeholder="Street / Landmark" value={form.deliveryStreet} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <textarea
                  name="giftMessage"
                  placeholder="Gift message (optional)"
                  value={form.giftMessage}
                  onChange={onChange}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
            )}

            {form.deliveryOption === 'DELIVERY' && !isGift && isLoggedIn && (
              <>
                {addresses.length === 0 ? (
                  <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">No delivery address yet</p>
                      <Link href="/account/addresses" className="inline-block mt-2 font-semibold text-[#2F6B52] hover:underline">
                        Set up delivery address →
                      </Link>
                      <p className="mt-2 text-xs">Or choose “Gift for someone else” above.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Confirm your address</p>
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${
                          selectedAddressId === a.id ? 'border-[#2F6B52] bg-[#2F6B52]/5' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                          className="mt-1"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{a.label || 'Address'}</p>
                          <p className="text-gray-600">
                            {[a.building, a.street, a.town, a.county].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </label>
                    ))}
                    <Link href="/account/addresses" className="text-sm text-[#2F6B52] hover:underline">
                      Manage addresses
                    </Link>
                  </div>
                )}
              </>
            )}

            {form.deliveryOption === 'DELIVERY' && !isGift && !isLoggedIn && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input name="deliveryCounty" placeholder="County" value={form.deliveryCounty} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                <input name="deliveryTown" placeholder="Town / Area" value={form.deliveryTown} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                <input name="deliveryBuilding" placeholder="Building / Estate" value={form.deliveryBuilding} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                <input name="deliveryStreet" placeholder="Street / Landmark" value={form.deliveryStreet} onChange={onChange} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
            )}

            <textarea
              name="notes"
              placeholder="Order notes (optional)"
              value={form.notes}
              onChange={onChange}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
            />
          </section>

          {isLoggedIn && (
            <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">☥ Rexo rewards</h2>
              <p className="text-sm text-gray-600">
                Balance: <strong>☥ {rexoBalance}</strong>
              </p>
              {subtotal >= 5000 && rexoBalance > 0 ? (
                <div className="flex items-center gap-3">
                  <label className="text-sm">Use Rexo</label>
                  <input
                    type="number"
                    min={0}
                    max={rexoBalance}
                    value={rexoToUse}
                    onChange={(e) => setRexoToUse(Math.max(0, Math.min(rexoBalance, parseInt(e.target.value, 10) || 0)))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                  />
                  {rexoDiscount > 0 && <span className="text-sm text-[#2F6B52]">−{formatKES(rexoDiscount)}</span>}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Redeem ☥ on orders from KSh 5,000 (☥ 1 = KSh 500 off).</p>
              )}
            </section>
          )}

          <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={onChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="MPESA">M-Pesa</option>
              <option value="CASH_ON_DELIVERY">Cash on delivery</option>
              {isLoggedIn && walletBalance > 0 && (
                <option value="WALLET">Wallet ({formatKES(walletBalance)})</option>
              )}
            </select>
          </section>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Order summary</h2>
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm gap-2">
                <span className="text-gray-600 line-clamp-1">{item.product?.name} × {item.quantity}</span>
                <span className="font-medium shrink-0">{formatKES(item.lineTotal)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatKES(subtotal)}</span>
              </div>
              {rexoDiscount > 0 && (
                <div className="flex justify-between text-[#2F6B52]">
                  <span>☥ Rexo</span>
                  <span>−{formatKES(rexoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2">
                <span>Total</span>
                <span className="text-[#2F6B52]">{formatKES(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={
                submitting ||
                (isLoggedIn && !isGift && form.deliveryOption === 'DELIVERY' && addresses.length === 0)
              }
              className="w-full mt-2 py-3.5 rounded-full bg-[#2F6B52] hover:bg-[#275a45] text-white font-semibold disabled:opacity-50"
            >
              {submitting ? 'Placing order…' : isGift ? 'Place gift order' : 'Place order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
