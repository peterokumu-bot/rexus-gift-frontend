'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  Truck,
  Settings,
  Store,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/vendors', label: 'Vendors', icon: Truck },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#161b22] border-r border-white/5 flex flex-col">
        <div className="px-6 py-6 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">Rexus</span>
            <span className="text-[#C4A227] font-medium">Gift</span>
          </Link>
          <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider">Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-[#2F6B52] text-white shadow-lg shadow-[#2F6B52]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5"
          >
            <Store size={18} />
            View store
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-white/5"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 bg-[#0f1117]/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6 lg:px-8">
          <h1 className="text-lg font-semibold text-white tracking-tight">
            {nav.find((n) => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))
              ?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-gray-500">Rexus Gift</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2F6B52] to-[#C4A227] flex items-center justify-center text-sm font-bold text-white">
              R
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
