'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Sparkles, RefreshCw,
  Package, Banknote, Tags, Search, ImagePlus, Upload,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatKES } from '@/lib/utils';

type ProductForm = {
  name: string;
  sku: string;
  vendorId: string;
  slug: string;
  description: string;
  shortDescription: string;
  sellingPrice: string;
  buyingPrice: string;
  compareAtPrice: string;
  stock: string;
  lowStockAlert: string;
  status: string;
  featured: boolean;
  isPersonalized: boolean;
  isActive: boolean;
  categoryIds: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  weight: string;
  dimensions: string;
  colors: string[];
  sizes: string[];
  imageUrls: string[];
};

const emptyForm: ProductForm = {
  name: '', sku: '', vendorId: '', slug: '', description: '', shortDescription: '',
  sellingPrice: '', buyingPrice: '', compareAtPrice: '', stock: '0', lowStockAlert: '5',
  status: 'ACTIVE', featured: false, isPersonalized: false, isActive: true, categoryIds: [],
  seoTitle: '', seoDescription: '', seoKeywords: '',
  weight: '', dimensions: '', colors: [], sizes: [], imageUrls: [],
};

const STEPS = [
  { id: 1, label: 'Basics', icon: Package },
  { id: 2, label: 'Pricing', icon: Banknote },
  { id: 3, label: 'Media', icon: ImagePlus },
  { id: 4, label: 'Organize', icon: Tags },
  { id: 5, label: 'SEO', icon: Search },
];

const COLOR_PRESETS = ['Black', 'White', 'Red', 'Pink', 'Gold', 'Silver', 'Green', 'Blue', 'Purple', 'Brown', 'Beige', 'Multicolor'];
const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Custom'];

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}
function generateSku(name: string) {
  const prefix = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).slice(0, 3).map((w) => w.slice(0, 3).toUpperCase()).join('');
  return `RX-${prefix || 'PRD'}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
function generateDescription(form: ProductForm, categoryNames: string[]) {
  const name = form.name || 'This gift';
  const cats = categoryNames.length ? categoryNames.join(', ') : 'premium gifts';
  const price = form.sellingPrice ? `Priced at KSh ${Number(form.sellingPrice).toLocaleString('en-KE')}.` : '';
  const short = form.shortDescription ? `${form.shortDescription} ` : '';
  const attrs = [
    form.colors.length ? `Available colours: ${form.colors.join(', ')}.` : '',
    form.sizes.length ? `Sizes: ${form.sizes.join(', ')}.` : '',
    form.weight ? `Weight: ${form.weight} kg.` : '',
  ].filter(Boolean).join(' ');
  return `${name} is a thoughtfully curated choice from Rexus Gift, perfect for ${cats}. ${short}\n\nCrafted for memorable moments, this product combines quality presentation with reliable delivery across Kenya. Ideal for birthdays, anniversaries, corporate appreciation, or simply showing someone you care.\n\n${attrs}\n${price}\n\nOrder online from Rexus Gift for secure checkout, careful packaging, and timely delivery.`.trim();
}
function parseDims(dim?: string | null) {
  if (!dim) return { physical: '', colors: [] as string[], sizes: [] as string[] };
  const colors: string[] = [];
  const sizes: string[] = [];
  let physical = dim;
  dim.split('|').forEach((part) => {
    const p = part.trim();
    if (p.toLowerCase().startsWith('colors:')) {
      colors.push(...p.slice(7).split(',').map((c) => c.trim()).filter(Boolean));
      physical = physical.replace(part, '').replace(/\|\s*\|/g, '|').replace(/^\||\|$/g, '').trim();
    } else if (p.toLowerCase().startsWith('sizes:')) {
      sizes.push(...p.slice(6).split(',').map((c) => c.trim()).filter(Boolean));
      physical = physical.replace(part, '').replace(/\|\s*\|/g, '|').replace(/^\||\|$/g, '').trim();
    }
  });
  return { physical: physical.replace(/\s*\|\s*$/, '').trim(), colors, sizes };
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/50 focus:border-[#2F6B52]/40 transition';

export default function AdminProductsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [step, setStep] = useState(1);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [skuLocked, setSkuLocked] = useState(false);
  const [slugLocked, setSlugLocked] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const selectedCategoryNames = useMemo(
    () => categories.filter((c) => form.categoryIds.includes(c.id)).map((c) => c.name),
    [categories, form.categoryIds],
  );

  const load = (q = search) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (q) params.set('search', q);
    api.get(`/products/admin/all?${params}`)
      .then((res) => { setProducts(res.data.data || []); setMeta(res.data.meta || { total: 0 }); })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/admin/vendors/options').then((r) => setVendors(r.data.data || [])).catch(() => {});

    if (!localStorage.getItem('accessToken')) { router.push('/login'); return; }
    load();
    api.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, [router]);

  const openCreate = () => {
    setEditingId(null); setForm(emptyForm); setStep(1); setSkuLocked(false); setSlugLocked(false); setModalOpen(true);
  };

  const openEdit = (p: any) => {
    const parsed = parseDims(p.dimensions);
    setEditingId(p.id);
    setForm({
      name: p.name || '', sku: p.sku,
      vendorId: p.vendorId || '', slug: p.slug || '',
      description: p.description || '', shortDescription: p.shortDescription || '',
      sellingPrice: String(p.sellingPrice ?? ''), buyingPrice: String(p.buyingPrice ?? ''),
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : '',
      stock: String(p.stock ?? 0), lowStockAlert: String(p.lowStockAlert ?? 5),
      status: p.status || 'ACTIVE', featured: !!p.featured, isPersonalized: !!p.isPersonalized, isActive: p.isActive !== false,
      categoryIds: p.categories?.map((c: any) => c.id) || [],
      seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '', seoKeywords: p.seoKeywords || '',
      weight: p.weight != null ? String(p.weight) : '',
      dimensions: parsed.physical,
      colors: parsed.colors,
      sizes: parsed.sizes,
      imageUrls: (p.images || []).map((img: any) => img.url).filter(Boolean),
    });
    setStep(1); setSkuLocked(true); setSlugLocked(true); setModalOpen(true);
  };

  const closeModal = () => { if (saving) return; setModalOpen(false); setEditingId(null); setForm(emptyForm); setStep(1); };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') { setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked })); return; }
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'name' && !editingId) {
        if (!skuLocked) next.sku = generateSku(value);
        if (!slugLocked) next.slug = slugify(value);
      }
      return next;
    });
  };

  
  const createCategoryInline = async () => {
    if (!newCatName.trim()) {
      toast.error('Category name required');
      return;
    }
    setAddingCat(true);
    try {
      const res = await api.post('/categories', {
        name: newCatName.trim(),
        parentId: newCatParent || null,
      });
      const cat = res.data.data;
      setCategories((prev: any[]) => [...prev, cat]);
      setForm((f) => ({ ...f, categoryIds: [...f.categoryIds, cat.id] }));
      setNewCatName('');
      setNewCatParent('');
      toast.success('Category added');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to add category');
    } finally {
      setAddingCat(false);
    }
  };

  const toggleChip = (field: 'colors' | 'sizes', value: string) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter((x) => x !== value) : [...f[field], value],
    }));
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 8);
    setUploading(true);
    try {
      // Try multipart first
      try {
        const fd = new FormData();
        list.forEach((f) => fd.append('files', f));
        const res = await api.post('/upload/images', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const urls: string[] = res.data.data?.urls || [];
        if (urls.length) {
          setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...urls].slice(0, 8) }));
          toast.success(`${urls.length} image(s) uploaded`);
          return;
        }
      } catch {
        // fallback to base64
      }
      const images = await Promise.all(
        list.map(async (f) => ({ data: await fileToBase64(f), name: f.name })),
      );
      const res = await api.post('/upload/images-base64', { images });
      const urls: string[] = res.data.data?.urls || [];
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...urls].slice(0, 8) }));
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed — paste an image URL instead');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addImageUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    try { new URL(u); } catch { toast.error('Invalid URL'); return; }
    setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, u].slice(0, 8) }));
    setUrlInput('');
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }));
  };

  const runAiDescription = async () => {
    if (!form.name.trim()) { toast.error('Enter a product name first'); return; }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 500));
    const text = generateDescription(form, selectedCategoryNames);
    setForm((f) => ({
      ...f,
      description: text,
      shortDescription: f.shortDescription || `${f.name} — a premium gift from Rexus Gift.`,
      seoTitle: f.seoTitle || `${f.name} | Rexus Gift`,
      seoDescription: f.seoDescription || `Shop ${f.name} at Rexus Gift. Delivered across Kenya.`.slice(0, 160),
      seoKeywords: f.seoKeywords || [f.name, 'gift Kenya', 'Rexus Gift', ...f.colors].filter(Boolean).join(', '),
    }));
    setGenerating(false);
    toast.success('Description generated');
  };

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!form.name.trim()) { toast.error('Product name is required'); return false; }
      if (!form.sku.trim()) { toast.error('SKU is required'); return false; }
    }
    if (s === 2) {
      const sp = parseFloat(form.sellingPrice);
      const bp = parseFloat(form.buyingPrice);
      if (isNaN(sp) || sp < 0 || isNaN(bp) || bp < 0) { toast.error('Valid prices required'); return false; }
    }
    return true;
  };

  const nextStep = () => { if (!validateStep(step)) return; setStep((s) => Math.min(5, s + 1)); };
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const save = async () => {
    if (!validateStep(1) || !validateStep(2)) { setStep(1); return; }
    // Fold colors/sizes into dimensions (backend whitelist-safe)
    const dimParts: string[] = [];
    if (form.dimensions.trim()) dimParts.push(form.dimensions.trim());
    if (form.colors.length) dimParts.push(`colors:${form.colors.join(',')}`);
    if (form.sizes.length) dimParts.push(`sizes:${form.sizes.join(',')}`);

    const payload: any = {
      name: form.name.trim(),
      sku: form.sku,
        vendorId: form.vendorId || null.trim(),
      slug: form.slug || undefined,
      description: form.description || undefined,
      shortDescription: form.shortDescription || undefined,
      sellingPrice: parseFloat(form.sellingPrice),
      buyingPrice: parseFloat(form.buyingPrice),
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
      stock: parseInt(form.stock, 10) || 0,
      lowStockAlert: parseInt(form.lowStockAlert, 10) || 5,
      status: form.status,
      featured: form.featured,
      isPersonalized: form.isPersonalized,
      isActive: form.isActive,
      categoryIds: form.categoryIds.length ? form.categoryIds : undefined,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      seoKeywords: form.seoKeywords || undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      dimensions: dimParts.length ? dimParts.join(' | ') : undefined,
      imageUrls: form.imageUrls.length ? form.imageUrls : undefined,
    };
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      closeModal();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Deleted');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Products</h2>
          <p className="text-sm text-gray-500">{meta.total} products</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(search)} placeholder="Search products..." className={`${inputCls} sm:w-52`} />
          <div className="flex gap-2">
            <button onClick={() => load(search)} className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-xl">Search</button>
            <button onClick={openCreate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#2F6B52] hover:bg-[#275a45] text-white text-sm font-medium px-4 py-2.5 rounded-xl">
              <Plus size={16} /> Add product
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
        <div className="md:hidden divide-y divide-white/5">
          {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No products yet</div>
          ) : products.map((p) => (
            <div key={p.id} className="p-4 space-y-2">
              <div className="flex gap-3">
                {p.images?.[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="w-14 h-14 rounded-lg object-cover bg-white/5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.sku}</p>
                  <p className="text-sm text-white mt-0.5">{formatKES(p.sellingPrice)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="flex-1 py-2 rounded-lg bg-white/5 text-sm text-gray-300">Edit</button>
                <button onClick={() => remove(p.id, p.name)} className="px-3 py-2 rounded-lg bg-white/5 text-red-400 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No products. <button onClick={openCreate} className="text-[#5aa882] hover:underline">Create one</button></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-white/5">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-600"><Package size={16} /></div>
                        )}
                        <Link href={`/product/${p.slug}`} className="font-medium text-white hover:text-[#5aa882]">{p.name}</Link>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3 text-white">{formatKES(p.sellingPrice)}</td>
                    <td className="px-5 py-3"><span className={p.stock <= 5 ? 'text-orange-400 font-medium' : 'text-gray-300'}>{p.stock}</span></td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-400">{p.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><Pencil size={14} /></button>
                        <button onClick={() => remove(p.id, p.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full sm:max-w-xl max-h-[94vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-white/10 bg-[#12151c] shadow-2xl">
            <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit product' : 'New product'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Step {step} of 5 · {STEPS[step - 1].label}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"><X size={18} /></button>
            </div>

            <div className="shrink-0 px-3 sm:px-6 py-3 border-b border-white/5 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {STEPS.map((s) => {
                  const Icon = s.icon;
                  const active = step === s.id;
                  const done = step > s.id;
                  return (
                    <button key={s.id} type="button" onClick={() => { if (s.id < step || validateStep(step)) setStep(s.id); }}
                      className={`flex items-center gap-1.5 py-2 px-2.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-medium transition ${active ? 'bg-[#2F6B52] text-white' : done ? 'bg-[#2F6B52]/20 text-[#5aa882]' : 'bg-white/5 text-gray-500'}`}>
                      <Icon size={14} />
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
              {step === 1 && (
                <>
                  
              <div>
                <label className="block text-xs text-gray-400 mb-1">Vendor / supplier</label>
                <select
                  value={form.vendorId || ''}
                  onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                  className={inputCls}
                >
                  <option value="" className="bg-[#161b22]">— None —</option>
                  {vendors.map((v: any) => (
                    <option key={v.id} value={v.id} className="bg-[#161b22]">
                      {v.vendorCode} · {v.name}
                    </option>
                  ))}
                </select>
              </div>
<div>
                    <label className="block text-xs text-gray-400 mb-1.5">Product name *</label>
                    <input name="name" required value={form.name} onChange={onChange} placeholder="e.g. Red Rose Bouquet" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">SKU *</label>
                    <div className="flex gap-2">
                      <input name="sku" required value={form.sku} onChange={(e) => { setSkuLocked(true); onChange(e); }} className={`${inputCls} font-mono`} />
                      <button type="button" onClick={() => { setForm((f) => ({ ...f, sku: generateSku(f.name || 'Product') })); setSkuLocked(false); }} className="shrink-0 px-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10"><RefreshCw size={16} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Short description</label>
                    <input name="shortDescription" value={form.shortDescription} onChange={onChange} className={inputCls} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-400">Full description</label>
                      <button type="button" onClick={runAiDescription} disabled={generating} className="flex items-center gap-1.5 text-xs font-medium text-[#C4A227] hover:text-[#d4b84a] disabled:opacity-50">
                        <Sparkles size={14} />{generating ? 'Generating...' : 'AI write description'}
                      </button>
                    </div>
                    <textarea name="description" rows={4} value={form.description} onChange={onChange} className={inputCls} />
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Selling price (KES) *</label>
                    <input name="sellingPrice" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={onChange} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Buying price (KES) *</label>
                    <input name="buyingPrice" type="number" min="0" step="0.01" value={form.buyingPrice} onChange={onChange} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Compare-at price</label>
                    <input name="compareAtPrice" type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={onChange} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Stock</label>
                    <input name="stock" type="number" min="0" value={form.stock} onChange={onChange} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Low-stock alert</label>
                    <input name="lowStockAlert" type="number" min="0" value={form.lowStockAlert} onChange={onChange} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Status</label>
                    <select name="status" value={form.status} onChange={onChange} className={inputCls}>
                      <option value="ACTIVE" className="bg-[#12151c]">Active</option>
                      <option value="DRAFT" className="bg-[#12151c]">Draft</option>
                      <option value="OUT_OF_STOCK" className="bg-[#12151c]">Out of stock</option>
                      <option value="ARCHIVED" className="bg-[#12151c]">Archived</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Images (max 8)</label>
                    <div
                      className="border border-dashed border-white/15 rounded-2xl p-6 text-center hover:border-[#2F6B52]/50 transition cursor-pointer bg-white/[0.02]"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
                    >
                      <Upload className="mx-auto text-gray-500 mb-2" size={28} />
                      <p className="text-sm text-gray-300">{uploading ? 'Uploading...' : 'Click or drag images here'}</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP · up to 5MB each</p>
                      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Or paste image URL" className={inputCls} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())} />
                      <button type="button" onClick={addImageUrl} className="shrink-0 px-4 rounded-xl bg-white/5 text-sm text-gray-300 hover:bg-white/10">Add</button>
                    </div>
                    {form.imageUrls.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {form.imageUrls.map((url, i) => (
                          <div key={url + i} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            {i === 0 && <span className="absolute top-1 left-1 text-[9px] bg-[#2F6B52] text-white px-1.5 py-0.5 rounded">Primary</span>}
                            <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Weight (kg)</label>
                      <input name="weight" type="number" min="0" step="0.01" value={form.weight} onChange={onChange} placeholder="0.5" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Dimensions</label>
                      <input name="dimensions" value={form.dimensions} onChange={onChange} placeholder="30x20x15 cm" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Colours</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((c) => (
                        <button key={c} type="button" onClick={() => toggleChip('colors', c)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition ${form.colors.includes(c) ? 'border-[#2F6B52] bg-[#2F6B52]/30 text-white' : 'border-white/10 text-gray-400'}`}>{c}</button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="Custom colour" className={inputCls}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (customColor.trim()) { toggleChip('colors', customColor.trim()); setCustomColor(''); } } }} />
                      <button type="button" onClick={() => { if (customColor.trim()) { toggleChip('colors', customColor.trim()); setCustomColor(''); } }} className="px-3 rounded-xl bg-white/5 text-sm text-gray-300">Add</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Sizes</label>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS.map((s) => (
                        <button key={s} type="button" onClick={() => toggleChip('sizes', s)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition ${form.sizes.includes(s) ? 'border-[#2F6B52] bg-[#2F6B52]/30 text-white' : 'border-white/10 text-gray-400'}`}>{s}</button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} placeholder="Custom size" className={inputCls}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (customSize.trim()) { toggleChip('sizes', customSize.trim()); setCustomSize(''); } } }} />
                      <button type="button" onClick={() => { if (customSize.trim()) { toggleChip('sizes', customSize.trim()); setCustomSize(''); } }} className="px-3 rounded-xl bg-white/5 text-sm text-gray-300">Add</button>
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button key={c.id} type="button"
                          onClick={() => setForm((f) => ({ ...f, categoryIds: f.categoryIds.includes(c.id) ? f.categoryIds.filter((id) => id !== c.id) : [...f.categoryIds, c.id] }))}
                          className={`text-xs px-3 py-1.5 rounded-full border transition ${form.categoryIds.includes(c.id) ? 'border-[#2F6B52] bg-[#2F6B52]/30 text-white' : 'border-white/10 text-gray-400'}`}>{c.name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" name="featured" checked={form.featured} onChange={onChange} className="rounded border-white/20 size-4" /> Featured
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" name="isPersonalized" checked={form.isPersonalized} onChange={onChange} className="rounded border-white/20 size-4" /> Personalized message
                    </label>
                    <label className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} className="rounded border-white/20 size-4" /> Visible in store
                    </label>
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">URL slug</label>
                    <input name="slug" value={form.slug} onChange={(e) => { setSlugLocked(true); onChange(e); }} className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">SEO title</label>
                    <input name="seoTitle" value={form.seoTitle} onChange={onChange} maxLength={70} className={inputCls} />
                    <p className="text-[11px] text-gray-500 mt-1">{form.seoTitle.length}/70</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">SEO description</label>
                    <textarea name="seoDescription" rows={3} value={form.seoDescription} onChange={onChange} maxLength={160} className={inputCls} />
                    <p className="text-[11px] text-gray-500 mt-1">{form.seoDescription.length}/160</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Keywords</label>
                    <input name="seoKeywords" value={form.seoKeywords} onChange={onChange} className={inputCls} />
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-white/5">
              <button type="button" onClick={prevStep} disabled={step === 1} className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-30">
                <ChevronLeft size={16} /> Back
              </button>
              {step < 5 ? (
                <button type="button" onClick={nextStep} className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#2F6B52] hover:bg-[#275a45]">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#2F6B52] hover:bg-[#275a45] disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
