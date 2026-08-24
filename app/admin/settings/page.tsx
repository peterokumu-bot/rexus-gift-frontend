'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ImagePlus,
  Plus,
  Trash2,
  FolderTree,
  LayoutGrid,
  Images,
  Palette,
} from 'lucide-react';
import api from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const DEFAULT_SECTIONS = {
  blocks: [
    {
      title: 'Shop by occasion',
      links: [
        { label: 'Birthday', href: '/shop?occasion=birthday', image: null as string | null },
        { label: 'Anniversary', href: '/shop?occasion=anniversary', image: null },
        { label: "Valentine's", href: '/shop?occasion=valentines-day', image: null },
        { label: 'Wedding', href: '/shop?occasion=wedding', image: null },
        { label: 'Graduation', href: '/shop?occasion=graduation', image: null },
        { label: 'Corporate', href: '/shop?search=corporate', image: null },
      ],
    },
    {
      title: 'Popular right now',
      links: [
        { label: 'Best sellers', href: '/shop?tag=bestseller', image: null },
        { label: 'New arrivals', href: '/shop?tag=new-arrival', image: null },
        { label: 'Under KSh 2,000', href: '/shop', image: null },
        { label: 'Personalized', href: '/shop?search=personalized', image: null },
        { label: 'Same-day Nairobi', href: '/shop', image: null },
        { label: 'Gift cards', href: '/shop', image: null },
      ],
    },
  ],
};

type Tab = 'categories' | 'homepage' | 'slider' | 'branding';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [slides, setSlides] = useState<{ image: string; title: string; subtitle: string; link: string }[]>([]);
  const [branding, setBranding] = useState({
    logo: '',
    favicon: '',
    storeName: 'Rexus Gift',
    tagline: '',
    titleColor: '#111827',
    taglineColor: '#C4A227',
    titleFont: 'system-ui',
  });
  const [subName, setSubName] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadCats = () => {
    setLoading(true);
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  };

  const loadSettings = async () => {
    try {
      const [sec, hero, brand] = await Promise.all([
        api.get('/settings/home_sections').catch(() => null),
        api.get('/settings/hero_slides').catch(() => null),
        api.get('/settings/branding').catch(() => null),
      ]);
      if (sec?.data?.data?.blocks) setSections(sec.data.data);
      if (Array.isArray(hero?.data?.data)) setSlides(hero.data.data);
      else if (hero?.data?.data?.slides) setSlides(hero.data.data.slides);
      if (brand?.data?.data) setBranding((b) => ({ ...b, ...brand.data.data }));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/admin/login');
      return;
    }
    loadCats();
    loadSettings();
  }, [router]);

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  const imgSrc = (image?: string | null) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `${API_URL.replace(/\/api$/, '')}${image.startsWith('/') ? '' : '/'}${image}`;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('files', file);
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_URL}/upload/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    const url =
      json.data?.[0]?.url ||
      json.data?.urls?.[0] ||
      (Array.isArray(json.data) ? json.data[0] : null);
    if (!url || typeof url !== 'string') throw new Error('No image URL returned');
    return url;
  };

  const createCategory = async (n: string, parent?: string) => {
    if (!n.trim()) {
      toast.error('Name required');
      return;
    }
    setBusy(true);
    try {
      await api.post('/categories', {
        name: n.trim(),
        parentId: parent || null,
      });
      toast.success(parent ? 'Subcategory created' : 'Category created — it will show on the shop');
      setName('');
      setParentId('');
      if (parent) setSubName((s) => ({ ...s, [parent]: '' }));
      loadCats();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const uploadCategoryImage = async (categoryId: string, file: File) => {
    try {
      const url = await uploadFile(file);
      await api.patch(`/categories/${categoryId}`, { image: url });
      toast.success('Image updated');
      loadCats();
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    }
  };

  const removeCategory = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Deleted');
      loadCats();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const saveKey = async (key: string, value: unknown) => {
    setSaving(true);
    try {
      await api.put(`/settings/${key}`, { value, group: 'store' });
      toast.success('Saved');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'homepage', label: 'Homepage sections', icon: LayoutGrid },
    { id: 'slider', label: 'Hero slider', icon: Images },
    { id: 'branding', label: 'Logo & favicon', icon: Palette },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Categories, homepage, slider ads, and brand assets
        </p>
      </div>

      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
              tab === t.id ? 'bg-[#2F6B52] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* CATEGORIES */}
      {tab === 'categories' && (
        <>
          <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus size={16} className="text-[#C4A227]" />
              Add top-level category
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flowers, Perfumes, Gifts"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/40"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => createCategory(name)}
                className="rounded-xl bg-[#2F6B52] hover:bg-[#275a45] text-white text-sm font-medium px-5 py-2.5 disabled:opacity-50"
              >
                Create category
              </button>
            </div>
            <p className="text-xs text-gray-500">
              New top-level categories appear on the homepage tiles and shop category strip.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : (
              roots.map((root) => (
                <div key={root.id} className="rounded-2xl border border-white/5 bg-[#161b22] overflow-hidden">
                  <div className="flex items-center gap-4 p-4 border-b border-white/5">
                    <button
                      type="button"
                      onClick={() => fileRefs.current[root.id]?.click()}
                      className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#2F6B52]/40 shrink-0 group"
                    >
                      {imgSrc(root.image) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc(root.image)!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-white/70 text-xs px-1 text-center">
                          {root.name.slice(0, 12)}
                        </span>
                      )}
                      <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <ImagePlus size={18} className="text-white" />
                      </span>
                    </button>
                    <input
                      ref={(el) => {
                        fileRefs.current[root.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCategoryImage(root.id, f);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{root.name}</p>
                      <p className="text-xs text-gray-500">/{root.slug} · top-level</p>
                    </div>
                    <button type="button" onClick={() => removeCategory(root.id, root.name)} className="p-2 text-gray-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      {childrenOf(root.id).map((ch) => (
                        <div key={ch.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                          <button
                            type="button"
                            onClick={() => fileRefs.current[ch.id]?.click()}
                            className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/5 shrink-0"
                          >
                            {imgSrc(ch.image) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imgSrc(ch.image)!} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <ImagePlus size={14} className="text-gray-500" />
                              </span>
                            )}
                          </button>
                          <input
                            ref={(el) => {
                              fileRefs.current[ch.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadCategoryImage(ch.id, f);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{ch.name}</p>
                            <p className="text-[10px] text-gray-500">subcategory</p>
                          </div>
                          <button type="button" onClick={() => removeCategory(ch.id, ch.name)} className="text-gray-600 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add subcategory inside this category */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-white/5">
                      <input
                        value={subName[root.id] || ''}
                        onChange={(e) => setSubName((s) => ({ ...s, [root.id]: e.target.value }))}
                        placeholder={`Add subcategory under ${root.name}…`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => createCategory(subName[root.id] || '', root.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-4 py-2"
                      >
                        <Plus size={14} /> Add subcategory
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* HOMEPAGE SECTIONS */}
      {tab === 'homepage' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setSections((prev) => ({
                  blocks: [
                    ...prev.blocks,
                    {
                      title: 'New section',
                      links: [{ label: 'Link', href: '/shop', image: null }],
                    },
                  ],
                }))
              }
              className="rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs px-3 py-2"
            >
              + Add section
            </button>
          </div>

          {sections.blocks.map((block, bi) => (
            <div key={bi} className="rounded-2xl border border-white/5 bg-[#161b22] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  value={block.title}
                  onChange={(e) => {
                    setSections((prev) => {
                      const next = structuredClone(prev);
                      next.blocks[bi].title = e.target.value;
                      return next;
                    });
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-semibold"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSections((prev) => ({
                      blocks: prev.blocks.filter((_, i) => i !== bi),
                    }))
                  }
                  className="text-gray-500 hover:text-red-400 p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {block.links.map((link, li) => (
                  <div key={li} className="rounded-xl border border-white/10 p-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => fileRefs.current[`sec-${bi}-${li}`]?.click()}
                      className="relative w-full aspect-square rounded-lg overflow-hidden bg-white/5"
                    >
                      {link.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc(link.image)!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-500">
                          <ImagePlus size={18} />
                          <span className="text-[10px]">Photo</span>
                        </span>
                      )}
                    </button>
                    <input
                      ref={(el) => {
                        fileRefs.current[`sec-${bi}-${li}`] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const url = await uploadFile(f);
                          setSections((prev) => {
                            const next = structuredClone(prev);
                            next.blocks[bi].links[li].image = url;
                            return next;
                          });
                          toast.success('Image set');
                        } catch (err: any) {
                          toast.error(err.message);
                        }
                      }}
                    />
                    <input
                      value={link.label}
                      onChange={(e) => {
                        setSections((prev) => {
                          const next = structuredClone(prev);
                          next.blocks[bi].links[li].label = e.target.value;
                          return next;
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      placeholder="Label"
                    />
                    <input
                      value={link.href}
                      onChange={(e) => {
                        setSections((prev) => {
                          const next = structuredClone(prev);
                          next.blocks[bi].links[li].href = e.target.value;
                          return next;
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-400"
                      placeholder="/shop?..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSections((prev) => {
                          const next = structuredClone(prev);
                          next.blocks[bi].links = next.blocks[bi].links.filter((_, i) => i !== li);
                          return next;
                        })
                      }
                      className="text-[10px] text-red-400/80 hover:text-red-400"
                    >
                      Remove tile
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSections((prev) => {
                    const next = structuredClone(prev);
                    next.blocks[bi].links.push({ label: 'New', href: '/shop', image: null });
                    return next;
                  })
                }
                className="text-xs text-[#5aa882] hover:underline"
              >
                + Add tile
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={saving}
            onClick={() => saveKey('home_sections', sections)}
            className="rounded-xl bg-[#2F6B52] hover:bg-[#275a45] text-white text-sm font-medium px-6 py-2.5 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save homepage sections'}
          </button>
        </div>
      )}

      {/* HERO SLIDER */}
      {tab === 'slider' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Amazon-style sliding ads at the top of the homepage. Wide images work best (e.g. 1600×400).
          </p>
          {slides.map((slide, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-[#161b22] p-4 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => fileRefs.current[`slide-${i}`]?.click()}
                className="relative w-full sm:w-48 h-28 rounded-xl overflow-hidden bg-white/5 shrink-0"
              >
                {slide.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgSrc(slide.image)!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                    Upload slide
                  </span>
                )}
              </button>
              <input
                ref={(el) => {
                  fileRefs.current[`slide-${i}`] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const url = await uploadFile(f);
                    setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, image: url } : s)));
                    toast.success('Slide image set');
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              />
              <div className="flex-1 space-y-2">
                <input
                  value={slide.title}
                  onChange={(e) =>
                    setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, title: e.target.value } : s)))
                  }
                  placeholder="Title"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  value={slide.subtitle}
                  onChange={(e) =>
                    setSlides((prev) =>
                      prev.map((s, idx) => (idx === i ? { ...s, subtitle: e.target.value } : s)),
                    )
                  }
                  placeholder="Subtitle"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300"
                />
                <input
                  value={slide.link}
                  onChange={(e) =>
                    setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, link: e.target.value } : s)))
                  }
                  placeholder="/shop or https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={() => setSlides((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-gray-500 hover:text-red-400 self-start p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setSlides((prev) => [
                  ...prev,
                  { image: '', title: '', subtitle: '', link: '/shop' },
                ])
              }
              className="rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs px-3 py-2"
            >
              + Add slide
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveKey('hero_slides', slides)}
              className="rounded-xl bg-[#2F6B52] hover:bg-[#275a45] text-white text-sm font-medium px-6 py-2 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save slider'}
            </button>
          </div>
        </div>
      )}

      {/* BRANDING */}
      {tab === 'branding' && (
        <div className="rounded-2xl border border-white/5 bg-[#161b22] p-5 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Store name</label>
              <input
                value={branding.storeName}
                onChange={(e) => setBranding((b) => ({ ...b, storeName: e.target.value }))}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Tagline</label>
              <input
                value={branding.tagline}
                onChange={(e) => setBranding((b) => ({ ...b, tagline: e.target.value }))}
                placeholder="e.g. Gifts that feel personal"
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400">Title colour</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={branding.titleColor || '#111827'}
                  onChange={(e) => setBranding((b) => ({ ...b, titleColor: e.target.value }))}
                  className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  value={branding.titleColor}
                  onChange={(e) => setBranding((b) => ({ ...b, titleColor: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400">Tagline colour</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={branding.taglineColor || '#C4A227'}
                  onChange={(e) => setBranding((b) => ({ ...b, taglineColor: e.target.value }))}
                  className="h-10 w-12 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  value={branding.taglineColor}
                  onChange={(e) => setBranding((b) => ({ ...b, taglineColor: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400">Title font</label>
              <select
                value={branding.titleFont || 'system-ui'}
                onChange={(e) => setBranding((b) => ({ ...b, titleFont: e.target.value }))}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="system-ui" className="bg-[#161b22]">System default</option>
                <option value="Georgia, serif" className="bg-[#161b22]">Georgia (serif)</option>
                <option value="'Times New Roman', Times, serif" className="bg-[#161b22]">Times New Roman</option>
                <option value="Arial, Helvetica, sans-serif" className="bg-[#161b22]">Arial</option>
                <option value="'Segoe UI', Tahoma, sans-serif" className="bg-[#161b22]">Segoe UI</option>
                <option value="Verdana, Geneva, sans-serif" className="bg-[#161b22]">Verdana</option>
                <option value="'Trebuchet MS', sans-serif" className="bg-[#161b22]">Trebuchet</option>
                <option value="'Courier New', monospace" className="bg-[#161b22]">Courier New</option>
                <option value="Impact, sans-serif" className="bg-[#161b22]">Impact</option>
              </select>
            </div>
          </div>
          <div
            className="rounded-xl border border-white/10 bg-white px-4 py-3"
            style={{ fontFamily: branding.titleFont || 'inherit' }}
          >
            <p className="text-xs text-gray-500 mb-1">Preview</p>
            <p className="text-2xl font-bold" style={{ color: branding.titleColor || '#111' }}>
              {branding.storeName || 'Rexus Gift'}
            </p>
            {branding.tagline && (
              <p className="text-sm mt-0.5" style={{ color: branding.taglineColor || '#C4A227' }}>
                {branding.tagline}
              </p>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-2">Shop logo</p>
              <button
                type="button"
                onClick={() => fileRefs.current.logo?.click()}
                className="w-full h-28 rounded-xl border border-dashed border-white/15 bg-white/5 flex items-center justify-center overflow-hidden"
              >
                {branding.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgSrc(branding.logo)!} alt="Logo" className="max-h-24 object-contain" />
                ) : (
                  <span className="text-gray-500 text-sm flex items-center gap-2">
                    <ImagePlus size={18} /> Upload logo
                  </span>
                )}
              </button>
              <input
                ref={(el) => {
                  fileRefs.current.logo = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const url = await uploadFile(f);
                    setBranding((b) => ({ ...b, logo: url }));
                    toast.success('Logo set');
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Favicon</p>
              <button
                type="button"
                onClick={() => fileRefs.current.favicon?.click()}
                className="w-full h-28 rounded-xl border border-dashed border-white/15 bg-white/5 flex items-center justify-center overflow-hidden"
              >
                {branding.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgSrc(branding.favicon)!} alt="Favicon" className="h-12 w-12 object-contain" />
                ) : (
                  <span className="text-gray-500 text-sm flex items-center gap-2">
                    <ImagePlus size={18} /> Upload favicon
                  </span>
                )}
              </button>
              <input
                ref={(el) => {
                  fileRefs.current.favicon = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const url = await uploadFile(f);
                    setBranding((b) => ({ ...b, favicon: url }));
                    toast.success('Favicon set');
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveKey('branding', branding)}
            className="rounded-xl bg-[#2F6B52] hover:bg-[#275a45] text-white text-sm font-medium px-6 py-2.5 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save branding'}
          </button>
        </div>
      )}
    </div>
  );
}
