import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { HeroSlider } from '@/components/home/HeroSlider';

async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products?featured=true&limit=14`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function getHeroSlides() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${base}/settings/public?keys=hero_slides`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    const v = json?.data?.hero_slides;
    if (Array.isArray(v)) return v;
    if (v?.slides) return v.slides;
    return [];
  } catch {
    return [];
  }
}

async function getHomeSections() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${base}/settings/public?keys=home_sections`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.home_sections || null;
  } catch {
    return null;
  }
}

async function getCategories() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/categories`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function getProducts(limit = 8) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products?limit=${limit}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

const FALLBACK_TILES = [
  {
    title: 'Flowers & Bouquets',
    href: '/shop?category=flowers',
    image: 'https://placehold.co/600x600/2F6B52/FFFFFF?text=Flowers',
    items: [
      { label: 'Roses', href: '/shop?search=rose' },
      { label: 'Mixed bouquets', href: '/shop?search=bouquet' },
      { label: 'Same day', href: '/shop?tag=same-day' },
    ],
  },
  {
    title: 'Gift Hampers',
    href: '/shop?category=hampers',
    image: 'https://placehold.co/600x600/C4A227/1a3b2e?text=Hampers',
    items: [
      { label: 'Corporate', href: '/shop?search=corporate' },
      { label: 'Gourmet', href: '/shop?search=gourmet' },
      { label: 'Celebration', href: '/shop?search=celebration' },
    ],
  },
  {
    title: 'For Her',
    href: '/shop?recipient=for-her',
    image: 'https://placehold.co/600x600/9B59B6/FFFFFF?text=For+Her',
    items: [
      { label: 'Jewellery', href: '/shop?search=jewellery' },
      { label: 'Spa sets', href: '/shop?search=spa' },
      { label: 'Personalized', href: '/shop?search=personalized' },
    ],
  },
  {
    title: 'For Him',
    href: '/shop?recipient=for-him',
    image: 'https://placehold.co/600x600/34495E/FFFFFF?text=For+Him',
    items: [
      { label: 'Grooming', href: '/shop?search=grooming' },
      { label: 'Tech gifts', href: '/shop?search=tech' },
      { label: 'Watches', href: '/shop?search=watch' },
    ],
  },
];

export default async function HomePage() {
  const [featured, categories, products, homeSections, heroSlides] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getProducts(14),
    getHomeSections(),
    getHeroSlides(),
  ]);

  const roots = (categories as any[]).filter((c) => !c.parentId);
  const gridProducts = featured.length ? featured : products;

  // Build Amazon-style tiles from API categories when available
  const categoryTiles =
    roots.length > 0
      ? roots.slice(0, 8).map((c: any, i: number) => {
          const children = (categories as any[]).filter((x) => x.parentId === c.id).slice(0, 4);
          const img =
            c.image ||
            c.imageUrl ||
            `https://placehold.co/600x600/2F6B52/FFFFFF?text=${encodeURIComponent(c.name.slice(0, 12))}`;
          return {
            title: c.name,
            href: `/shop?category=${c.slug}`,
            image: img,
            items:
              children.length > 0
                ? children.map((ch: any) => ({
                    label: ch.name,
                    href: `/shop?category=${ch.slug}`,
                    image: ch.image || null,
                  }))
                : FALLBACK_TILES[i % FALLBACK_TILES.length].items,
          };
        })
      : FALLBACK_TILES;

  return (
    <div className="bg-[#eaeded] min-h-screen">
      {/* Hero slider */}
      <section className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
        <HeroSlider
          slides={
            (heroSlides as any[])?.length
              ? (heroSlides as any[])
              : [
                  {
                    image: '',
                    title: 'Gifts that feel personal',
                    subtitle: 'Flowers, hampers & curated presents — delivered across Kenya',
                    link: '/shop',
                  },
                ]
          }
        />
      </section>

      {/* Category groups — Amazon-style large cards */}
      <section className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 -mt-4 sm:-mt-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {categoryTiles.map((tile) => (
            <div
              key={tile.title}
              className="bg-white rounded-sm shadow-sm p-4 sm:p-5 flex flex-col min-h-[320px] sm:min-h-[380px]"
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 leading-snug">
                {tile.title}
              </h2>

              {/* Big main image */}
              <Link href={tile.href} className="block flex-1 mb-3 group">
                <div className="relative w-full aspect-[4/3] sm:aspect-square overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              </Link>

              {/* Nested links */}
              {tile.items?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {tile.items.slice(0, 3).map((item: any) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-center group"
                    >
                      <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden mb-1 border border-gray-100">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 group-hover:bg-[#2F6B52]/5 transition">
                            {item.label.slice(0, 8)}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] sm:text-xs text-gray-700 group-hover:text-[#2F6B52] line-clamp-1">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <Link
                href={tile.href}
                className="text-sm text-[#2162a1] hover:text-[#C4A227] hover:underline mt-auto"
              >
                Shop {tile.title}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Second row of category highlights */}
      <section className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 mt-3 sm:mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {(
            (homeSections as any)?.blocks ||
            [
              {
                title: 'Shop by occasion',
                links: [
                  { label: 'Birthday', href: '/shop?occasion=birthday', image: null },
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
            ]
          ).map((block: any) => (
            <div key={block.title} className="bg-white rounded-sm shadow-sm p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{block.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(block.links || []).map((l: any) => (
                  <Link
                    key={l.label}
                    href={l.href || '/shop'}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="w-full aspect-square max-h-28 bg-gradient-to-br from-[#2F6B52]/10 to-[#C4A227]/10 rounded-sm border border-gray-100 overflow-hidden flex items-center justify-center mb-2 group-hover:border-[#2F6B52]/40 transition">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt={l.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-[#2F6B52] px-2">
                          {l.label}
                        </span>
                      )}
                    </div>
                    {l.image && (
                      <span className="text-[11px] text-gray-700 group-hover:text-[#2F6B52] line-clamp-1">{l.label}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product strip */}
      <section className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-sm shadow-sm p-4 sm:p-5">
          <div className="flex items-end justify-between mb-4 gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Featured gifts</h2>
              <p className="text-sm text-gray-500">Handpicked for you</p>
            </div>
            <Link href="/shop" className="text-sm text-[#2162a1] hover:underline whitespace-nowrap">
              See all
            </Link>
          </div>

          {gridProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
              {gridProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="text-center py-12 text-gray-500 text-sm">
              Products appear when the API is running and seeded.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 pb-10">
        <div className="bg-[#2F6B52] rounded-sm p-6 sm:p-8 text-center text-white">
          <h2 className="text-xl sm:text-2xl font-bold">Need help choosing?</h2>
          <p className="mt-2 text-white/80 text-sm sm:text-base">
            Browse by occasion or chat with us for a curated recommendation.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="bg-white text-[#2F6B52] font-semibold text-sm px-5 py-2.5 rounded-md hover:bg-gray-100 transition"
            >
              Browse shop
            </Link>
            <Link
              href="/contact"
              className="border border-white/40 text-white font-medium text-sm px-5 py-2.5 rounded-md hover:bg-white/10 transition"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
