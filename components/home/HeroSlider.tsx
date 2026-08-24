'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Slide = {
  image?: string;
  title?: string;
  subtitle?: string;
  link?: string;
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const list = slides?.length ? slides : [{ title: 'Rexus Gift', subtitle: 'Shop now', link: '/shop' }];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % list.length), 5500);
    return () => clearInterval(t);
  }, [list.length]);

  const s = list[i] || list[0];
  const href = s.link || '/shop';

  return (
    <div className="relative w-full overflow-hidden rounded-sm shadow-sm bg-gradient-to-r from-[#2F6B52] to-[#1a3b2e] min-h-[160px] sm:min-h-[220px] lg:min-h-[280px]">
      {s.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.image}
          alt={s.title || 'Promo'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      <div
        className={`relative z-10 flex items-center min-h-[160px] sm:min-h-[220px] lg:min-h-[280px] px-8 sm:px-14 lg:px-20 ${
          s.image ? 'bg-black/35' : ''
        }`}
      >
        <div className="max-w-lg text-white">
          {s.title && (
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight drop-shadow">
              {s.title}
            </h1>
          )}
          {s.subtitle && (
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/90 max-w-md">{s.subtitle}</p>
          )}
          <Link
            href={href}
            className="mt-4 sm:mt-6 inline-flex bg-[#C4A227] hover:bg-[#d4b84a] text-[#1a3b2e] font-semibold text-sm px-5 py-2.5 rounded-md transition"
          >
            Shop now
          </Link>
        </div>
      </div>

      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setI((x) => (x - 1 + list.length) % list.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-gray-800"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setI((x) => (x + 1) % list.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-gray-800"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {list.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
