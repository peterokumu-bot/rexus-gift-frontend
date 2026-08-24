import type { Metadata } from 'next';
import { Caveat } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { BrandingEffects } from '@/components/layout/BrandingEffects';

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Rexus Gift | Thoughtfully Chosen Gifts',
    template: '%s | Rexus Gift',
  },
  description:
    'Make every moment special with thoughtfully chosen gifts for the people who matter most. Premium flowers, hampers, personalized gifts and more — delivered across Kenya.',
  keywords: ['gifts Kenya', 'flowers Nairobi', 'gift hampers', 'personalized gifts', 'Rexus Gift'],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'Rexus Gift',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={caveat.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <BrandingEffects />
          <SiteChrome>{children}</SiteChrome>
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
