'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
  { href: '/occasions', label: 'Occasions' },
  { href: '/shop?recipient=for-her', label: 'For Her' },
  { href: '/shop?recipient=for-him', label: 'For Him' },
  { href: '/shop?category=corporate-gifts', label: 'Corporate' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      {/* Top bar */}
      <div className="bg-jungle-500 text-white text-center text-sm py-1.5 px-4">
        Free delivery on orders over KSh 5,000 within Nairobi · Same-day available
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl lg:text-3xl font-serif font-bold text-jungle-500 tracking-tight">
              Rexus
            </span>
            <span className="text-gold-500 text-lg lg:text-xl font-medium">Gift</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-jungle-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              className="p-2 hover:bg-gray-50 rounded-full transition"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search size={20} className="text-gray-600" />
            </button>
            <Link href="/wishlist" className="p-2 hover:bg-gray-50 rounded-full transition hidden sm:block" aria-label="Wishlist">
              <Heart size={20} className="text-gray-600" />
            </Link>
            <Link href="/account" className="p-2 hover:bg-gray-50 rounded-full transition" aria-label="Account">
              <User size={20} className="text-gray-600" />
            </Link>
            <Link href="/cart" className="relative p-2 hover:bg-gray-50 rounded-full transition" aria-label="Cart">
              <ShoppingBag size={20} className="text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-4">
            <form action="/shop" className="relative">
              <input
                type="search"
                name="search"
                placeholder="Search gifts, flowers, hampers..."
                className="w-full border border-gray-200 rounded-full py-2.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-jungle-500/30 focus:border-jungle-500"
                autoFocus
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 top-[calc(4rem+28px)] bg-white z-40 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <nav className="flex flex-col p-6 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-lg font-medium text-gray-800 border-b border-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
