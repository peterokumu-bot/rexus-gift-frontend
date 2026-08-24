'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  Truck,
  Store,
  LogOut,
  Download,
  ChevronDown,
  FileSpreadsheet,
  Settings,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadAdminCsv } from '@/lib/export';
import { toast } from 'sonner';
import api from '@/lib/api';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/vendors', label: 'Vendors', icon: Truck },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const EXPORTS: { key: 'orders' | 'customers' | 'products' | 'finance' | 'inventory' | 'vendors'; label: string }[] = [
  { key: 'orders', label: 'Orders CSV' },
  { key: 'customers', label: 'Customers CSV' },
  { key: 'products', label: 'Products CSV' },
  { key: 'finance', label: 'Finance CSV' },
  { key: 'inventory', label: 'Inventory CSV' },
  { key: 'vendors', label: 'Vendors CSV' },
];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div className="h-9 w-48 rounded-full bg-white/5 animate-pulse" />;
  const dateStr = now.toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#2F6B52]/30 via-[#1a2332] to-[#C4A227]/20 border border-white/10 shadow-inner">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5aa882] opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5aa882]" />
      </span>
      <div className="text-center leading-tight">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#C4A227]/90 font-medium">{dateStr}</p>
        <p className="text-sm font-mono font-semibold text-white tabular-nums tracking-wider">{timeStr}</p>
      </div>
      <span className="text-[10px] text-gray-500 font-medium">EAT</span>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openDownload, setOpenDownload] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenDownload(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpenNotif(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const getReadIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('adminNotifRead') || '[]');
    } catch {
      return [];
    }
  };

  const markRead = (id: string) => {
    const read = new Set(getReadIds());
    read.add(id);
    localStorage.setItem('adminNotifRead', JSON.stringify([...read]));
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    const read = new Set([...getReadIds(), ...ids]);
    localStorage.setItem('adminNotifRead', JSON.stringify([...read]));
    setNotifications([]);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, orders] = await Promise.all([
          api.get('/admin/dashboard').catch(() => null),
          api.get('/admin/orders?limit=5').catch(() => null),
        ]);
        const read = new Set(getReadIds());
        const list: any[] = [];
        const d = dash?.data?.data;
        if (d?.pendingOrders && !read.has('pending')) {
          list.push({
            id: 'pending',
            title: `${d.pendingOrders} pending order(s)`,
            body: 'Review and process in Orders',
            href: '/admin/orders',
            time: 'Now',
          });
        }
        if ((d?.lowStock || d?.outOfStock) && !read.has('stock')) {
          list.push({
            id: 'stock',
            title: 'Stock alerts',
            body: `${d.lowStock || 0} low · ${d.outOfStock || 0} out of stock`,
            href: '/admin/inventory',
            time: 'Now',
          });
        }
        const recent = orders?.data?.data || [];
        recent.slice(0, 4).forEach((o: any) => {
          if (read.has(o.id)) return;
          list.push({
            id: o.id,
            title: `Order ${o.orderNumber || o.id?.slice(0, 8)}`,
            body: `${o.orderStatus || ''} · ${o.paymentStatus || ''}`,
            href: `/admin/orders/${o.id}`,
            time: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-KE') : '',
          });
        });
        setNotifications(list);
      } catch {
        setNotifications([]);
      }
    };
    load();
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  const runExport = async (key: (typeof EXPORTS)[number]['key']) => {
    setExporting(key);
    try {
      await downloadAdminCsv(key);
      toast.success(`${key} exported`);
      setOpenDownload(false);
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const pageTitle =
    nav.find((n) => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))
      ?.label || 'Admin';

  const unread = notifications.length;

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 flex">
      <aside className="w-64 shrink-0 bg-[#12161c] border-r border-white/5 flex flex-col">
        <div className="px-6 py-5 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-[#2F6B52] flex items-center justify-center text-sm font-bold text-white">
              R
            </span>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                Rexus <span className="text-[#C4A227]">Gift</span>
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition',
                  active
                    ? 'bg-[#2F6B52]/20 text-[#5aa882] font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
                )}
              >
                <item.icon size={18} className="shrink-0 opacity-80" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200"
          >
            <Store size={18} />
            View shop
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/5 hover:text-red-400"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 bg-[#1a2332] border-b border-[#2a3544] shadow-sm">
          <h1 className="text-sm font-semibold text-white tracking-tight shrink-0">{pageTitle}</h1>

          <div className="flex-1 flex justify-center px-2">
            <LiveClock />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setOpenNotif((v) => !v)}
                className="relative p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#C4A227] text-[10px] font-bold text-[#1a3b2e] flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {openNotif && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-xl border border-white/10 bg-[#1a2332] shadow-xl z-50">
                  <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                    <p className="text-xs font-semibold text-white">Notifications</p>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] text-[#C4A227] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-gray-500 text-center">All clear</p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => {
                          markRead(n.id);
                          setOpenNotif(false);
                        }}
                        className="block px-4 py-3 border-b border-white/5 hover:bg-white/5 transition"
                      >
                        <p className="text-sm text-white font-medium">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                        {n.time && <p className="text-[10px] text-gray-600 mt-1">{n.time}</p>}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Download */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpenDownload((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-200 transition"
              >
                <Download size={14} className="text-[#C4A227]" />
                <span className="hidden sm:inline">Download</span>
                <ChevronDown size={14} className={cn('text-gray-400 transition', openDownload && 'rotate-180')} />
              </button>
              {openDownload && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-[#1a2332] shadow-xl py-1.5 z-50">
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500">Export CSV</p>
                  {EXPORTS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      disabled={exporting === item.key}
                      onClick={() => runExport(item.key)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white disabled:opacity-50"
                    >
                      <FileSpreadsheet size={14} className="text-gray-500" />
                      {exporting === item.key ? 'Exporting…' : item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
