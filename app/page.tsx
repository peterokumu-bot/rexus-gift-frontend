import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';

async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products?featured=true&limit=8`,
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
    return (json.data || []).filter((c: any) => !c.parentId).slice(0, 8);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div>
      <section className="relative bg-gradient-to-br from-jungle-800 via-jungle-700 to-jungle-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-jungle-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <p className="text-gold-400 font-medium tracking-wide uppercase text-sm mb-3">
              Premium Gifts · Kenya
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight">
              Make Every Moment Special
            </h1>
            <p className="mt-5 text-lg text-jungle-100 leading-relaxed max-w-lg">
              Thoughtfully chosen gifts for the people who matter most. Flowers, hampers,
              personalized presents and more — delivered with care.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center bg-gold-500 hover:bg-gold-400 text-jungle-900 font-semibold px-8 py-3.5 rounded-full transition-colors"
              >
                Shop Gifts
              </Link>
              <Link
                href="/shop?tag=bestseller"
                className="inline-flex items-center border-2 border-white/30 hover:border-white/60 text-white font-medium px-8 py-3.5 rounded-full transition-colors"
              >
                Explore Collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">
                Shop by Category
              </h2>
              <p className="mt-1 text-gray-500">Find the perfect gift for any occasion</p>
            </div>
            <Link href="/categories" className="text-jungle-600 font-medium hover:underline hidden sm:block">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-jungle-50 border border-jungle-100 hover:border-jungle-300 transition"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-jungle-900/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold group-hover:text-gold-300 transition">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">
                Featured Gifts
              </h2>
              <p className="mt-1 text-gray-500">Handpicked favourites our customers love</p>
            </div>
            <Link href="/shop?featured=true" className="text-jungle-600 font-medium hover:underline hidden sm:block">
              View all →
            </Link>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p>Products will appear here once the backend is running and seeded.</p>
              <p className="text-sm mt-2">Start the API and run the seed script.</p>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900 mb-8 text-center">
          Shop by Occasion
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: 'Birthday', slug: 'birthday' },
            { label: 'Anniversary', slug: 'anniversary' },
            { label: "Valentine's", slug: 'valentines-day' },
            { label: 'Wedding', slug: 'wedding' },
            { label: 'Graduation', slug: 'graduation' },
            { label: "Mother's Day", slug: 'mothers-day' },
            { label: 'Corporate', slug: 'congratulations' },
            { label: 'Get Well', slug: 'get-well-soon' },
          ].map((o) => (
            <Link
              key={o.slug}
              href={`/shop?occasion=${o.slug}`}
              className="px-5 py-2.5 rounded-full border border-jungle-200 text-jungle-700 hover:bg-jungle-500 hover:text-white hover:border-jungle-500 transition-colors font-medium text-sm"
            >
              {o.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-jungle-500 py-14">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-serif font-bold text-white">Stay Inspired</h2>
          <p className="mt-2 text-jungle-100">
            Gift ideas, exclusive offers and seasonal collections — delivered to your inbox.
          </p>
          <form className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 rounded-full px-5 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
              required
            />
            <button
              type="submit"
              className="bg-gold-500 hover:bg-gold-400 text-jungle-900 font-semibold px-8 py-3 rounded-full transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
