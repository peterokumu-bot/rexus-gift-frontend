'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, MapPin, User, Lock } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
    }
  }, [router]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const links = [
    { href: '/account/orders', label: 'My orders', icon: Package, desc: 'Track and view past orders' },
    { href: '/account', label: 'Profile', icon: User, desc: `${user.firstName} ${user.lastName}` },
    { href: '/login', label: 'Password', icon: Lock, desc: 'Change your password' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">My account</h1>
      <p className="mt-1 text-gray-500">
        Signed in as {user.email}
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {links.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-jungle-200 hover:shadow-sm transition"
          >
            <div className="w-10 h-10 rounded-full bg-jungle-50 flex items-center justify-center text-jungle-600 flex-shrink-0">
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
          className="mt-6 inline-flex items-center bg-jungle-500 hover:bg-jungle-600 text-white font-semibold px-6 py-3 rounded-full transition"
        >
          Open admin dashboard
        </Link>
      )}
    </div>
  );
}
