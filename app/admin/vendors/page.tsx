'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { downloadAdminCsv } from '@/lib/export';

export default function AdminVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    county: '',
    town: '',
    address: '',
    warehouseName: '',
    warehouseAddress: '',
    notes: '',
  });

  const load = () => {
    setLoading(true);
    api
      .get('/admin/vendors', { params: { search: search || undefined, limit: 50 } })
      .then((r) => setVendors(r.data.data || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/vendors', form);
      toast.success('Vendor created');
      setShowForm(false);
      setForm({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        county: '',
        town: '',
        address: '',
        warehouseName: '',
        warehouseAddress: '',
        notes: '',
      });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-white">Vendors</h2>
        <button
          type="button"
          onClick={async () => {
            try {
              const token = localStorage.getItem('accessToken');
              const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
              const res = await fetch(`${base}/admin/vendors/export`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (!res.ok) throw new Error('Export failed');
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'rexus-vendors.csv';
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Export downloaded');
            } catch (e: any) {
              toast.error(e.message || 'Export failed');
            }
          }}
          className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="ml-auto text-sm px-4 py-2 rounded-xl bg-[#2F6B52] text-white font-medium"
        >
          {showForm ? 'Cancel' : '+ Add vendor'}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors…"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-300"
        >
          Search
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="rounded-2xl border border-white/5 bg-[#161b22] p-5 grid sm:grid-cols-2 gap-3">
          <input required placeholder="Company / vendor name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white sm:col-span-2" />
          <input placeholder="Contact person (first & last)" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          <input placeholder="County" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          <input placeholder="Town" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white sm:col-span-2" />
          <input placeholder="Warehouse name" value={form.warehouseName} onChange={(e) => setForm({ ...form, warehouseName: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          <input placeholder="Warehouse address" value={form.warehouseAddress} onChange={(e) => setForm({ ...form, warehouseAddress: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white sm:col-span-2" />
          <button type="submit" disabled={saving} className="sm:col-span-2 py-2.5 rounded-xl bg-[#2F6B52] text-white text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving…' : 'Create vendor'}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
        {loading ? (
          <div className="p-8 text-gray-500 text-sm">Loading…</div>
        ) : vendors.length === 0 ? (
          <div className="p-8 text-gray-500 text-sm">No vendors yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{v.vendorCode}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/vendors/${v.id}`} className="text-[#5aa882] hover:underline font-medium">
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <div>{v.contactPerson || '—'}</div>
                    <div className="text-xs">{v.phone || v.email || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {[v.town, v.county].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{v.productCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.isActive ? 'bg-[#2F6B52]/20 text-[#5aa882]' : 'bg-red-500/20 text-red-400'}`}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
