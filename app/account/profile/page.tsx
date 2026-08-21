'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('user');
    if (!token || !stored) {
      router.push('/login');
      return;
    }
    try {
      const u = JSON.parse(stored);
      setForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        phone: u.phone || '',
        email: u.email || '',
      });
    } catch {
      router.push('/login');
    }
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch('/users/me', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });
      const u = res.data.data || { ...JSON.parse(localStorage.getItem('user') || '{}'), ...form };
      localStorage.setItem('user', JSON.stringify(u));
      toast.success('Profile updated');
    } catch (err: any) {
      // local fallback
      const prev = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...prev, ...form }));
      toast.message(err.response?.data?.message || 'Saved on this device');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <Link href="/account" className="text-sm text-[#2F6B52] hover:underline">← Account</Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit profile</h1>
      <form onSubmit={save} className="mt-6 space-y-3">
        <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" required />
        <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" required />
        <input className="w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50" value={form.email} disabled />
        <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
        <button type="submit" className="w-full py-3 rounded-xl bg-[#2F6B52] text-white font-medium">Save changes</button>
      </form>
    </div>
  );
}
