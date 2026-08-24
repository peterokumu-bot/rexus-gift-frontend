'use client';

import { usePathname } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Full-page views without admin chrome (login + printable invoice)
  if (pathname === '/admin/login' || pathname?.startsWith('/admin/invoices')) {
    return <>{children}</>;
  }
  return <AdminShell>{children}</AdminShell>;
}
