'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package, MapPin, User, Heart, Wallet, Gift, Truck, Settings,
} from 'lucide-react';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { VIP_META } from '@/lib/validation';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (!token || !stored) {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      router.push('/login');
      return;
    }
    api.get('/wallet').then((r) => setWallet(r.data.data)).catch(() => {});
    api.get('/users/me').then((r) => {
      const me = r.data.data;
      if (me) setUser((u: any) => ({ ...u, ...me }));
    }).catch(() => {});
  }, [router]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const links = [
    { href: '/account/orders', label: 'Order history', icon: Package, desc: 'View past orders' },
    { href: '/account/orders', label: 'Track an order', icon: Truck, desc: 'Follow delivery status' },
    { href: '/account/wishlist', label: 'Wishlist', icon: Heart, desc: 'Saved gifts' },
    { href: '/account/addresses', label: 'Delivery addresses', icon: MapPin, desc: 'Manage where we deliver' },
    { href: '/account/wallet', label: 'Wallet & Rexo', icon: Wallet, desc: 'Money and ☥ rewards' },
    { href: '/account/profile', label: 'Edit profile', icon: User, desc: 'Name, phone, password' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My account</h1>
      <p className="mt-1 text-gray-500">
        Hi {user.firstName} · {user.email}
      </p>
      {user.vipLevel && (
        <div className="mt-3">
          <span className={`inline-flex text-xs font-semibold px-3 py-1 rounded-full ${VIP_META[user.vipLevel]?.color || 'bg-gray-100'}`}>
            {VIP_META[user.vipLevel]?.label || user.vipLevel} VIP
          </span>
          <p className="text-xs text-gray-500 mt-1">{VIP_META[user.vipLevel]?.perks}</p>
        </div>
      )}

      {/* Rexo + wallet strip */}
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#C4A227]/30 bg-gradient-to-br from-[#C4A227]/10 to-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Rexo balance</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            ☥ {wallet?.rexoBalance ?? 0}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Earn ☥ 1 per KSh 10,000 · Redeem ☥ 1 = KSh 500 off (orders KSh 5,000+)
          </p>
        </div>
        <div className="rounded-2xl border border-[#2F6B52]/20 bg-gradient-to-br from-[#2F6B52]/10 to-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Wallet</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {formatKES(wallet?.walletBalance ?? 0)}
          </p>
          <Link href="/account/wallet" className="mt-2 inline-block text-sm text-[#2F6B52] font-medium hover:underline">
            Top up / activity →
          </Link>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {links.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-[#2F6B52]/30 hover:shadow-sm transition"
          >
            <div className="w-10 h-10 rounded-full bg-[#2F6B52]/10 flex items-center justify-center text-[#2F6B52] flex-shrink-0">
              <item.icon size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{item.label}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {(user.role === 'ADMIN' || user.role === 'STAFF') && (
        <Link
          href="/admin"
          className="mt-8 inline-flex items-center bg-[#2F6B52] hover:bg-[#275a45] text-white font-semibold px-6 py-3 rounded-full transition"
        >
          Open admin dashboard
        </Link>
      )}
    </div>
  );
}
