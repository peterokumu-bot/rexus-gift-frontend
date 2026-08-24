'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut, ChevronDown, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const mainNav = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=flowers', label: 'Flowers' },
  { href: '/shop?category=gift-hampers', label: 'Hampers' },
  { href: '/shop?recipient=for-her', label: 'For Her' },
  { href: '/shop?recipient=for-him', label: 'For Him' },
  { href: '/shop?category=corporate-gifts', label: 'Corporate' },
];

const shopNav = [
  { href: '/shop', label: 'All gifts' },
  { href: '/shop?occasion=birthday', label: 'Birthday' },
  { href: '/shop?occasion=anniversary', label: 'Anniversary' },
  { href: '/shop?occasion=valentines-day', label: "Valentine's" },
  { href: '/shop?occasion=wedding', label: 'Wedding' },
  { href: '/shop?occasion=graduation', label: 'Graduation' },
  { href: '/shop?tag=bestseller', label: 'Bestsellers' },
  { href: '/shop?tag=new-arrival', label: 'New' },
];

function cartCountFromResponse(data: any): number {
  if (!data) return 0;
  if (typeof data.itemCount === 'number') return data.itemCount;
  if (Array.isArray(data.items)) {
    return data.items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
  }
  return 0;
}

export function Header() {
  const [brand, setBrand] = useState<{
    logo?: string;
    storeName?: string;
    tagline?: string;
    titleColor?: string;
    taglineColor?: string;
    titleFont?: string;
  }>({});

  useEffect(() => {
    const apply = (b: any) => {
      if (!b || typeof b !== 'object') return;
      setBrand(b);
      if (b.titleColor) document.documentElement.style.setProperty('--brand-title', b.titleColor);
      if (b.taglineColor) document.documentElement.style.setProperty('--brand-tagline', b.taglineColor);
      if (b.titleFont) document.documentElement.style.setProperty('--brand-font', b.titleFont);
    };
    api
      .get('/settings/public?keys=branding')
      .then((res) => apply(res.data?.data?.branding))
      .catch(() => {});
    const onBrand = (e: any) => apply(e.detail);
    window.addEventListener('rexus-branding', onBrand);
    return () => window.removeEventListener('rexus-branding', onBrand);
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  const loadNotifications = () => {
    if (!localStorage.getItem('accessToken')) {
      setNotifications([]);
      setUnreadNotif(0);
      return;
    }
    api
      .get('/notifications')
      .then((res) => {
        setNotifications(res.data?.data?.items || []);
        setUnreadNotif(res.data?.data?.unread || 0);
      })
      .catch(() => {});
  };

  const refreshCart = () => {
    api
      .get('/cart')
      .then((res) => setCartCount(cartCountFromResponse(res.data?.data)))
      .catch(() => setCartCount(0));
  };

  useEffect(() => {
    // Ensure guest session exists before first cart call
    if (typeof window !== 'undefined' && !localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', crypto.randomUUID());
    }

    refreshCart();
    loadNotifications();

    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    const onFocus = () => refreshCart();
    const onCartUpdated = () => refreshCart();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'user' || e.key === 'sessionId') refreshCart();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('cart-updated', onCartUpdated);
    window.addEventListener('storage', onStorage);

    // Refresh when navigating between pages
    refreshCart();

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('cart-updated', onCartUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setAccountOpen(false);
    window.location.href = '/';
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    if (!q) return;
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(`/shop?search=${encodeURIComponent(q)}`);
  };

  // Hide header chrome on admin
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="bg-[#2F6B52] text-white text-center text-xs sm:text-sm py-1.5 px-4">
        Free delivery on orders over KSh 5,000 within Nairobi · Same-day available
      </div>

      <div className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          <button
            className="lg:hidden p-2 -ml-1 text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo}
                alt={brand.storeName || 'Rexus Gift'}
                className="h-8 sm:h-9 w-auto object-contain max-w-[48px] sm:max-w-[56px] rounded"
              />
            ) : null}
            <span className="flex flex-col min-w-0 leading-tight">
              <span
                className="text-lg sm:text-xl font-bold tracking-tight truncate"
                style={{
                  color: brand.titleColor || '#111827',
                  fontFamily: brand.titleFont || 'inherit',
                }}
              >
                {brand.storeName || 'Rexus Gift'}
              </span>
              {brand.tagline ? (
                <span
                  className="text-[10px] sm:text-xs truncate max-w-[160px]"
                  style={{
                    color: brand.taglineColor || '#C4A227',
                    fontFamily: brand.titleFont || 'inherit',
                  }}
                >
                  {brand.tagline}
                </span>
              ) : null}
            </span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="flex w-full border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-[#2F6B52]/40">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search gifts, flowers, hampers…"
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <button type="submit" className="px-3 bg-[#2F6B52] text-white hover:bg-[#275a45]">
                <Search size={18} />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <Link href="/account" className="hidden sm:flex p-2 text-gray-700 hover:text-[#2F6B52]" aria-label="Account">
              {user ? <User size={20} /> : <User size={20} />}
            </Link>

            <Link href="/account" className="hidden sm:flex p-2 text-gray-700 hover:text-[#2F6B52]" aria-label="Wishlist">
              <Heart size={20} />
            </Link>

            
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    loadNotifications();
                  }}
                  className="relative p-2 text-gray-700 hover:text-[#2F6B52]"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadNotif > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#C4A227] text-[10px] font-bold text-[#1a3b2e] flex items-center justify-center">
                      {unreadNotif > 9 ? '9+' : unreadNotif}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl z-50">
                    <div className="px-3 py-2 flex justify-between items-center border-b">
                      <p className="text-xs font-semibold text-gray-900">Notifications</p>
                      {unreadNotif > 0 && (
                        <button
                          type="button"
                          className="text-[10px] text-[#2F6B52]"
                          onClick={() => {
                            api.patch('/notifications/read-all').then(() => loadNotifications());
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet</p>
                    ) : (
                      notifications.map((n: any) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            api.patch(`/notifications/${n.id}/read`).finally(() => {
                              loadNotifications();
                              const oid = n.data?.orderId;
                              if (oid) window.location.href = `/orders/${oid}`;
                              setNotifOpen(false);
                            });
                          }}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                            n.isRead ? '' : 'bg-[#2F6B52]/5'
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-900">{n.subject}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString('en-KE')}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
<Link href="/cart" className="relative p-2 text-gray-700 hover:text-[#2F6B52]" aria-label="Cart">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center rounded-full bg-[#C4A227] text-[#1a3b2e] text-[10px] font-bold leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            <div className="relative hidden sm:block">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-1 p-2 text-sm text-gray-700 hover:text-[#2F6B52]"
              >
                <span className="max-w-[7rem] truncate">{user ? user.firstName : 'Account'}</span>
                <ChevronDown size={14} />
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 text-sm">
                    {user ? (
                      <>
                        <Link href="/account" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setAccountOpen(false)}>
                          My account
                        </Link>
                        <Link href="/account/orders" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setAccountOpen(false)}>
                          Orders
                        </Link>
                        {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                          <Link href="/admin" className="block px-4 py-2 hover:bg-gray-50 text-[#2F6B52]" onClick={() => setAccountOpen(false)}>
                            Admin
                          </Link>
                        )}
                        <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2">
                          <LogOut size={14} /> Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setAccountOpen(false)}>
                          Sign in
                        </Link>
                        <Link href="/register" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setAccountOpen(false)}>
                          Create account
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <form onSubmit={submitSearch} className="md:hidden pb-3">
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search gifts…"
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <button type="submit" className="px-3 bg-[#2F6B52] text-white">
                <Search size={18} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Primary nav */}
      <nav className="hidden lg:block border-t border-gray-100 bg-white">
        <div className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6">
          <ul className="flex items-center gap-1 h-11 overflow-x-auto">
            {mainNav.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md transition',
                    pathname === link.href
                      ? 'text-[#2F6B52] bg-[#2F6B52]/10'
                      : 'text-gray-700 hover:text-[#2F6B52] hover:bg-gray-50',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Shop navigators */}
      <div className="border-t border-gray-100 bg-[#f7f8f8]">
        <div className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-thin">
            <span className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold shrink-0 pr-2">
              Browse
            </span>
            {shopNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 px-2.5 py-1 text-xs sm:text-sm text-gray-700 hover:text-[#2F6B52] hover:bg-white rounded-full border border-transparent hover:border-gray-200 transition whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {mainNav.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
            <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
              Occasions
            </p>
            {shopNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              {user ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm">My account</Link>
                  <button onClick={logout} className="block w-full text-left px-3 py-2.5 text-sm text-red-600">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm">Sign in</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Re-export for existing imports
export { notifyCartUpdated } from '@/lib/cart';
