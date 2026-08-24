'use client';

import { useEffect } from 'react';
import api from '@/lib/api';

export function BrandingEffects() {
  useEffect(() => {
    api
      .get('/settings/public?keys=branding')
      .then((res) => {
        const b = res.data?.data?.branding;
        if (!b) return;
        if (b.favicon) {
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = b.favicon;
        }
        if (b.titleColor) {
          document.documentElement.style.setProperty('--brand-title', b.titleColor);
        }
        if (b.taglineColor) {
          document.documentElement.style.setProperty('--brand-tagline', b.taglineColor);
        }
        if (b.titleFont) {
          document.documentElement.style.setProperty('--brand-font', b.titleFont);
        }
        window.dispatchEvent(new CustomEvent('rexus-branding', { detail: b }));
      })
      .catch(() => {});
  }, []);
  return null;
}
