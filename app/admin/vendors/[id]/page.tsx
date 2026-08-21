'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function AdminVendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get(`/admin/vendors/${id}`)
      .then((r) => {
        setVendor(r.data.data);
        setForm(r.data.data);
      })
      .catch(() => {
        toast.error('Vendor not found');
        setVendor(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [id, router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/vendors/${id}`, form);
      toast.success('Vendor updated');
      setEditing(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />;
  }
  if (!vendor) {
    return (
      <div className="text-center py-16">
        <Link href="/admin/vendors" className="text-[#5aa882] hover:underline">← Vendors</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/vendors" className="text-sm text-gray-500 hover:text-[#5aa882]">← Vendors</Link>
          <h2 className="mt-1 text-xl font-semibold text-white">{vendor.name}</h2>
          <p className="text-xs font-mono text-gray-500 mt-1">{vendor.vendorCode}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="text-sm px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <form onSubmit={save} className="rounded-2xl border border-white/5 bg-[#161b22] p-5 grid sm:grid-cols-2 gap-3">
          {['name', 'contactPerson', 'email', 'phone', 'altPhone', 'website', 'county', 'town', 'address', 'warehouseName', 'warehouseAddress'].map((k) => (
            <input
              key={k}
              placeholder={k}
              value={form[k] || ''}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            />
          ))}
          <textarea
            placeholder="notes"
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white sm:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-gray-300 sm:col-span-2">
            <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
          <button type="submit" disabled={saving} className="sm:col-span-2 py-2.5 rounded-xl bg-[#2F6B52] text-white text-sm font-medium">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5 text-sm space-y-2">
            <h3 className="font-semibold text-white mb-2">Contact</h3>
            <p className="text-gray-400">Person: <span className="text-gray-200">{vendor.contactPerson || '—'}</span></p>
            <p className="text-gray-400">Email: <span className="text-gray-200">{vendor.email || '—'}</span></p>
            <p className="text-gray-400">Phone: <span className="text-gray-200">{vendor.phone || '—'}</span></p>
            <p className="text-gray-400">Alt: <span className="text-gray-200">{vendor.altPhone || '—'}</span></p>
            <p className="text-gray-400">Web: <span className="text-gray-200">{vendor.website || '—'}</span></p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5 text-sm space-y-2">
            <h3 className="font-semibold text-white mb-2">Location & warehouse</h3>
            <p className="text-gray-400">County: <span className="text-gray-200">{vendor.county || '—'}</span></p>
            <p className="text-gray-400">Town: <span className="text-gray-200">{vendor.town || '—'}</span></p>
            <p className="text-gray-400">Address: <span className="text-gray-200">{vendor.address || '—'}</span></p>
            <p className="text-gray-400">Warehouse: <span className="text-gray-200">{vendor.warehouseName || '—'}</span></p>
            <p className="text-gray-400">WH address: <span className="text-gray-200">{vendor.warehouseAddress || '—'}</span></p>
          </div>
          {vendor.notes && (
            <div className="sm:col-span-2 rounded-2xl border border-white/5 bg-[#161b22] p-5 text-sm text-gray-400">
              {vendor.notes}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">
            Products supplied ({vendor.products?.length || 0})
          </h3>
        </div>
        {!vendor.products?.length ? (
          <p className="p-6 text-sm text-gray-500">No products linked. Assign this vendor when creating/editing a product.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                <th className="px-5 py-2">SKU</th>
                <th className="px-5 py-2">Name</th>
                <th className="px-5 py-2">Stock</th>
                <th className="px-5 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {vendor.products.map((p: any) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="px-5 py-3 text-gray-200">{p.name}</td>
                  <td className="px-5 py-3 text-gray-400">{p.stock}</td>
                  <td className="px-5 py-3 text-white">{formatKES(p.sellingPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
