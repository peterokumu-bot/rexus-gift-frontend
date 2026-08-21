'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AddressesPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    label: 'Home',
    phone: '',
    county: 'Nairobi',
    town: '',
    building: '',
    street: '',
    isDefault: true,
  });

  const load = () => {
    api
      .get('/users/me/addresses')
      .then((r) => setList(r.data.data || r.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/me/addresses', form);
      toast.success('Address saved');
      setForm({ label: 'Home', phone: '', county: 'Nairobi', town: '', building: '', street: '', isDefault: true });
      load();
    } catch (err: any) {
      // Fallback: store locally if API missing
      const local = [...list, { ...form, id: `local-${Date.now()}` }];
      localStorage.setItem('rexus_addresses', JSON.stringify(local));
      setList(local);
      toast.message(err.response?.data?.message || 'Saved locally — connect addresses API for sync');
    }
  };

  useEffect(() => {
    if (!loading && list.length === 0) {
      try {
        const raw = localStorage.getItem('rexus_addresses');
        if (raw) setList(JSON.parse(raw));
      } catch {}
    }
  }, [loading, list.length]);

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <Link href="/account" className="text-sm text-[#2F6B52] hover:underline">← Account</Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Delivery addresses</h1>

      <ul className="mt-6 space-y-3">
        {list.map((a) => (
          <li key={a.id} className="border border-gray-100 rounded-2xl p-4 text-sm">
            <p className="font-medium">{a.label || 'Address'} {a.isDefault && <span className="text-[#2F6B52] text-xs">Default</span>}</p>
            <p className="text-gray-600 mt-1">
              {[a.building, a.street, a.town, a.county].filter(Boolean).join(', ')}
            </p>
            {a.phone && <p className="text-gray-500">{a.phone}</p>}
          </li>
        ))}
        {!list.length && !loading && (
          <p className="text-sm text-gray-500">No addresses yet. Add one below for faster checkout.</p>
        )}
      </ul>

      <form onSubmit={save} className="mt-8 space-y-3 border border-gray-100 rounded-2xl p-5">
        <h2 className="font-semibold">Add address</h2>
        <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Label (Home, Office)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Phone *" value={form.phone} required onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="County" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} />
        <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Town / area" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} required />
        <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
        <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Street / landmark" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
        <button type="submit" className="w-full py-2.5 rounded-xl bg-[#2F6B52] text-white text-sm font-medium">Save address</button>
      </form>
    </div>
  );
}
