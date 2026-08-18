'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-gray-100 pb-4 mb-6">
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition',
              active ? 'bg-jungle-500 text-white' : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            <l.icon size={16} />
            {l.label}
          </Link>
        );
      })}
      <Link href="/" className="ml-auto text-sm text-gray-500 hover:text-jungle-600 px-3 py-2">
        ← Store
      </Link>
    </nav>
  );
}