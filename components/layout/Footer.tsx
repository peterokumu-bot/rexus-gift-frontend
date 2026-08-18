import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-jungle-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-serif font-bold">Rexus</span>
              <span className="text-gold-400 text-lg">Gift</span>
            </div>
            <p className="text-jungle-100 text-sm leading-relaxed">
              Thoughtfully chosen gifts for the people who matter most. Delivering joy across Kenya.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gold-400 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-jungle-100">
              <li><Link href="/shop" className="hover:text-white transition">All Gifts</Link></li>
              <li><Link href="/shop?category=flowers" className="hover:text-white transition">Flowers</Link></li>
              <li><Link href="/shop?category=gift-hampers" className="hover:text-white transition">Gift Hampers</Link></li>
              <li><Link href="/shop?category=personalized-gifts" className="hover:text-white transition">Personalized</Link></li>
              <li><Link href="/shop?category=corporate-gifts" className="hover:text-white transition">Corporate</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gold-400 mb-4">Occasions</h4>
            <ul className="space-y-2 text-sm text-jungle-100">
              <li><Link href="/shop?occasion=birthday" className="hover:text-white transition">Birthday</Link></li>
              <li><Link href="/shop?occasion=anniversary" className="hover:text-white transition">Anniversary</Link></li>
              <li><Link href="/shop?occasion=valentines-day" className="hover:text-white transition">Valentine&apos;s Day</Link></li>
              <li><Link href="/shop?occasion=graduation" className="hover:text-white transition">Graduation</Link></li>
              <li><Link href="/shop?occasion=wedding" className="hover:text-white transition">Wedding</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gold-400 mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-jungle-100">
              <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition">Delivery Info</Link></li>
              <li><Link href="/returns" className="hover:text-white transition">Returns</Link></li>
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
            </ul>
            <p className="mt-4 text-sm text-jungle-200">
              +254 700 000 000<br />
              hello@rexusgift.com
            </p>
          </div>
        </div>

        <div className="border-t border-jungle-700 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-jungle-200">
          <p>© {new Date().getFullYear()} Rexus Gift. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
