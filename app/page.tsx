import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';

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
  const [featured, categories, products] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getProducts(14),
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
                  }))
                : FALLBACK_TILES[i % FALLBACK_TILES.length].items,
          };
        })
      : FALLBACK_TILES;

  return (
    <div className="bg-[#eaeded] min-h-screen">
      {/* Hero strip */}
      <section className="bg-gradient-to-r from-[#2F6B52] to-[#1a3b2e] text-white">
        <div className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 py-10 sm:py-14">
          <div className="max-w-xl">
            <p className="text-[#C4A227] text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2">
              Rexus Gift · Kenya
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Gifts that feel personal
            </h1>
            <p className="mt-3 text-white/80 text-sm sm:text-base max-w-md">
              Flowers, hampers, and curated presents — delivered across Kenya.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex bg-[#C4A227] hover:bg-[#d4b84a] text-[#1a3b2e] font-semibold text-sm px-6 py-2.5 rounded-md transition"
            >
              Shop all gifts
            </Link>
          </div>
        </div>
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
                  {tile.items.slice(0, 3).map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-center group"
                    >
                      <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden mb-1 border border-gray-100">
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 group-hover:bg-[#2F6B52]/5 transition">
                          {item.label.slice(0, 8)}
                        </div>
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
          {[
            {
              title: 'Shop by occasion',
              links: [
                { label: 'Birthday', href: '/shop?occasion=birthday' },
                { label: 'Anniversary', href: '/shop?occasion=anniversary' },
                { label: "Valentine's", href: '/shop?occasion=valentines-day' },
                { label: 'Wedding', href: '/shop?occasion=wedding' },
                { label: 'Graduation', href: '/shop?occasion=graduation' },
                { label: 'Corporate', href: '/shop?search=corporate' },
              ],
            },
            {
              title: 'Popular right now',
              links: [
                { label: 'Best sellers', href: '/shop?tag=bestseller' },
                { label: 'New arrivals', href: '/shop?tag=new-arrival' },
                { label: 'Under KSh 2,000', href: '/shop' },
                { label: 'Personalized', href: '/shop?search=personalized' },
                { label: 'Same-day Nairobi', href: '/shop' },
                { label: 'Gift cards', href: '/shop' },
              ],
            },
          ].map((block) => (
            <div key={block.title} className="bg-white rounded-sm shadow-sm p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{block.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {block.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="w-full aspect-square max-h-28 bg-gradient-to-br from-[#2F6B52]/10 to-[#C4A227]/10 rounded-sm border border-gray-100 flex items-center justify-center mb-2 group-hover:border-[#2F6B52]/40 transition">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-[#2F6B52] px-2">
                        {l.label}
                      </span>
                    </div>
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
